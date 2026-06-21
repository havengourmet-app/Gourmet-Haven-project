import assert from "node:assert/strict";
import test from "node:test";
import { findSubscriptionPlan, getSubscriptionPlans } from "./subscriptionPlans.js";

test("getSubscriptionPlans returns starter growth and pro plans", () => {
  const plans = getSubscriptionPlans();
  assert.deepEqual(plans.map((plan) => plan.key), ["starter", "growth", "pro"]);
  assert.ok(plans.every((plan) => plan.amount_paise > 0));
  assert.ok(plans.every((plan) => Array.isArray(plan.features) && plan.features.length > 0));
});

test("findSubscriptionPlan returns a plan by key", () => {
  assert.equal(findSubscriptionPlan("growth").name, "Growth");
  assert.equal(findSubscriptionPlan("missing"), undefined);
});
