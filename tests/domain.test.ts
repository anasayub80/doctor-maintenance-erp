import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/seed.ts";
import {
  finance,
  accountBalance,
  quoteTotal,
  invoiceTotal,
  paid,
  balance,
  directCost,
  invoiceStatus,
  type Payment,
  permissions,
} from "../src/domain.ts";
import { convertQuote, recordPayment, saveRecord } from "../src/workflows.ts";
import { parseCSV, validImportRow } from "../src/csv.ts";
const seed = () => structuredClone(initialState);
test("a customer advance increases cash but does not recognize revenue", () => {
  const s = seed(),
    j = s.jobs[0];
  assert.equal(j.earned, 0);
  assert.equal(paid(s, s.invoices[0].id), 195000);
  const before = {
    ...s,
    payments: s.payments.filter((p) => p.recordId !== s.invoices[0].id),
  };
  assert.equal(finance(s).earned, finance(before).earned);
  assert.equal(finance(s).receipts - finance(before).receipts, 195000);
  assert.equal(accountBalance(s, "A1") - accountBalance(before, "A1"), 195000);
});
test("net profit deducts incurred costs, marketing and overhead exactly once", () => {
  const s = seed(),
    f = finance(s);
  assert.equal(f.earned, 1010000);
  assert.equal(f.direct, 897000);
  assert.equal(f.marketing, 65000);
  assert.equal(f.overhead, 70000);
  assert.equal(f.net, -22000);
  assert.equal(f.gross, f.earned - f.direct);
  assert.equal(f.net, f.earned - f.direct - f.marketing - f.overhead);
  assert.equal(
    s.services.reduce(
      (a, v) => a + finance(s, "2026-10", v.id).contribution,
      0,
    ) - f.overhead,
    f.net,
  );
});
test("partial customer payment updates receivables and cash, not earned profit", () => {
  const s = seed(),
    i = s.invoices[1];
  const p: Payment = {
    id: "TEST-RC",
    kind: "Customer receipt",
    recordId: i.id,
    amount: 10000,
    date: "2026-10-14",
    accountId: "A1",
    method: "Bank transfer",
    reference: "test",
    notes: "",
  };
  const next = recordPayment(s, p);
  assert.equal(balance(next, i), balance(s, i) - 10000);
  assert.equal(accountBalance(next, "A1"), accountBalance(s, "A1") + 10000);
  assert.equal(finance(next).net, finance(s).net);
});
test("overpayment, negative payment and invalid account are rejected", () => {
  const s = seed();
  const p: Payment = {
    id: "TEST",
    kind: "Customer receipt",
    recordId: s.invoices[1].id,
    amount: 50000,
    date: "2026-10-14",
    accountId: "A1",
    method: "Cash",
    reference: "",
    notes: "",
  };
  assert.throws(() => recordPayment(s, p), /exceeds/);
  assert.throws(
    () => recordPayment(s, { ...p, amount: -1 }),
    /greater than zero/,
  );
  assert.throws(
    () => recordPayment(s, { ...p, amount: 1, accountId: "missing" }),
    /valid payment account/,
  );
});
test("contractor payment settles liability without deducting the cost again", () => {
  const s = seed(),
    bill = s.bills[0];
  const next = recordPayment(s, {
    id: "TEST-PAY",
    kind: "Contractor payment",
    recordId: bill.id,
    amount: 10000,
    date: "2026-10-14",
    accountId: "A1",
    method: "Cash",
    reference: "",
    notes: "",
  });
  assert.equal(finance(next).payables, finance(s).payables - 10000);
  assert.equal(finance(next).net, finance(s).net);
  assert.equal(directCost(next, bill.jobId), directCost(s, bill.jobId));
  assert.equal(accountBalance(next, "A1"), accountBalance(s, "A1") - 10000);
});
test("pending expenses do not affect profit until approved and require approval to pay", () => {
  const s = seed(),
    pending = s.expenses.find((e) => e.status === "Pending")!;
  const approved = saveRecord(s, "expenses", {
    ...pending,
    status: "Approved",
  });
  assert.equal(finance(approved).net, finance(s).net - pending.amount);
  assert.equal(finance(approved).cash, finance(s).cash);
  assert.throws(
    () =>
      recordPayment(s, {
        id: "TEST",
        kind: "Expense payment",
        recordId: pending.id,
        amount: 1,
        date: "2026-10-14",
        accountId: "A2",
        method: "Cash",
        reference: "",
        notes: "",
      }),
    /Approve/,
  );
});
test("quotation conversion preserves links and creates only one project", () => {
  const s = seed(),
    q = { ...structuredClone(s.quotes[8]), status: "Accepted" };
  const next = convertQuote(s, q);
  const j = next.jobs[0];
  assert.equal(j.quoteId, q.id);
  assert.equal(j.customerId, q.customerId);
  assert.equal(j.propertyId, q.propertyId);
  assert.equal(j.value, quoteTotal(q));
  assert.equal(j.earned, 0);
  assert.equal(next.leads.find((l) => l.id === q.leadId)?.stage, "Won");
  assert.throws(() => convertQuote(next, q), /already/);
  assert.throws(() => convertQuote(s, { ...q, status: "Draft" }), /Accept/);
});
test("rate updates and revisions never modify earlier quoted items", () => {
  const s = seed(),
    q = s.quotes[0];
  const revised = {
    ...structuredClone(q),
    id: "QT-TEST",
    parentId: q.id,
    version: 2,
    status: "Draft",
    items: q.items.map((i) => ({ ...i, rate: i.rate + 100 })),
  };
  const next = saveRecord(saveRecord(s, "quotes", revised), "services", {
    ...s.services[6],
    rate: 9999,
  });
  assert.equal(quoteTotal(next.quotes.find((x) => x.id === q.id)!), 390000);
  assert.notEqual(quoteTotal(revised), 390000);
});
test("completed and in-progress costs reveal the volume versus profit problem", () => {
  const s = seed();
  assert(
    finance(s, "2026-10", "S4").contribution >
      finance(s, "2026-10", "S6").contribution,
  );
  assert(finance(s, "2026-10", "S6").contribution < 0);
});
test("empty reporting periods do not show invented performance", () => {
  const f = finance(seed(), "2026-09");
  assert.equal(f.earned, 0);
  assert.equal(f.direct, 0);
  assert.equal(f.receipts, 0);
  assert.equal(f.net, 0);
});
test("all sample links resolve and accepted quote ownership matches its lead", () => {
  const s = seed();
  for (const q of s.quotes) {
    assert(s.customers.some((c) => c.id === q.customerId));
    const l = s.leads.find((l) => l.id === q.leadId);
    if (l) assert.equal(l.customerId, q.customerId);
  }
  for (const j of s.jobs) {
    assert(s.quotes.some((q) => q.id === j.quoteId));
    assert(s.customers.some((c) => c.id === j.customerId));
    for (const id of j.contractorIds)
      assert(s.contractors.some((c) => c.id === id));
  }
  for (const p of s.payments)
    assert(
      [...s.invoices, ...s.bills, ...s.expenses].some(
        (r) => r.id === p.recordId,
      ),
    );
});
test("draft invoices reject payments and paid statuses follow balances", () => {
  const s = seed(),
    i = s.invoices[1];
  const p: Payment = {
    id: "TEST",
    kind: "Customer receipt",
    recordId: i.id,
    amount: balance(s, i),
    date: "2026-10-14",
    accountId: "A1",
    method: "Cash",
    reference: "",
    notes: "",
  };
  const next = recordPayment(s, p);
  assert.equal(invoiceStatus(next, i), "Paid");
  assert.throws(
    () =>
      recordPayment(saveRecord(s, "invoices", { ...i, status: "Draft" }), p),
    /Only issued/,
  );
});
test("sales role has no finance, costs or administrator navigation", () => {
  assert(!permissions["Sales Staff"].includes("Cash & Accounts"));
  assert(!permissions["Sales Staff"].includes("Team & Permissions"));
  assert(permissions["Sales Staff"].includes("Quotations"));
});
test("CSV parsing supports quoted commas, escaped quotes and CRLF", () => {
  assert.deepEqual(
    parseCSV(
      'campaign,spend,date\r\n"Paint, Karachi",15000,2026-10-14\r\n"A ""quoted"" name",120,2026-10-12',
    ),
    [
      ["campaign", "spend", "date"],
      ["Paint, Karachi", "15000", "2026-10-14"],
      ['A "quoted" name', "120", "2026-10-12"],
    ],
  );
  assert.throws(() => parseCSV('"broken'), /unclosed/);
  assert(!validImportRow({ campaign: "A", spend: "-5", date: "2026-10-14" }));
  assert(!validImportRow({ campaign: "A", spend: "5", date: "2026-02-30" }));
  assert(validImportRow({ campaign: "A", spend: "5", date: "2026-10-14" }));
});
