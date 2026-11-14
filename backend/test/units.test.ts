import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalJson, loadSigningKeys, payloadHash, signJws, verifyJws } from "../src/crypto.ts";
import { composeSpeech } from "../src/platform/composer.ts";
import { fromCents, parseSpokenAmount, roundEuros, toCents } from "../src/sdk/money.ts";
import type { DomainResponse } from "../src/contracts.ts";

test("money: exact cents round trip, no floats", () => {
  assert.equal(toCents("79.90"), 7990n);
  assert.equal(fromCents(toCents("90.16") - toCents("79.90")), "10.26");
  assert.equal(fromCents(-5n), "-0.05");
  assert.equal(roundEuros("10.26"), 10n);
  assert.equal(roundEuros("90.50"), 91n);
  assert.throws(() => toCents("79.9"));
});

test("money: spoken amounts in English and Finnish", () => {
  assert.equal(parseSpokenAmount("can I afford 79.90 this week"), "79.90");
  assert.equal(parseSpokenAmount("onko minulla varaa 79,90 euroa"), "79.90");
  assert.equal(parseSpokenAmount("€60 groceries"), "60.00");
  assert.equal(parseSpokenAmount("60 euros"), "60.00");
  assert.equal(parseSpokenAmount("in 4 days"), null, "a bare number is not an amount");
});

test("canonical JSON and signatures", () => {
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] }), '{"a":[2,{"c":4,"d":3}],"b":1}');
  assert.equal(payloadHash({ a: 1, b: 2 }), payloadHash({ b: 2, a: 1 }));
  const keys = loadSigningKeys();
  const jws = signJws({ x: 1 }, keys);
  assert.ok(verifyJws(jws, { x: 1 }, keys.publicKey));
  assert.ok(!verifyJws(jws, { x: 2 }, keys.publicKey), "payload must match");
  assert.ok(!verifyJws(jws, { x: 1 }, loadSigningKeys().publicKey), "other key fails");
});

test("composer: speech budget keeps whole sentences, else a neutral line", () => {
  const r = (text: string) => ({ speech: { text, epistemic: "estimate" } } as DomainResponse);
  const long = "Short first sentence. " + "word ".repeat(30) + "end.";
  assert.equal(composeSpeech(r(long), { speechMaxWords: 25, discreetMode: false, locale: "en" }).speech.text, "Short first sentence.");
  assert.equal(composeSpeech(r("word ".repeat(30)), { speechMaxWords: 25, discreetMode: false, locale: "fi" }).speech.text, "Tiedot ovat puhelimessasi.");
  assert.equal(composeSpeech(r("About 90 euros."), { speechMaxWords: 25, discreetMode: true, locale: "en" }).speech.text, "I've put the details on your phone.");
});
