import {
  type State,
  type Quote,
  type Payment,
  type Job,
  uid,
  quoteTotal,
  invoiceTotal,
  paid,
  today,
} from "./domain.ts";
export type Collection =
  | "customers"
  | "leads"
  | "services"
  | "contractors"
  | "quotes"
  | "jobs"
  | "invoices"
  | "expenses"
  | "bills"
  | "campaigns"
  | "accounts"
  | "team";
export function saveRecord(
  s: State,
  collection: Collection,
  record: any,
): State {
  return {
    ...s,
    [collection]: s[collection].some((r) => r.id === record.id)
      ? s[collection].map((r) => (r.id === record.id ? record : r))
      : [record, ...s[collection]],
  };
}
export function convertQuote(s: State, q: Quote): State {
  if (q.status !== "Accepted")
    throw new Error("Accept the issued quotation before converting it.");
  if (s.jobs.some((j) => j.quoteId === q.id))
    throw new Error("This quotation already has a linked job.");
  const ancestorIds = new Set<string>();
  let parent = q.parentId;
  while (parent && !ancestorIds.has(parent)) {
    ancestorIds.add(parent);
    parent = s.quotes.find((x) => x.id === parent)?.parentId || "";
  }
  if (s.jobs.some((j) => ancestorIds.has(j.quoteId)))
    throw new Error(
      "An earlier version already has a project. Record a change order on that project instead.",
    );
  const job: Job = {
    id: uid("JB"),
    customerId: q.customerId,
    propertyId: q.propertyId,
    serviceId: q.serviceId,
    quoteId: q.id,
    campaignId: s.leads.find((l) => l.id === q.leadId)?.campaignId || "",
    title: q.title,
    status: "Scheduled",
    value: quoteTotal(q),
    earned: 0,
    budget: q.internalCost,
    start: today,
    end: q.validUntil,
    progress: 0,
    contractorIds: [],
    workOrders: [],
    milestones: structuredClone(q.milestones),
    changes: [],
    notes: [],
    attachments: [],
  };
  return {
    ...s,
    jobs: [job, ...s.jobs],
    leads: s.leads.map((l) => (l.id === q.leadId ? { ...l, stage: "Won" } : l)),
  };
}
export function recordPayment(s: State, p: Payment): State {
  if (!Number.isFinite(p.amount) || p.amount <= 0)
    throw new Error("Enter a payment greater than zero.");
  if (!s.accounts.some((a) => a.id === p.accountId))
    throw new Error("Select a valid payment account.");
  const record =
    p.kind === "Customer receipt"
      ? s.invoices.find((i) => i.id === p.recordId)
      : p.kind === "Contractor payment"
        ? s.bills.find((b) => b.id === p.recordId)
        : s.expenses.find((e) => e.id === p.recordId);
  if (!record) throw new Error("The linked record could not be found.");
  if (
    p.kind === "Customer receipt" &&
    ["Draft", "Voided"].includes(record.status)
  )
    throw new Error("Only issued invoices can receive payments.");
  if (p.kind !== "Customer receipt" && record.status !== "Approved")
    throw new Error("Approve this bill or expense before payment.");
  const total = "items" in record ? invoiceTotal(record) : record.amount;
  if (p.amount > total - paid(s, record.id) + 0.001)
    throw new Error("Payment exceeds the outstanding balance.");
  return { ...s, payments: [p, ...s.payments] };
}
