import { randomUUID } from "node:crypto";
import {
  hasRazorpayConfig,
  hasRazorpayWebhookConfig,
  isRazorpayModeAllowed,
  razorpay,
  razorpayKeyId,
  verifySubscriptionCheckoutSignature,
  verifyWebhookSignature
} from "../config/razorpay.js";
import { findSubscriptionPlan, getSubscriptionPlans } from "../config/subscriptionPlans.js";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { requireText } from "../utils/validation.js";

function toClientPlan(plan) {
  return {
    key: plan.key,
    name: plan.name,
    amount_paise: plan.amount_paise,
    currency: plan.currency,
    billing_interval: plan.billing_interval,
    is_configured: plan.is_configured,
    features: plan.features
  };
}

function normalizeRazorpayStatus(status) {
  if (["active", "authenticated"].includes(status)) return "active";
  if (["pending", "created"].includes(status)) return "trialing";
  if (["halted", "past_due"].includes(status)) return "past_due";
  if (["cancelled", "completed", "expired"].includes(status)) return "cancelled";
  return "inactive";
}

export function mapWebhookEventToSubscriptionStatus(eventType, entityStatus) {
  if (eventType === "subscription.authenticated" || eventType === "subscription.activated") return "active";
  if (eventType === "subscription.charged") return "active";
  if (eventType === "subscription.pending") return "trialing";
  if (eventType === "subscription.halted" || eventType === "payment.failed") return "past_due";
  if (eventType === "subscription.cancelled") return "cancelled";
  return normalizeRazorpayStatus(entityStatus || eventType?.split(".").at(-1));
}

function getPaymentFailureMessage(payload) {
  const payment = payload?.payload?.payment?.entity;
  if (!payment) return null;

  return (
    payment.error_description ||
    payment.error_reason ||
    payment.error_code ||
    "Payment failed. Please retry or update billing details."
  );
}

function getSubscriptionEntity(payload) {
  return payload?.payload?.subscription?.entity || payload?.subscription || null;
}

function getRazorpaySubscriptionIdFromPayload(payload) {
  return (
    getSubscriptionEntity(payload)?.id ||
    payload?.payload?.payment?.entity?.subscription_id ||
    payload?.razorpay_subscription_id ||
    null
  );
}

async function resolveOwnedRestaurant(ownerId, restaurantId) {
  let query = supabaseAdmin
    .from("restaurants")
    .select("id, owner_id")
    .eq("owner_id", ownerId);

  if (restaurantId) query = query.eq("id", restaurantId);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (error || !data) {
    const accessError = new Error("Create or select one of your restaurants before subscribing.");
    accessError.statusCode = 400;
    throw accessError;
  }

  return data;
}

async function updateRestaurantSubscriptionStatus(restaurantId, status) {
  if (!restaurantId) return;

  await supabaseAdmin
    .from("restaurants")
    .update({ subscription_status: status })
    .eq("id", restaurantId);
}

async function findLocalSubscriptionByRazorpayId(razorpaySubscriptionId) {
  if (!razorpaySubscriptionId) return null;

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("razorpay_subscription_id", razorpaySubscriptionId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function updateLocalSubscriptionFromRazorpay(razorpaySubscriptionId, patch) {
  const local = await findLocalSubscriptionByRazorpayId(razorpaySubscriptionId);
  if (!local) return null;

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update(patch)
    .eq("id", local.id)
    .select()
    .single();

  if (error) throw error;
  await updateRestaurantSubscriptionStatus(data.restaurant_id, data.status);
  return data;
}

export function listSubscriptionPlans(req, res) {
  res.json({
    success: true,
    data: getSubscriptionPlans().map(toClientPlan)
  });
}

export async function getSubscriptionStatus(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: {
        id: randomUUID(),
        status: "inactive",
        plan_name: "Growth"
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("owner_id", req.profile?.id || req.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  res.json({
    success: true,
    data
  });
}

export async function createSubscriptionCheckout(req, res) {
  if (!hasRazorpayConfig || !razorpay) {
    return res.status(503).json({
      success: false,
      message: "Razorpay is not configured yet.",
      code: "RAZORPAY_NOT_CONFIGURED"
    });
  }

  if (!isRazorpayModeAllowed) {
    return res.status(403).json({
      success: false,
      message: "Live Razorpay keys are blocked in this environment. Use test keys or set RAZORPAY_ALLOW_LIVE_MODE=true intentionally.",
      code: "RAZORPAY_LIVE_MODE_BLOCKED"
    });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({
      success: false,
      message: "Supabase admin is required to create subscriptions.",
      code: "SUPABASE_NOT_CONFIGURED"
    });
  }

  const planKey = requireText(req.body.planKey || req.body.plan_key, "planKey", { maxLength: 40 });
  const plan = findSubscriptionPlan(planKey);

  if (!plan) {
    return res.status(400).json({ success: false, message: "Unknown subscription plan.", code: "UNKNOWN_PLAN" });
  }

  if (!plan.razorpay_plan_id) {
    return res.status(503).json({
      success: false,
      message: `${plan.name} is missing a Razorpay plan ID in backend environment variables.`,
      code: "RAZORPAY_PLAN_NOT_CONFIGURED"
    });
  }

  const ownerId = req.profile?.id || req.user.id;
  const restaurant = await resolveOwnedRestaurant(ownerId, req.body.restaurantId || req.body.restaurant_id || null);

  const razorpaySubscription = await razorpay.subscriptions.create({
    plan_id: plan.razorpay_plan_id,
    total_count: plan.total_count,
    quantity: 1,
    customer_notify: 1,
    notes: {
      owner_id: ownerId,
      restaurant_id: restaurant.id,
      plan_key: plan.key
    }
  });

  const status = normalizeRazorpayStatus(razorpaySubscription.status);
  const payload = {
    owner_id: ownerId,
    restaurant_id: restaurant.id,
    plan_name: plan.name,
    amount_paise: plan.amount_paise,
    currency: "INR",
    billing_interval: plan.billing_interval,
    status,
    razorpay_subscription_id: razorpaySubscription.id,
    razorpay_plan_id: plan.razorpay_plan_id,
    current_period_start: razorpaySubscription.current_start
      ? new Date(razorpaySubscription.current_start * 1000).toISOString()
      : null,
    current_period_end: razorpaySubscription.current_end
      ? new Date(razorpaySubscription.current_end * 1000).toISOString()
      : null
  };

  const { data: localSubscription, error } = await supabaseAdmin
    .from("subscriptions")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  await updateRestaurantSubscriptionStatus(restaurant.id, status);

  res.status(201).json({
    success: true,
    data: {
      key_id: razorpayKeyId,
      subscription_id: razorpaySubscription.id,
      plan: toClientPlan(plan),
      subscription: localSubscription,
      checkout: {
        name: "QuickDyne",
        description: `${plan.name} subscription`,
        prefill: {
          name: req.profile?.full_name || "",
          email: req.user?.email || ""
        }
      }
    }
  });
}

export async function verifySubscription(req, res) {
  const paymentId = req.body.razorpay_payment_id;
  const subscriptionId = req.body.razorpay_subscription_id;
  const signature = req.body.razorpay_signature;

  if (!verifySubscriptionCheckoutSignature({ paymentId, subscriptionId, signature })) {
    return res.status(400).json({
      success: false,
      message: "Invalid Razorpay subscription signature.",
      code: "INVALID_RAZORPAY_SIGNATURE"
    });
  }

  const updated = supabaseAdmin
    ? await updateLocalSubscriptionFromRazorpay(subscriptionId, { status: "active" })
    : null;

  res.json({
    success: true,
    data: updated || { razorpay_subscription_id: subscriptionId, status: "active" }
  });
}

export async function handleSubscriptionWebhook(req, res) {
  if (!hasRazorpayWebhookConfig) {
    return res.status(503).json({
      success: false,
      message: "Razorpay webhook secret is not configured.",
      code: "RAZORPAY_WEBHOOK_NOT_CONFIGURED"
    });
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!verifyWebhookSignature(req.rawBody, signature)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Razorpay webhook signature.",
      code: "INVALID_WEBHOOK_SIGNATURE"
    });
  }

  const eventId = req.body?.id;
  const eventType = req.body?.event;

  if (!eventId || !eventType) {
    return res.status(400).json({ success: false, message: "Invalid webhook payload.", code: "INVALID_WEBHOOK" });
  }

  if (supabaseAdmin) {
    const { error: eventError } = await supabaseAdmin
      .from("razorpay_webhook_events")
      .insert({ razorpay_event_id: eventId, event_type: eventType });

    if (eventError?.code === "23505") {
      return res.json({ success: true, data: { duplicate: true } });
    }

    if (eventError) throw eventError;
  }

  const razorpaySubscriptionId = getRazorpaySubscriptionIdFromPayload(req.body);
  const entity = getSubscriptionEntity(req.body);
  const nextStatus = mapWebhookEventToSubscriptionStatus(eventType, entity?.status);

  if (supabaseAdmin && razorpaySubscriptionId) {
    const patch = {
      status: nextStatus,
      last_payment_error: eventType === "payment.failed" ? getPaymentFailureMessage(req.body) : null,
      current_period_start: entity?.current_start ? new Date(entity.current_start * 1000).toISOString() : undefined,
      current_period_end: entity?.current_end ? new Date(entity.current_end * 1000).toISOString() : undefined
    };

    Object.keys(patch).forEach((key) => typeof patch[key] === "undefined" && delete patch[key]);
    await updateLocalSubscriptionFromRazorpay(razorpaySubscriptionId, patch);
  }

  res.json({ success: true, data: { processed: true } });
}
