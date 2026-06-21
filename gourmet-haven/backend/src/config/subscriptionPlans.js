const PLAN_DEFINITIONS = [
  {
    key: "starter",
    name: "Starter",
    amount_paise: 99900,
    billing_interval: "monthly",
    total_count: 12,
    envKey: "RAZORPAY_PLAN_STARTER_ID",
    features: [
      "Restaurant discovery listing",
      "Menu management",
      "Realtime order dashboard"
    ]
  },
  {
    key: "growth",
    name: "Growth",
    amount_paise: 199900,
    billing_interval: "monthly",
    total_count: 12,
    envKey: "RAZORPAY_PLAN_GROWTH_ID",
    features: [
      "Everything in Starter",
      "Priority discovery placement",
      "Owner analytics"
    ]
  },
  {
    key: "pro",
    name: "Pro",
    amount_paise: 399900,
    billing_interval: "monthly",
    total_count: 12,
    envKey: "RAZORPAY_PLAN_PRO_ID",
    features: [
      "Everything in Growth",
      "Multiple outlet support",
      "Advanced support"
    ]
  }
];

export function getSubscriptionPlans() {
  return PLAN_DEFINITIONS.map((plan) => ({
    key: plan.key,
    name: plan.name,
    amount_paise: plan.amount_paise,
    currency: "INR",
    billing_interval: plan.billing_interval,
    total_count: plan.total_count,
    razorpay_plan_id: process.env[plan.envKey] || "",
    is_configured: Boolean(process.env[plan.envKey]),
    features: plan.features
  }));
}

export function findSubscriptionPlan(planKey) {
  return getSubscriptionPlans().find((plan) => plan.key === planKey);
}
