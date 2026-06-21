import assert from "node:assert/strict";
import test from "node:test";
import { mapWebhookEventToSubscriptionStatus } from "./subscriptionController.js";

test("mapWebhookEventToSubscriptionStatus handles subscription lifecycle events", () => {
  assert.equal(mapWebhookEventToSubscriptionStatus("subscription.authenticated"), "active");
  assert.equal(mapWebhookEventToSubscriptionStatus("subscription.activated"), "active");
  assert.equal(mapWebhookEventToSubscriptionStatus("subscription.charged"), "active");
  assert.equal(mapWebhookEventToSubscriptionStatus("subscription.pending"), "trialing");
  assert.equal(mapWebhookEventToSubscriptionStatus("subscription.halted"), "past_due");
  assert.equal(mapWebhookEventToSubscriptionStatus("subscription.cancelled"), "cancelled");
});

test("mapWebhookEventToSubscriptionStatus treats payment.failed as past_due", () => {
  assert.equal(mapWebhookEventToSubscriptionStatus("payment.failed"), "past_due");
});
