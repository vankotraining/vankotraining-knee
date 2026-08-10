import assert from "node:assert/strict";
import test from "node:test";
import {
  betweenRepCvStatus,
  domainStatus,
  onsetTo95Status,
  recommendationStatus,
  reportFindingStatus,
  successRateStatus,
  targetAchievementStatus,
  technicalFlagRateStatus,
  timeInTargetStatus,
  withinRepCvStatus,
} from "./tindeq-metric-presentation.js";

test("stavový systém má tři hodnoticí tóny a samostatný neutral", () => {
  assert.deepEqual(targetAchievementStatus(100), { label: "V cíli", tone: "good" });
  assert.deepEqual(targetAchievementStatus(92), { label: "Sleduj", tone: "warning" });
  assert.deepEqual(targetAchievementStatus(112), { label: "Mimo cíl", tone: "problem" });
  assert.deepEqual(targetAchievementStatus(null), { label: "Bez hodnocení", tone: "neutral" });
});

test("dosažení cíle používá pracovní pásmo 95 až 105 procent", () => {
  assert.equal(targetAchievementStatus(95).tone, "good");
  assert.equal(targetAchievementStatus(105).tone, "good");
  assert.equal(targetAchievementStatus(94.9).tone, "warning");
  assert.equal(targetAchievementStatus(105.1).tone, "warning");
  assert.equal(targetAchievementStatus(89.9).tone, "problem");
  assert.equal(targetAchievementStatus(110.1).tone, "problem");
});

test("čas v cílovém pásmu zachovává reportové hranice", () => {
  assert.equal(timeInTargetStatus(60).tone, "good");
  assert.equal(timeInTargetStatus(59).tone, "warning");
  assert.equal(timeInTargetStatus(40).tone, "warning");
  assert.equal(timeInTargetStatus(39).tone, "problem");
  assert.equal(timeInTargetStatus(undefined).tone, "neutral");
});

test("úspěšnost opakování zachovává reportové hranice", () => {
  assert.equal(successRateStatus(70).tone, "good");
  assert.equal(successRateStatus(69).tone, "warning");
  assert.equal(successRateStatus(50).tone, "warning");
  assert.equal(successRateStatus(49).tone, "problem");
  assert.equal(successRateStatus(null).tone, "neutral");
});

test("CV uvnitř kontrakce používá pracovní hranice 5 a 8 procent", () => {
  assert.deepEqual(withinRepCvStatus(5), { label: "Stabilní", tone: "good" });
  assert.equal(withinRepCvStatus(5.1).tone, "warning");
  assert.equal(withinRepCvStatus(8).tone, "warning");
  assert.deepEqual(withinRepCvStatus(8.1), { label: "Vysoká variabilita", tone: "problem" });
  assert.equal(withinRepCvStatus(Number.NaN).tone, "neutral");
});

test("CV mezi opakováními používá pracovní hranice 8 a 12 procent", () => {
  assert.equal(betweenRepCvStatus(8).tone, "good");
  assert.equal(betweenRepCvStatus(8.1).tone, "warning");
  assert.equal(betweenRepCvStatus(12).tone, "warning");
  assert.equal(betweenRepCvStatus(12.1).tone, "problem");
  assert.equal(betweenRepCvStatus(null).tone, "neutral");
});

test("Nehodnoceno ani technicky nehodnotitelný finding nejsou červený klinický stav", () => {
  assert.deepEqual(domainStatus("Nehodnoceno"), { label: "Bez hodnocení", tone: "neutral" });
  assert.deepEqual(reportFindingStatus("technicky nehodnotitelné"), {
    label: "Bez hodnocení",
    tone: "neutral",
  });
  assert.deepEqual(recommendationStatus("doplnění údajů před rozhodnutím"), {
    label: "Doplň údaje",
    tone: "neutral",
  });
});

test("technické flagy popisují důvěru v záznam, ne klinický stav", () => {
  assert.deepEqual(technicalFlagRateStatus(10), { label: "Technicky v pořádku", tone: "good" });
  assert.equal(technicalFlagRateStatus(20).tone, "warning");
  assert.deepEqual(technicalFlagRateStatus(31), { label: "Nízká důvěra", tone: "problem" });
  assert.equal(technicalFlagRateStatus(null).tone, "neutral");
});

test("náběh na 95 procent používá pouze technické pracovní pravidlo", () => {
  assert.equal(onsetTo95Status(1, 5).tone, "good");
  assert.deepEqual(onsetTo95Status(2.1, 5), { label: "Pomalý náběh", tone: "warning" });
  assert.deepEqual(onsetTo95Status(null, 5), { label: "Cíl nedosažen", tone: "problem" });
  assert.equal(onsetTo95Status(1, null).tone, "neutral");
  assert.equal(onsetTo95Status(null, null).tone, "neutral");
});
