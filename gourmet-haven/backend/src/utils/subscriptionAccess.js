const ACTIVE_DISCOVERY_STATUSES = new Set(["active"]);

export function isSubscriptionStatusDiscoverable(status) {
  return ACTIVE_DISCOVERY_STATUSES.has(String(status || "").toLowerCase());
}

export function restaurantHasActiveSubscription(restaurant, subscriptions = []) {
  if (isSubscriptionStatusDiscoverable(restaurant?.subscription_status)) {
    return true;
  }

  return subscriptions.some((subscription) =>
    isSubscriptionStatusDiscoverable(subscription?.status)
  );
}
