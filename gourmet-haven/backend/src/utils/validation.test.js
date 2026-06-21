import assert from "node:assert/strict";
import test from "node:test";
import { optionalBoolean, optionalInteger, optionalText, requireText } from "./validation.js";

test("requireText trims valid text", () => {
  assert.equal(requireText("  Biryani House  ", "name"), "Biryani House");
});

test("requireText rejects empty values", () => {
  assert.throws(() => requireText("   ", "name"), /name is required/);
});

test("optionalText enforces max length", () => {
  assert.throws(() => optionalText("abcdef", "label", { maxLength: 5 }), /label must be 5 characters or less/);
});

test("optionalBoolean rejects non-booleans", () => {
  assert.throws(() => optionalBoolean("true", "is_default"), /is_default must be true or false/);
});

test("optionalInteger validates bounds", () => {
  assert.equal(optionalInteger("35", "estimatedDeliveryMinutes", { min: 10, max: 120 }), 35);
  assert.throws(
    () => optionalInteger(5, "estimatedDeliveryMinutes", { min: 10, max: 120 }),
    /estimatedDeliveryMinutes must be at least 10/
  );
});
