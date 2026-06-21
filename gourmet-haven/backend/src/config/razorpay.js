import Razorpay from "razorpay";
import crypto from "node:crypto";

export const hasRazorpayConfig = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const hasRazorpayWebhookConfig = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
export const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
export const isRazorpayTestMode = razorpayKeyId.startsWith("rzp_test_");
export const isRazorpayLiveMode = razorpayKeyId.startsWith("rzp_live_");
export const isRazorpayModeAllowed =
  !isRazorpayLiveMode || process.env.RAZORPAY_ALLOW_LIVE_MODE === "true";

export const razorpay = hasRazorpayConfig
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

export function verifySubscriptionCheckoutSignature({ paymentId, subscriptionId, signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  if (!paymentId || !subscriptionId || !signature) return false;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyOrderPaymentSignature({ orderId, paymentId, signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  if (!orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
  if (!rawBody || !signature) return false;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
