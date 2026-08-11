import assert from "node:assert/strict";
import test from "node:test";
import {
  athleteNameKey,
  prepareAthleteIdentity,
  reconcileAthleteIdentityUpdate,
} from "./athlete-identity.js";

test("prepareAthleteIdentity trims display name and creates the same normalized name_key", () => {
  assert.equal(athleteNameKey("  Žaneta Nováková  "), "zaneta-novakova");
  assert.deepEqual(prepareAthleteIdentity("  Žaneta Nováková  "), {
    payload: {
      display_name: "Žaneta Nováková",
      name_key: "zaneta-novakova",
    },
    error: null,
  });
});

test("prepareAthleteIdentity rejects an empty or whitespace-only display name", () => {
  assert.deepEqual(prepareAthleteIdentity("   \t\n  "), {
    payload: null,
    error: "Jméno klienta nesmí být prázdné.",
  });
});

test("prepareAthleteIdentity rejects a name that cannot produce a non-empty name_key", () => {
  assert.deepEqual(prepareAthleteIdentity(" --- "), {
    payload: null,
    error: "Jméno klienta musí obsahovat alespoň písmeno nebo číslo.",
  });
});

test("successful identity update changes only the requested athlete", () => {
  const first = { id: "a-1", display_name: "Původní", name_key: "puvodni", note: "A" };
  const second = { id: "a-2", display_name: "Jiný", name_key: "jiny", note: "B" };
  const current = [first, second];
  const updated = {
    id: "a-1",
    display_name: "Nové jméno",
    name_key: "nove-jmeno",
    note: "A",
  };

  const result = reconcileAthleteIdentityUpdate(current, "a-1", updated, null);

  assert.equal(result.errorMessage, null);
  assert.equal(result.updatedAthlete, updated);
  assert.deepEqual(result.athletes, [updated, second]);
  assert.equal(result.athletes[1], second);
});

test("database error keeps the original local state untouched", () => {
  const current = [
    { id: "a-1", display_name: "Původní", name_key: "puvodni" },
    { id: "a-2", display_name: "Jiný", name_key: "jiny" },
  ];

  const result = reconcileAthleteIdentityUpdate(
    current,
    "a-1",
    null,
    { code: "XX000", message: "database failure" },
  );

  assert.equal(result.athletes, current);
  assert.equal(result.updatedAthlete, null);
  assert.match(result.errorMessage ?? "", /Původní jméno zůstalo beze změny/);
});

test("name_key conflict returns a friendly error and keeps local state untouched", () => {
  const current = [
    { id: "a-1", display_name: "Původní", name_key: "puvodni" },
    { id: "a-2", display_name: "Kolize", name_key: "kolize" },
  ];

  const result = reconcileAthleteIdentityUpdate(
    current,
    "a-1",
    null,
    { code: "23505", message: "duplicate key value violates unique constraint" },
  );

  assert.equal(result.athletes, current);
  assert.equal(result.updatedAthlete, null);
  assert.equal(
    result.errorMessage,
    "Klient se stejným jménem už existuje. Zvol jiné jméno.",
  );
});

test("unexpected athlete id fails closed and preserves local state", () => {
  const current = [
    { id: "a-1", display_name: "Původní", name_key: "puvodni" },
  ];
  const unexpected = {
    id: "a-2",
    display_name: "Neočekávaný",
    name_key: "neocekavany",
  };

  const result = reconcileAthleteIdentityUpdate(
    current,
    "a-1",
    unexpected,
    null,
  );

  assert.equal(result.athletes, current);
  assert.equal(result.updatedAthlete, null);
  assert.match(result.errorMessage ?? "", /Původní jméno zůstalo beze změny/);
});
