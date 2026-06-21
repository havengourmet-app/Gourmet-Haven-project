import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { verifyOrderPaymentSignature, verifySubscriptionCheckoutSignature, verifyWebhookSignature } from "./razorpay.js";

test("verifySubscriptionCheckoutSignature validates payment and subscription signature", () => {
  process.env.RAZORPAY_KEY_SECRET = "test_secret";
  const paymentId = "pay_123";
  const subscriptionId = "sub_123";
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  assert.equal(verifySubscriptionCheckoutSignature({ paymentId, subscriptionId, signature }), true);
  assert.equal(verifySubscriptionCheckoutSignature({ paymentId, subscriptionId, signature: "bad" }), false);
});

test("verifyWebhookSignature validates raw webhook body", () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "webhook_secret";
  const rawBody = Buffer.from(JSON.stringify({ event: "subscription.activated" }));
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  assert.equal(verifyWebhookSignature(rawBody, signature), true);
  assert.equal(verifyWebhookSignature(rawBody, "bad"), false);
});

test("verifyOrderPaymentSignature validates Razorpay order payment signature", () => {
  process.env.RAZORPAY_KEY_SECRET = "test_secret";
  const orderId = "order_123";
  const paymentId = "pay_123";
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  assert.equal(verifyOrderPaymentSignature({ orderId, paymentId, signature }), true);
  assert.equal(verifyOrderPaymentSignature({ orderId, paymentId, signature: "bad" }), false);
});
