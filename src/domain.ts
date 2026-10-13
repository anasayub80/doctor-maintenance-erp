export type Role =
  | "Owner"
  | "Finance Manager"
  | "Operations Manager"
  | "Sales Staff";
export type Page =
  | "Dashboard"
  | "Leads"
  | "Customers"
  | "Quotations"
  | "Jobs & Projects"
  | "Contractors"
  | "Services & Rates"
  | "Invoices & Receipts"
  | "Expenses"
  | "Contractor Payables"
  | "Cash & Accounts"
  | "Marketing"
  | "Reports & Analytics"
  | "Team & Permissions"
  | "Document Templates"
  | "Settings"
  | "Audit History";
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  properties: Property[];
  notes: string;
}
export interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  instructions: string;
}
export interface Lead {
  id: string;
  customerId: string;
  serviceId: string;
  source: string;
  campaignId: string;
  value: number;
  stage: string;
  requirements: string;
  assigned: string;
  followUp: string;
  priority: string;
  date: string;
  notes: string[];
  lostReason?: string;
}
export interface Service {
  id: string;
  name: string;
  unit: string;
  rate: number;
  labourRate: number;
  contractorRate: number;
  active: boolean;
  description: string;
  history: { date: string; rate: number }[];
}
export interface Contractor {
  id: string;
  name: string;
  specialties: string[];
  rate: number;
  unit: string;
  availability: string;
  quality: number;
  notes: string;
  phone: string;
}
export interface Item {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}
export interface Milestone {
  id: string;
  name: string;
  percentage: number;
  done: boolean;
  date: string;
}
export interface Quote {
  id: string;
  customerId: string;
  propertyId: string;
  serviceId: string;
  leadId: string;
  title: string;
  date: string;
  validUntil: string;
  status: string;
  version: number;
  parentId: string;
  items: Item[];
  discount: number;
  tax: number;
  materials: string;
  terms: string;
  exclusions: string;
  internalCost: number;
  milestones: Milestone[];
}
export interface ChangeOrder {
  id: string;
  title: string;
  revenue: number;
  cost: number;
  days: number;
  date: string;
}
export interface WorkOrder {
  id: string;
  contractorId: string;
  scope: string;
  budget: number;
  date: string;
}
export interface Job {
  id: string;
  customerId: string;
  propertyId: string;
  serviceId: string;
  quoteId: string;
  campaignId: string;
  title: string;
  status: string;
  value: number;
  earned: number;
  budget: number;
  start: string;
  end: string;
  progress: number;
  contractorIds: string[];
  workOrders: WorkOrder[];
  milestones: Milestone[];
  changes: ChangeOrder[];
  notes: string[];
  attachments: string[];
}
export interface Invoice {
  id: string;
  customerId: string;
  jobId: string;
  date: string;
  due: string;
  status: string;
  items: Item[];
  tax: number;
  notes: string;
}
export interface Payment {
  id: string;
  kind: "Customer receipt" | "Contractor payment" | "Expense payment";
  recordId: string;
  amount: number;
  date: string;
  accountId: string;
  method: string;
  reference: string;
  notes: string;
}
export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  jobId: string;
  campaignId: string;
  status: string;
  accountId: string;
  attachment: string;
}
export interface Bill {
  id: string;
  contractorId: string;
  jobId: string;
  description: string;
  amount: number;
  date: string;
  due: string;
  status: string;
}
export interface Campaign {
  id: string;
  name: string;
  platform: string;
  serviceId: string;
  start: string;
  end: string;
  status: string;
  notes: string;
}
export interface Account {
  id: string;
  name: string;
  type: string;
  opening: number;
}
export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
}
export interface Audit {
  id: string;
  message: string;
  date: string;
  role: Role;
}
export interface Settings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  quotePrefix: string;
  invoicePrefix: string;
  terms: string;
  periodClosed: boolean;
  vocabulary?: Record<string, string[]>;
  notifications?: Record<string, boolean>;
}
export interface State {
  customers: Customer[];
  leads: Lead[];
  services: Service[];
  contractors: Contractor[];
  quotes: Quote[];
  jobs: Job[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  bills: Bill[];
  campaigns: Campaign[];
  accounts: Account[];
  team: Member[];
  audit: Audit[];
  settings: Settings;
  role: Role;
}
export const today = "2026-10-14";
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
export const money = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
export const compact = (n: number): string =>
  n < 0
    ? `−${compact(-n)}`
    : n >= 1000000
      ? `${(n / 1000000).toFixed(2)}m`
      : n >= 1000
        ? `${(n / 1000).toFixed(0)}k`
        : n.toFixed(0);
export const pct = (a: number, b: number) =>
  b ? Math.round((a / b) * 1000) / 10 : 0;
export const itemTotal = (items: Item[]) =>
  items.reduce((s, i) => s + i.quantity * i.rate, 0);
export const quoteTotal = (q: Quote) =>
  Math.max(0, itemTotal(q.items) - q.discount) * (1 + q.tax / 100);
export const invoiceTotal = (i: Invoice) =>
  itemTotal(i.items) * (1 + i.tax / 100);
export const paid = (s: State, id: string) =>
  s.payments.filter((p) => p.recordId === id).reduce((a, p) => a + p.amount, 0);
export const balance = (s: State, i: Invoice) =>
  Math.max(0, invoiceTotal(i) - paid(s, i.id));
export const invoiceStatus = (s: State, i: Invoice) =>
  ["Draft", "Voided"].includes(i.status)
    ? i.status
    : balance(s, i) < 0.01
      ? "Paid"
      : i.due < today
        ? "Overdue"
        : paid(s, i.id) > 0
          ? "Partially Paid"
          : "Issued";
export const directCost = (s: State, id: string) =>
  s.expenses
    .filter((e) => e.jobId === id && e.status === "Approved")
    .reduce((a, e) => a + e.amount, 0) +
  s.bills
    .filter((b) => b.jobId === id && b.status === "Approved")
    .reduce((a, b) => a + b.amount, 0);
export const jobValue = (j: Job) =>
  j.value + j.changes.reduce((s, c) => s + c.revenue, 0);
export const accountBalance = (s: State, id: string) =>
  s.accounts.find((a) => a.id === id)!.opening +
  s.payments
    .filter((p) => p.accountId === id)
    .reduce(
      (a, p) => a + (p.kind === "Customer receipt" ? p.amount : -p.amount),
      0,
    );
export const inMonth = (date: string, month: string) =>
  month === "all" || date.startsWith(month);
export function finance(s: State, month = "2026-10", serviceId = "all") {
  const jobs = s.jobs.filter(
    (j) =>
      inMonth(j.end, month) &&
      (serviceId === "all" || j.serviceId === serviceId),
  );
  const ids = new Set(jobs.map((j) => j.id));
  const earned = jobs.reduce((a, j) => a + j.earned, 0);
  const direct =
    s.bills
      .filter(
        (b) =>
          b.status === "Approved" &&
          inMonth(b.date, month) &&
          (serviceId === "all" || ids.has(b.jobId)),
      )
      .reduce((a, b) => a + b.amount, 0) +
    s.expenses
      .filter(
        (e) =>
          e.status === "Approved" &&
          e.jobId &&
          inMonth(e.date, month) &&
          (serviceId === "all" || ids.has(e.jobId)),
      )
      .reduce((a, e) => a + e.amount, 0);
  const campaignIds = new Set(
    s.campaigns
      .filter((c) => serviceId === "all" || c.serviceId === serviceId)
      .map((c) => c.id),
  );
  const marketing = s.expenses
    .filter(
      (e) =>
        e.status === "Approved" &&
        e.category === "Marketing" &&
        !e.jobId &&
        inMonth(e.date, month) &&
        (serviceId === "all" || campaignIds.has(e.campaignId)),
    )
    .reduce((a, e) => a + e.amount, 0);
  const overhead =
    serviceId === "all"
      ? s.expenses
          .filter(
            (e) =>
              e.status === "Approved" &&
              !e.jobId &&
              e.category !== "Marketing" &&
              inMonth(e.date, month),
          )
          .reduce((a, e) => a + e.amount, 0)
      : 0;
  const gross = earned - direct,
    contribution = gross - marketing,
    net = contribution - overhead;
  const receipts = s.payments
    .filter(
      (p) =>
        p.kind === "Customer receipt" &&
        inMonth(p.date, month) &&
        (serviceId === "all" ||
          ids.has(s.invoices.find((i) => i.id === p.recordId)?.jobId || "")),
    )
    .reduce((a, p) => a + p.amount, 0);
  const outflow = s.payments
    .filter(
      (p) =>
        p.kind !== "Customer receipt" &&
        inMonth(p.date, month) &&
        (serviceId === "all" ||
          ids.has(
            (
              s.bills.find((b) => b.id === p.recordId) ||
              s.expenses.find((e) => e.id === p.recordId)
            )?.jobId || "",
          )),
    )
    .reduce((a, p) => a + p.amount, 0);
  return {
    earned,
    direct,
    gross,
    marketing,
    overhead,
    contribution,
    net,
    receipts,
    outflow,
    receivables: s.invoices
      .filter((i) => !["Draft", "Voided"].includes(i.status))
      .reduce((a, i) => a + balance(s, i), 0),
    payables: s.bills
      .filter((b) => b.status === "Approved")
      .reduce((a, b) => a + b.amount - paid(s, b.id), 0),
    cash: s.accounts.reduce((a, b) => a + accountBalance(s, b.id), 0),
  };
}
export const permissions: Record<Role, Page[]> = {
  Owner: [
    "Dashboard",
    "Leads",
    "Customers",
    "Quotations",
    "Jobs & Projects",
    "Contractors",
    "Services & Rates",
    "Invoices & Receipts",
    "Expenses",
    "Contractor Payables",
    "Cash & Accounts",
    "Marketing",
    "Reports & Analytics",
    "Team & Permissions",
    "Document Templates",
    "Settings",
    "Audit History",
  ],
  "Finance Manager": [
    "Dashboard",
    "Customers",
    "Quotations",
    "Jobs & Projects",
    "Invoices & Receipts",
    "Expenses",
    "Contractor Payables",
    "Cash & Accounts",
    "Marketing",
    "Reports & Analytics",
    "Audit History",
  ],
  "Operations Manager": [
    "Dashboard",
    "Customers",
    "Quotations",
    "Jobs & Projects",
    "Contractors",
    "Services & Rates",
    "Expenses",
  ],
  "Sales Staff": ["Dashboard", "Leads", "Customers", "Quotations"],
};
export const canFinance = (s: State) =>
  s.role === "Owner" || s.role === "Finance Manager";
export const canCosts = (s: State) => s.role !== "Sales Staff";
export const stages = [
  "New",
  "Contacted",
  "Qualified",
  "Site Visit",
  "Quotation Sent",
  "Negotiation",
  "Won",
  "Lost",
];
export const sources = [
  "WhatsApp",
  "Facebook",
  "Instagram",
  "Website",
  "Phone call",
  "Referral",
  "Returning customer",
  "Other",
];
export const jobStatuses = [
  "Scheduled",
  "In Progress",
  "On Hold",
  "Awaiting Materials",
  "Awaiting Client Approval",
  "Completed",
  "Closed",
  "Cancelled",
];
export const units = [
  "sq ft",
  "running ft",
  "unit",
  "point",
  "sheet",
  "day",
  "visit",
  "project",
];

export const vocabulary = (s: State, key: string, fallback: string[]) =>
  s.settings.vocabulary?.[key] || fallback;
