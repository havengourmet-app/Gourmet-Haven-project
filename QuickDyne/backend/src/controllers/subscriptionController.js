import { randomUUID } from "node:crypto";
import { hasRazorpayConfig, razorpay } from "../config/razorpay.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

export async function getSubscriptionStatus(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: {
        id: randomUUID(),
        status: "inactive",
        plan_name: "Growth - Hyderabad"
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

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data
  });
}

export async function createSubscriptionCheckout(req, res) {
  if (!hasRazorpayConfig || !razorpay) {
    return res.status(503).json({
      success: false,
      message: "Razorpay is not configured yet."
    });
  }

  const planId = req.body.planId;

  if (!planId) {
    return res.status(400).json({
      success: false,
      message: "planId is required."
    });
  }

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 12,
    quantity: 1,
    customer_notify: 1
  });

  res.status(201).json({
    success: true,
    data: subscription
  });
}

export async function verifySubscription(req, res) {
  res.json({
    success: true,
    data: {
      verification: "pending",
      message: "Add Razorpay signature validation in the next task."
    }
  });
}
