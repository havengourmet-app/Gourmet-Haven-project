import assert from "node:assert/strict";
import test from "node:test";
import { assertClientAmountMatches, normalizeOrderItems } from "./orderController.js";

test("normalizeOrderItems merges duplicate items by id", () => {
  assert.deepEqual(
    normalizeOrderItems([
      { id: "item-1", qty: 1 },
      { id: "item-1", quantity: 2 },
      { id: "item-2", qty: 3 }
    ]),
    [
      { id: "item-1", qty: 3, quantity: 3 },
      { id: "item-2", qty: 3, quantity: 3 }
    ]
  );
});

test("normalizeOrderItems rejects missing ids and invalid quantities", () => {
  assert.throws(() => normalizeOrderItems([{ qty: 1 }]), /Each order item must include an id/);
  assert.throws(() => normalizeOrderItems([{ id: "item-1", qty: 0 }]), /positive integer quantity/);
  assert.throws(() => normalizeOrderItems([{ id: "item-1", qty: 1.5 }]), /positive integer quantity/);
});

test("assertClientAmountMatches allows omitted client values", () => {
  assert.doesNotThrow(() => assertClientAmountMatches(undefined, 10000, "total"));
});

test("assertClientAmountMatches rejects tampered totals", () => {
  assert.throws(() => assertClientAmountMatches(5000, 10000, "total"), /total does not match/);
});
