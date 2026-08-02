import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTindeqDemoReport,
  TINDEQ_DEMO_ATHLETE_NAME,
  TINDEQ_DEMO_CONTEXT,
  TINDEQ_DEMO_SESSION,
} from "./tindeq-report-demo.js";

test("ukázkový report používá úplný anonymní kontext a doporučí progresi", () => {
  const report = buildTindeqDemoReport();

  assert.equal(report.context.athleteName, TINDEQ_DEMO_ATHLETE_NAME);
  assert.equal(report.context.kneeAngleDegrees, TINDEQ_DEMO_CONTEXT.kneeAngleDegrees);
  assert.equal(report.context.detectedRepetitions, TINDEQ_DEMO_SESSION.detected_repetitions);
  assert.deepEqual(report.context.missingData, []);
  assert.equal(report.performance.finding.status, "splněno");
  assert.equal(report.control.finding.status, "splněno");
  assert.equal(report.fatigue.finding.status, "splněno");
  assert.equal(report.reaction.finding.status, "splněno");
  assert.equal(report.recommendation.action, "progrese");
});
