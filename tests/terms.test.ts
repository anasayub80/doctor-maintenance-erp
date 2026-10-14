import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/seed.ts";
import {
  defaultTerms,
  serviceTerms,
  snapshotTerms,
  initializeDraftTerms,
  migrateDemoState,
  selectedTerms,
} from "../src/terms.ts";
import { saveRecord } from "../src/workflows.ts";
test("each service has its own conditions and kitchen clauses do not leak into painting", () => {
  const kitchen = defaultTerms("S7")
      .map((t) => t.text)
      .join(" "),
    paint = defaultTerms("S4")
      .map((t) => t.text)
      .join(" ");
  assert(kitchen.includes("cabinet"));
  assert(paint.includes("Paint brand"));
  assert(!paint.includes("cabinet"));
  assert(!paint.includes("marble"));
});
test("new quotes snapshot enabled terms and automatically select only defaults", () => {
  const service = {
    ...initialState.services[0],
    termsVersion: 3,
    quotationTerms: [
      {
        id: "a",
        text: "Required access",
        enabled: true,
        defaultSelected: true,
      },
      {
        id: "b",
        text: "Optional filter replacement",
        enabled: true,
        defaultSelected: false,
      },
      {
        id: "c",
        text: "Disabled condition",
        enabled: false,
        defaultSelected: true,
      },
    ],
  };
  const snap = snapshotTerms(service);
  assert.equal(snap.serviceTermsVersion, 3);
  assert.deepEqual(
    snap.serviceTerms?.map((t) => [t.id, t.selected]),
    [
      ["a", true],
      ["b", false],
    ],
  );
  assert.deepEqual(selectedTerms({ ...initialState.quotes[0], ...snap }), [
    "Required access",
  ]);
});
test("admin library updates do not rewrite existing quotation snapshots", () => {
  const s = migrateDemoState(structuredClone(initialState));
  const service = s.services[6];
  const quote = { ...s.quotes[0], ...snapshotTerms(service) };
  const before = JSON.stringify(quote);
  const changed = {
    ...service,
    quotationTerms: [
      {
        id: "new",
        text: "New revised kitchen condition",
        enabled: true,
        defaultSelected: true,
      },
    ],
    termsVersion: 2,
  };
  const next = saveRecord(
    { ...s, quotes: [quote, ...s.quotes.slice(1)] },
    "services",
    changed,
  );
  assert.equal(JSON.stringify(next.quotes[0]), before);
  assert.deepEqual(
    snapshotTerms(next.services[6]).serviceTerms?.map((t) => t.text),
    ["New revised kitchen condition"],
  );
});
test("old browser demo data gains a terms library without losing records or modifying issued quotes", () => {
  const old = structuredClone(initialState);
  const next = migrateDemoState(old);
  assert(next.services.every((s) => serviceTerms(s).length >= 2));
  assert.equal(next.customers.length, old.customers.length);
  assert.deepEqual(next.quotes, old.quotes);
});
test("drafts can initialize missing defaults, while issued quotations remain frozen", () => {
  const service = initialState.services[6];
  const draft = initializeDraftTerms(
    { ...initialState.quotes[0], status: "Draft" },
    service,
  );
  assert(draft.serviceTerms?.length);
  const issued = initializeDraftTerms(
    { ...initialState.quotes[0], status: "Issued" },
    service,
  );
  assert.equal(issued.serviceTerms, undefined);
  const edited = {
    ...draft,
    serviceTerms: [
      { id: "custom", text: "Hand edited condition", selected: true },
    ],
  };
  assert.deepEqual(
    initializeDraftTerms(edited, service).serviceTerms,
    edited.serviceTerms,
  );
});
test("explicit draft refresh and service changes use the chosen service only", () => {
  const paint = initialState.services[3],
    kitchen = initialState.services[6];
  const quote = { ...initialState.quotes[0], ...snapshotTerms(kitchen) };
  const switched = { ...quote, serviceId: paint.id, ...snapshotTerms(paint) };
  assert(selectedTerms(switched).some((x) => x.includes("Paint brand")));
  assert(!selectedTerms(switched).some((x) => x.includes("cabinet")));
  assert.equal(switched.terms, quote.terms);
});
