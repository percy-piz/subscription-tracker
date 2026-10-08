import assert from "node:assert/strict";
import { test } from "node:test";
import { nextRenewal } from "../src/shared/dates.js";

test("monthly adds one month", () => {
  assert.equal(nextRenewal("2026-03-15", "monthly"), "2026-04-15");
});

test("monthly clamps to month end", () => {
  assert.equal(nextRenewal("2026-01-31", "monthly"), "2026-02-28");
  assert.equal(nextRenewal("2028-01-31", "monthly"), "2028-02-29");
});

test("yearly rolls the year, including Feb 29", () => {
  assert.equal(nextRenewal("2028-02-29", "yearly"), "2029-02-28");
});

test("quarterly crosses year boundary", () => {
  assert.equal(nextRenewal("2026-11-30", "quarterly"), "2027-02-28");
});

test("weekly adds seven days", () => {
  assert.equal(nextRenewal("2026-12-28", "weekly"), "2027-01-04");
});

test("one_time has no renewal", () => {
  assert.equal(nextRenewal("2026-05-01", "one_time"), null);
});
