from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    content = path.read_text(encoding="utf-8")
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match in {path}, found {count}")
    path.write_text(content.replace(old, new), encoding="utf-8")


metrics_path = Path("src/lib/knee-metrics.ts")
replace_once(
    metrics_path,
    '''export function getNormGap(test: NormGapInput | null | undefined) {
  if (!test) return null;

  const targetKg = targetForceKg(test.shinLengthCm, test.bodyWeightKg);

  if (
    test.leftNmPerKg === null ||
    test.rightNmPerKg === null ||
    test.leftForceKg === null ||
    test.rightForceKg === null ||
    targetKg === null
  ) {
    return null;
  }

  const weakerNm = Math.min(test.leftNmPerKg, test.rightNmPerKg);
  const weakerForce = Math.min(test.leftForceKg, test.rightForceKg);
  const missingNm = Math.max(0, NORM_NM_PER_KG - weakerNm);

  return {
    missingKg: Math.max(0, targetKg - weakerForce),
    missingNm,
    missingPct: (missingNm / NORM_NM_PER_KG) * 100,
  };
}
''',
    '''export function getNormGap(test: NormGapInput | null | undefined) {
  if (!test) return null;

  const targetKg = targetForceKg(test.shinLengthCm, test.bodyWeightKg);

  if (
    test.leftNmPerKg === null ||
    !Number.isFinite(test.leftNmPerKg) ||
    test.leftNmPerKg <= 0 ||
    test.rightNmPerKg === null ||
    !Number.isFinite(test.rightNmPerKg) ||
    test.rightNmPerKg <= 0 ||
    test.leftForceKg === null ||
    !Number.isFinite(test.leftForceKg) ||
    test.leftForceKg <= 0 ||
    test.rightForceKg === null ||
    !Number.isFinite(test.rightForceKg) ||
    test.rightForceKg <= 0 ||
    targetKg === null ||
    !Number.isFinite(targetKg) ||
    targetKg <= 0 ||
    !Number.isFinite(NORM_NM_PER_KG) ||
    NORM_NM_PER_KG <= 0
  ) {
    return null;
  }

  const weakerIsLeft = test.leftNmPerKg <= test.rightNmPerKg;
  const weakerNmPerKg = weakerIsLeft ? test.leftNmPerKg : test.rightNmPerKg;
  const weakerForceKg = weakerIsLeft ? test.leftForceKg : test.rightForceKg;
  const weakerSide: WeakerSide =
    test.leftNmPerKg === test.rightNmPerKg
      ? "none"
      : weakerIsLeft
        ? "left"
        : "right";
  const completionPct = (weakerNmPerKg / NORM_NM_PER_KG) * 100;

  if (!Number.isFinite(completionPct)) return null;

  return {
    weakerSide,
    weakerForceKg,
    weakerNmPerKg,
    missingKg: Math.max(0, targetKg - weakerForceKg),
    missingNm: Math.max(0, NORM_NM_PER_KG - weakerNmPerKg),
    completionPct,
  };
}
''',
)

component_path = Path("src/app/components/KneeDashboard.tsx")
replace_once(
    component_path,
    '''                <div>
                  <span>Chybi</span>
                  <strong>{formatPercent(latestNormGap?.missingPct)}</strong>
                </div>''',
    '''                <div>
                  <span>Splnění</span>
                  <strong>{formatNumber(latestNormGap?.completionPct, 1, " %").replace(".", ",")}</strong>
                </div>''',
)
replace_once(
    component_path,
    '''                        <div className="profile-metric highlight"><span>Chybi do normy</span><strong>{formatPercent(latestNormGap?.missingPct)}</strong><small>{formatNumber(latestNormGap?.missingKg, 1, " kg")} na slabsi strane</small></div>''',
    '''                        <div className="profile-metric highlight"><span>Splnění</span><strong>{formatNumber(latestNormGap?.completionPct, 1, " %").replace(".", ",")}</strong><small>{formatNumber(latestNormGap?.missingKg, 1, " kg").replace(".", ",")} na slabsi strane</small></div>''',
)

test_path = Path("src/lib/knee-metrics.test.ts")
replace_once(
    test_path,
    '''  it("calculates the weaker-side norm gap", () => {
    const gap = getNormGap({
      leftForceKg: 35,
      rightForceKg: 42,
      leftNmPerKg: forceKgToNmPerKg(35, 33, 82),
      rightNmPerKg: forceKgToNmPerKg(42, 33, 82),
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assertClose(gap?.missingKg ?? null, 41.0152086038092);
    assertClose(gap?.missingNm ?? null, 1.6186974695121954);
    assertClose(gap?.missingPct ?? null, 53.95658231707318);
  });
''',
    '''  it("calculates norm completion below 100% from the weaker leg", () => {
    const gap = getNormGap({
      leftForceKg: 40,
      rightForceKg: 45,
      leftNmPerKg: 2.4,
      rightNmPerKg: 2.7,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assert.equal(gap?.weakerSide, "left");
    assertClose(gap?.weakerNmPerKg ?? null, 2.4);
    assertClose(gap?.completionPct ?? null, 80);
  });

  it("calculates exactly 100% norm completion", () => {
    const gap = getNormGap({
      leftForceKg: 50,
      rightForceKg: 55,
      leftNmPerKg: 3,
      rightNmPerKg: 3.2,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assertClose(gap?.completionPct ?? null, 100);
  });

  it("keeps norm completion above 100% uncapped", () => {
    const gap = getNormGap({
      leftForceKg: 82.4,
      rightForceKg: 86,
      leftNmPerKg: 3.252,
      rightNmPerKg: 3.4,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assertClose(gap?.completionPct ?? null, 108.4);
    assert.ok((gap?.completionPct ?? 0) > 100);
  });

  it("uses the force belonging to the genuinely weaker Nm/kg leg", () => {
    const gap = getNormGap({
      leftForceKg: 60,
      rightForceKg: 40,
      leftNmPerKg: 2.1,
      rightNmPerKg: 2.7,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assert.equal(gap?.weakerSide, "left");
    assertClose(gap?.weakerForceKg ?? null, 60);
    assertClose(gap?.completionPct ?? null, 70);
    assertClose(gap?.missingKg ?? null, 16.0152086038092);
  });

  it("returns null for missing, non-finite, zero, or negative norm inputs", () => {
    const validInput = {
      leftForceKg: 40,
      rightForceKg: 45,
      leftNmPerKg: 2.4,
      rightNmPerKg: 2.7,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    };

    assert.equal(getNormGap(null), null);
    assert.equal(getNormGap(undefined), null);
    assert.equal(getNormGap({ ...validInput, leftNmPerKg: null }), null);
    assert.equal(getNormGap({ ...validInput, leftNmPerKg: Number.NaN }), null);
    assert.equal(getNormGap({ ...validInput, rightForceKg: Number.POSITIVE_INFINITY }), null);
    assert.equal(getNormGap({ ...validInput, leftForceKg: 0 }), null);
    assert.equal(getNormGap({ ...validInput, rightNmPerKg: -1 }), null);
    assert.equal(getNormGap({ ...validInput, shinLengthCm: 0 }), null);
    assert.equal(getNormGap({ ...validInput, bodyWeightKg: -82 }), null);
  });
''',
)
