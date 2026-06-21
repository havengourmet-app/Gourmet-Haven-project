import assert from "node:assert/strict";
import test from "node:test";
import { isSubscriptionStatusDiscoverable, restaurantHasActiveSubscription } from "./subscriptionAccess.js";

test("isSubscriptionStatusDiscoverable allows only active subscriptions", () => {
  assert.equal(isSubscriptionStatusDiscoverable("active"), true);
  assert.equal(isSubscriptionStatusDiscoverable("trialing"), false);
  assert.equal(isSubscriptionStatusDiscoverable("inactive"), false);
  assert.equal(isSubscriptionStatusDiscoverable("cancelled"), false);
});

test("restaurantHasActiveSubscription checks denormalized restaurant and subscription rows", () => {
  assert.equal(restaurantHasActiveSubscription({ subscription_status: "active" }, []), true);
  assert.equal(restaurantHasActiveSubscription({ subscription_status: "inactive" }, [{ status: "active" }]), true);
  assert.equal(restaurantHasActiveSubscription({ subscription_status: "inactive" }, [{ status: "past_due" }]), false);
  assert.equal(restaurantHasActiveSubscription({ subscription_status: "inactive" }, []), false);
});
