import assert from "node:assert/strict";
import test from "node:test";
import { assertPaise } from "./money.js";

test("assertPaise accepts non-negative integer paise", () => {
  assert.doesNotThrow(() => assertPaise(10000, "total"));
  assert.doesNotThrow(() => assertPaise(0, "platform_fee"));
});

test("assertPaise rejects floats and negative values", () => {
  assert.throws(() => assertPaise(10.5, "total"), /total must be a non-negative integer paise amount/);
  assert.throws(() => assertPaise(-1, "total"), /total must be a non-negative integer paise amount/);
});
