import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCoupon, totals } from '../src/utils/pricing.js';

const pct = { active: true, type: 'percent', value: 50, minOrder: 0, maxDiscount: 200 };
test('percent coupon respects max discount', () => assert.equal(applyCoupon(pct, 2000).discount, 200));
test('below min order is rejected', () => assert.ok(applyCoupon({ ...pct, minOrder: 500 }, 100).error));
test('expired coupon is rejected', () => assert.match(applyCoupon({ ...pct, expiresAt: new Date('2020-01-01') }, 1000).error, /expired/));
test('free delivery above 499', () => assert.equal(totals([{ price: 500, qty: 1 }]).delivery, 0));
test('delivery fee below 499', () => assert.equal(totals([{ price: 100, qty: 1 }]).delivery, 40));
test('total = subtotal - discount + delivery', () => assert.equal(totals([{ price: 300, qty: 1 }], 50).total, 290));
