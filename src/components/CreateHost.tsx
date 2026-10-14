import { snapshotTerms } from "../terms";
import { useEffect, useState } from "react";
import { useApp, recordPayment } from "../store";
import {
  uid,
  today,
  canFinance,
  canCosts,
  permissions,
  vocabulary,
  type Page,
  type Quote,
  type Job,
  type Invoice,
  type Payment,
  jobValue,
  paid,
  invoiceTotal,
} from "../domain";
import { Drawer, Form, Info, type Field } from "./ui";
export default function CreateHost() {
  const app = useApp();
  const { state: s, save, go, mutate, confirm } = app;
  const [request, setRequest] = useState<{ kind: string; context: any } | null>(
    null,
  );
  useEffect(() => {
    app.setCreateHandler((kind, context = {}) => setRequest({ kind, context }));
  }, []);
  if (!request) return null;
  const { kind, context: c } = request;
  const close = () => setRequest(null);
  const options = (rows: any[], label = "name") =>
    rows.map((r) => ({ value: r.id, label: r[label] || r.id }));
  const customers = options(s.customers),
    services = options(s.services.filter((x) => x.active));
  const jobs = options(s.jobs, "title");
  let fields: Field[] = [];
  let title = "",
    hint = "",
    submit: (d: any) => void = () => {};
  const done = (fn: () => void) => {
    fn();
    close();
  };
  const allowedPage: Record<string, Page> = {
    lead: "Leads",
    customer: "Customers",
    quotation: "Quotations",
    job: "Jobs & Projects",
    invoice: "Invoices & Receipts",
    expense: "Expenses",
    bill: "Contractor Payables",
    campaign: "Marketing",
    team: "Team & Permissions",
    service: "Services & Rates",
    contractor: "Contractors",
    property: "Customers",
    followup: "Leads",
    payment: "Invoices & Receipts",
    account: "Cash & Accounts",
  };
  const page = allowedPage[kind];
  if (
    (page && !permissions[s.role].includes(page)) ||
    (["bill", "payment", "account"].includes(kind) && !canFinance(s))
  ) {
    return (
      <Drawer title="Action restricted" onClose={close}>
        <Info>Your simulated role cannot perform this action.</Info>
      </Drawer>
    );
  }
  if (kind === "lead") {
    title = c.id ? "Edit inquiry" : "Capture a new lead";
    hint = "Start with the essentials. Add the rest as the conversation grows.";
    fields = [
      {
        name: "name",
        label: "Customer name",
        required: true,
        default: s.customers.find((x) => x.id === c.customerId)?.name,
      },
      {
        name: "phone",
        label: "Phone / WhatsApp",
        type: "tel",
        default: s.customers.find((x) => x.id === c.customerId)?.phone,
        hint: "Optional for demonstration records.",
      },
      {
        name: "serviceId",
        label: "Service",
        required: true,
        options: services,
      },
      {
        name: "source",
        label: "Source",
        required: true,
        options: vocabulary(s, "Lead sources", [
          "WhatsApp",
          "Facebook",
          "Instagram",
          "Website",
          "Phone call",
          "Referral",
          "Returning customer",
          "Other",
        ]).map((x) => ({ value: x, label: x })),
        default: "WhatsApp",
      },
      {
        name: "requirements",
        label: "What does the customer need?",
        type: "textarea",
        required: true,
      },
      {
        name: "value",
        label: "Expected value (PKR)",
        type: "number",
        default: 0,
      },
      {
        name: "assigned",
        label: "Assigned to",
        options: s.team.map((t) => ({ value: t.name, label: t.name })),
        default: "Sara Khan",
      },
      {
        name: "campaignId",
        label: "Campaign attribution",
        options: options(s.campaigns),
      },
      {
        name: "followUp",
        label: "Next follow-up",
        type: "date",
        default: today,
      },
    ];
    submit = (d) => {
      const normalize = (x: string) => x.replace(/\D/g, "");
      let existing = s.customers.find(
        (x) =>
          (d.phone && normalize(x.phone) === normalize(d.phone)) ||
          x.name.trim().toLowerCase() === d.name.trim().toLowerCase(),
      );
      if (c.customerId)
        existing = s.customers.find((x) => x.id === c.customerId);
      const customer = existing || {
        id: uid("C"),
        name: d.name.trim(),
        phone: d.phone,
        email: "",
        type: "Homeowner",
        properties: [],
        notes: "",
      };
      mutate(
        (st) => ({
          ...st,
          customers: existing ? st.customers : [customer, ...st.customers],
          leads: c.id
            ? st.leads.map((l) =>
                l.id === c.id ? { ...l, ...d, customerId: customer.id } : l,
              )
            : [
                {
                  id: uid("LD"),
                  ...d,
                  customerId: customer.id,
                  stage: "New",
                  priority: "Normal",
                  date: today,
                  notes: [],
                },
                ...st.leads,
              ],
        }),
        existing ? "Lead saved • existing customer reused" : "Lead captured",
      );
      close();
      go("Leads");
    };
  }
  if (kind === "customer") {
    title = c.id ? "Edit customer" : "New customer";
    fields = [
      { name: "name", label: "Full name / business", required: true },
      { name: "phone", label: "Phone / WhatsApp", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      {
        name: "type",
        label: "Customer type",
        options: [
          "Homeowner",
          "Business",
          "Property manager",
          "Commercial client",
          "Other",
        ].map((x) => ({ value: x, label: x })),
        default: "Homeowner",
      },
      { name: "notes", label: "Internal notes", type: "textarea" },
    ];
    submit = (d) => {
      if (
        s.customers.some(
          (x) =>
            x.id !== c.id &&
            (x.name.toLowerCase() === d.name.trim().toLowerCase() ||
              (d.phone && x.phone === d.phone)),
        )
      )
        throw new Error(
          "A matching customer already exists. Open their profile to avoid a duplicate.",
        );
      done(() =>
        save(
          "customers",
          { ...c, ...d, id: c.id || uid("C"), properties: c.properties || [] },
          "Customer saved",
        ),
      );
    };
  }
  if (kind === "property") {
    title = c.property ? "Edit property" : "Add a property";
    fields = [
      { name: "name", label: "Property name", required: true },
      { name: "address", label: "Address / locality", required: true },
      {
        name: "type",
        label: "Property type",
        options: [
          "House",
          "Apartment",
          "Villa",
          "Office",
          "Commercial building",
        ].map((x) => ({ value: x, label: x })),
        default: "House",
      },
      {
        name: "instructions",
        label: "Access & special instructions",
        type: "textarea",
      },
    ];
    submit = (d) =>
      done(() =>
        save(
          "customers",
          {
            ...c.customer,
            properties: c.property
              ? c.customer.properties.map((p: any) =>
                  p.id === c.property.id ? { ...p, ...d } : p,
                )
              : [...c.customer.properties, { ...d, id: uid("P") }],
          },
          "Property saved",
        ),
      );
  }
  if (kind === "followup") {
    title = "Schedule follow-up";
    fields = [
      {
        name: "followUp",
        label: "Next follow-up date",
        type: "date",
        required: true,
        default: today,
      },
      { name: "note", label: "Preparation notes", type: "textarea" },
    ];
    submit = (d) =>
      done(() =>
        save(
          "leads",
          {
            ...c,
            followUp: d.followUp,
            notes: d.note ? [...c.notes, d.note] : c.notes,
          },
          "Follow-up scheduled",
        ),
      );
  }
  if (kind === "note") {
    title = "Add an internal note";
    fields = [
      { name: "note", label: "Note", type: "textarea", required: true },
    ];
    submit = (d) =>
      done(() =>
        save(
          c.collection,
          { ...c.record, notes: [...c.record.notes, d.note] },
          "Note added",
        ),
      );
  }
  if (kind === "quotation") {
    title = "Start a quotation";
    fields = [
      {
        name: "customerId",
        label: "Customer",
        required: true,
        options: customers,
        default: c.customerId || s.customers[0]?.id,
      },
      {
        name: "title",
        label: "Project title",
        required: true,
        default: c.requirements || "",
      },
      {
        name: "serviceId",
        label: "Service",
        required: true,
        options: services,
        default: c.serviceId || "S7",
      },
    ];
    submit = (d) => {
      const customer = s.customers.find((x) => x.id === d.customerId)!;
      const q: Quote = {
        id: uid(s.settings.quotePrefix),
        ...d,
        propertyId: customer.properties[0]?.id || "",
        leadId: c.id || "",
        date: today,
        validUntil: "2026-10-30",
        status: "Draft",
        version: 1,
        parentId: "",
        items: [
          {
            id: uid("I"),
            description: d.title,
            quantity: 1,
            unit:
              s.services.find((x) => x.id === d.serviceId)?.unit || "project",
            rate: s.services.find((x) => x.id === d.serviceId)?.rate || 0,
          },
        ],
        discount: 0,
        tax: 0,
        materials: "With material",
        terms: s.settings.terms,
        ...snapshotTerms(s.services.find((x) => x.id === d.serviceId)!),
        exclusions: "",
        internalCost: 0,
        milestones: [
          {
            id: uid("M"),
            name: "Advance",
            percentage: 50,
            done: false,
            date: today,
          },
          {
            id: uid("M"),
            name: "During work",
            percentage: 25,
            done: false,
            date: "2026-10-20",
          },
          {
            id: uid("M"),
            name: "Completion",
            percentage: 25,
            done: false,
            date: "2026-10-30",
          },
        ],
      };
      save("quotes", q, "Draft quotation created");
      close();
      go("Quotations", q.id);
    };
  }
  if (kind === "job") {
    title = "Create a project";
    hint =
      "Accepted quotations can be converted directly without duplicate entry.";
    fields = [
      {
        name: "customerId",
        label: "Customer",
        required: true,
        options: customers,
      },
      { name: "title", label: "Project title", required: true },
      {
        name: "serviceId",
        label: "Service",
        required: true,
        options: services,
      },
      {
        name: "value",
        label: "Agreed contract value (PKR)",
        type: "number",
        required: true,
      },
      {
        name: "budget",
        label: "Direct cost budget (PKR)",
        type: "number",
        required: true,
      },
      { name: "start", label: "Start date", type: "date", default: today },
      {
        name: "end",
        label: "Expected completion",
        type: "date",
        required: true,
      },
    ];
    submit = (d) => {
      if (d.end < d.start)
        throw new Error("Completion must be on or after the start date.");
      const j: Job = {
        ...d,
        id: uid("JB"),
        propertyId:
          s.customers.find((x) => x.id === d.customerId)?.properties[0]?.id ||
          "",
        quoteId: "",
        campaignId: "",
        status: "Scheduled",
        earned: 0,
        progress: 0,
        contractorIds: [],
        workOrders: [],
        milestones: [],
        changes: [],
        notes: [],
        attachments: [],
      };
      save("jobs", j, "Project created");
      close();
      go("Jobs & Projects", j.id);
    };
  }
  if (kind === "invoice") {
    title = "Create an invoice";
    fields = [
      {
        name: "jobId",
        label: "Linked project",
        required: true,
        options: jobs,
        default: c.id || s.jobs[0]?.id,
      },
      {
        name: "amount",
        label: "Invoice amount (PKR)",
        type: "number",
        required: true,
        default: c.value || 0,
        hint: "May be an advance or a progress invoice.",
      },
      {
        name: "due",
        label: "Due date",
        type: "date",
        required: true,
        default: "2026-10-30",
      },
    ];
    submit = (d) => {
      const job = s.jobs.find((j) => j.id === d.jobId)!;
      const inv: Invoice = {
        id: uid(s.settings.invoicePrefix),
        jobId: job.id,
        customerId: job.customerId,
        date: today,
        due: d.due,
        status: "Draft",
        items: [
          {
            id: uid("I"),
            description: job.title,
            quantity: 1,
            unit: "project",
            rate: d.amount,
          },
        ],
        tax: 0,
        notes:
          "Revenue recognition is managed on the project, separately from this invoice.",
      };
      save("invoices", inv, "Invoice draft created");
      close();
      go("Invoices & Receipts", inv.id);
    };
  }
  if (kind === "payment") {
    title = "Record customer payment";
    const outstanding = invoiceTotal(c) - paid(s, c.id);
    hint = `Outstanding balance: PKR ${outstanding.toLocaleString()}`;
    fields = paymentFields(outstanding, s);
    submit = (d) =>
      confirm(
        "Record this payment?",
        `PKR ${d.amount.toLocaleString()} will be added to the selected cash account. This is a simulated transaction.`,
        () => {
          if (
            mutate(
              (st) =>
                recordPayment(st, {
                  ...d,
                  id: uid("RC"),
                  kind: "Customer receipt",
                  recordId: c.id,
                } as Payment),
              "Customer payment recorded",
            )
          )
            close();
        },
      );
  }
  if (kind === "paybill" || kind === "payexpense") {
    if (!canFinance(s))
      return (
        <Drawer title="Restricted action" onClose={close}>
          <Info>Finance access is required.</Info>
        </Drawer>
      );
    title = kind === "paybill" ? "Pay contractor bill" : "Pay approved expense";
    const remaining = c.amount - paid(s, c.id);
    fields = paymentFields(remaining, s);
    submit = (d) =>
      confirm(
        "Confirm outgoing payment?",
        `PKR ${d.amount.toLocaleString()} will reduce the chosen cash account.`,
        () => {
          if (
            mutate(
              (st) =>
                recordPayment(st, {
                  ...d,
                  id: uid("PAY"),
                  kind:
                    kind === "paybill"
                      ? "Contractor payment"
                      : "Expense payment",
                  recordId: c.id,
                } as Payment),
              "Outgoing payment recorded",
            )
          )
            close();
        },
      );
  }
  if (kind === "expense" || kind === "cost") {
    title = kind === "cost" ? "Record a project cost" : "New expense";
    fields = [
      { name: "description", label: "Description", required: true },
      { name: "amount", label: "Amount (PKR)", type: "number", required: true },
      {
        name: "category",
        label: "Category",
        required: true,
        options: vocabulary(s, "Expense categories", [
          "Materials",
          "Transportation",
          "Tools and equipment",
          "Marketing",
          "Office expenses",
          "Salaries",
          "Utilities",
          "Rent",
          "Miscellaneous",
        ]).map((x) => ({ value: x, label: x })),
        default: c.campaignId ? "Marketing" : "Materials",
      },
      {
        name: "date",
        label: "Incurred date",
        type: "date",
        default: today,
        required: true,
      },
      {
        name: "jobId",
        label: "Related project",
        options: jobs,
        default: kind === "cost" ? c.id : c.jobId,
      },
      {
        name: "campaignId",
        label: "Campaign (marketing only)",
        options: options(s.campaigns),
        default: c.campaignId,
      },
      {
        name: "accountId",
        label: "Payment account",
        options: options(s.accounts),
        default: "A1",
      },
      {
        name: "attachment",
        label: "Receipt filename",
        hint: "Upload is simulated; no files leave this browser.",
      },
    ];
    submit = (d) => {
      if (d.campaignId && d.category !== "Marketing")
        throw new Error("Campaign expenses must use the Marketing category.");
      if (d.campaignId && d.jobId)
        throw new Error(
          "Choose either a campaign or job allocation to prevent double counting.",
        );
      done(() =>
        save(
          "expenses",
          {
            ...d,
            id: uid("EXP"),
            status: canFinance(s) ? "Approved" : "Pending",
          },
          "Expense recorded • cash moves only when paid",
        ),
      );
    };
  }
  if (kind === "bill") {
    title = "Record contractor bill";
    fields = [
      {
        name: "contractorId",
        label: "Contractor",
        options: options(s.contractors),
        required: true,
      },
      {
        name: "jobId",
        label: "Related project",
        options: jobs,
        required: true,
        default: c.jobId,
      },
      { name: "description", label: "Work / bill description", required: true },
      {
        name: "amount",
        label: "Incurred amount (PKR)",
        type: "number",
        required: true,
      },
      {
        name: "date",
        label: "Bill date",
        type: "date",
        default: today,
        required: true,
      },
      {
        name: "due",
        label: "Due date",
        type: "date",
        default: "2026-10-30",
        required: true,
      },
    ];
    submit = (d) =>
      done(() =>
        save(
          "bills",
          { ...d, id: uid("B"), status: "Pending" },
          "Contractor bill recorded for approval",
        ),
      );
  }
  if (kind === "workorder") {
    title = "Assign contractor & work order";
    fields = [
      {
        name: "contractorId",
        label: "Contractor",
        options: options(s.contractors),
        default: c.contractorId,
        required: true,
      },
      {
        name: "scope",
        label: "Agreed work scope",
        type: "textarea",
        required: true,
        default: c.scope,
      },
      {
        name: "budget",
        label: "Agreed labour budget (PKR)",
        type: "number",
        required: true,
        default: c.estimate,
      },
      {
        name: "date",
        label: "Expected completion",
        type: "date",
        default: c.job?.end || c.end || "2026-10-30",
        required: true,
      },
    ];
    submit = (d) => {
      const j = c.job || c;
      done(() =>
        save(
          "jobs",
          {
            ...j,
            contractorIds: Array.from(
              new Set([...j.contractorIds, d.contractorId]),
            ),
            workOrders: [...j.workOrders, { ...d, id: uid("WO") }],
          },
          "Contractor assigned • work order created",
        ),
      );
    };
  }
  if (kind === "milestone") {
    title = "Add a project milestone";
    fields = [
      { name: "name", label: "Milestone", required: true },
      { name: "date", label: "Due date", type: "date", required: true },
      {
        name: "percentage",
        label: "Weight (%)",
        type: "number",
        default: 25,
        required: true,
        max: 100,
      },
    ];
    submit = (d) =>
      done(() =>
        save(
          "jobs",
          {
            ...c,
            milestones: [...c.milestones, { ...d, id: uid("M"), done: false }],
          },
          "Milestone added",
        ),
      );
  }
  if (kind === "change") {
    title = "Add a change order";
    hint = "Changes remain separate from the approved quotation.";
    fields = [
      { name: "title", label: "Additional work", required: true },
      {
        name: "revenue",
        label: "Additional customer price (PKR)",
        type: "number",
        required: true,
      },
      {
        name: "cost",
        label: "Additional cost budget (PKR)",
        type: "number",
        required: true,
      },
      { name: "days", label: "Additional days", type: "number", default: 0 },
    ];
    submit = (d) =>
      done(() =>
        save(
          "jobs",
          {
            ...c,
            changes: [...c.changes, { ...d, id: uid("CO"), date: today }],
            end: new Date(new Date(c.end).getTime() + d.days * 86400000)
              .toISOString()
              .slice(0, 10),
          },
          "Change order recorded; original quotation preserved",
        ),
      );
  }
  if (kind === "service") {
    title = c.id ? "Edit service & rates" : "Add a service";
    fields = [
      { name: "name", label: "Service name", required: true },
      { name: "unit", label: "Pricing unit", required: true, default: "sq ft" },
      {
        name: "rate",
        label: "Material-inclusive rate (PKR)",
        type: "number",
        required: true,
      },
      {
        name: "labourRate",
        label: "Labour-only rate (PKR)",
        type: "number",
        required: true,
      },
      {
        name: "contractorRate",
        label: "Suggested contractor rate (PKR)",
        type: "number",
      },
      {
        name: "description",
        label: "Description / pricing notes",
        type: "textarea",
      },
    ];
    submit = (d) =>
      done(() =>
        save(
          "services",
          {
            ...c,
            ...d,
            id: c.id || uid("S"),
            active: c.active ?? true,
            history: c.id ? [...c.history, { date: today, rate: c.rate }] : [],
          },
          "Rate card saved • issued quotations remain unchanged",
        ),
      );
  }
  if (kind === "contractor") {
    title = c.id ? "Edit contractor" : "Add a specialist contractor";
    fields = [
      { name: "name", label: "Name / business", required: true },
      { name: "phone", label: "Phone / WhatsApp", type: "tel" },
      {
        name: "specialty",
        label: "Primary specialty",
        options: services,
        required: true,
        default: c.specialties?.[0],
      },
      {
        name: "rate",
        label: "Typical rate (PKR)",
        type: "number",
        required: true,
      },
      { name: "unit", label: "Pricing unit", default: "sq ft", required: true },
      {
        name: "availability",
        label: "Availability",
        options: ["Available", "On a job", "Next week", "Inactive"].map(
          (x) => ({ value: x, label: x }),
        ),
        default: "Available",
      },
      { name: "notes", label: "Performance & scope notes", type: "textarea" },
    ];
    submit = (d) =>
      done(() =>
        save(
          "contractors",
          {
            ...c,
            ...d,
            id: c.id || uid("CT"),
            specialties: [d.specialty],
            quality: c.quality || 0,
          },
          "Contractor saved",
        ),
      );
  }
  if (kind === "campaign") {
    title = "New marketing campaign";
    fields = [
      { name: "name", label: "Campaign name", required: true },
      {
        name: "platform",
        label: "Platform",
        options: ["Facebook", "Instagram", "Facebook & Instagram", "Other"].map(
          (x) => ({ value: x, label: x }),
        ),
        required: true,
      },
      {
        name: "serviceId",
        label: "Promoted service",
        options: services,
        required: true,
      },
      {
        name: "start",
        label: "Start date",
        type: "date",
        default: today,
        required: true,
      },
      { name: "end", label: "End date", type: "date", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ];
    submit = (d) =>
      done(() =>
        save(
          "campaigns",
          { ...d, id: uid("CP"), status: "Active" },
          "Campaign created",
        ),
      );
  }
  if (kind === "team") {
    title = c.id ? "Edit team member" : "Invite a team member";
    hint = "This demo creates a pending invitation. No email is sent.";
    fields = [
      { name: "name", label: "Name", required: true },
      { name: "email", label: "Work email", type: "email", required: true },
      {
        name: "role",
        label: "Role",
        options: [
          "Owner",
          "Finance Manager",
          "Operations Manager",
          "Sales Staff",
        ].map((x) => ({ value: x, label: x })),
        default: "Sales Staff",
        required: true,
      },
    ];
    submit = (d) =>
      done(() =>
        save(
          "team",
          {
            ...c,
            ...d,
            id: c.id || uid("T"),
            status: c.status || "Invitation pending",
          },
          c.id
            ? "Team member updated"
            : "Mock invitation created • no email sent",
        ),
      );
  }
  if (kind === "account") {
    title = "Add a cash account";
    fields = [
      { name: "name", label: "Account name", required: true },
      {
        name: "type",
        label: "Type",
        options: ["Bank", "Cash"].map((x) => ({ value: x, label: x })),
        required: true,
      },
      {
        name: "opening",
        label: "Opening balance (PKR)",
        type: "number",
        default: 0,
        required: true,
      },
    ];
    submit = (d) =>
      done(() =>
        save("accounts", { ...d, id: uid("A") }, "Cash account created"),
      );
  }
  if (!title) return null;
  return (
    <Drawer title={title} subtitle={hint} onClose={close}>
      <Form
        key={kind + (c.id || "")}
        fields={fields}
        initial={kind === "property" ? c.property || {} : c}
        onSubmit={submit}
        label={
          kind === "lead"
            ? "Capture inquiry"
            : kind === "payment"
              ? "Review payment"
              : "Save & continue"
        }
      >
        {kind === "quotation" && (
          <Info>
            Customer and property details carry into the studio automatically.
          </Info>
        )}
      </Form>
    </Drawer>
  );
}
function paymentFields(amount: number, s: any): Field[] {
  return [
    {
      name: "amount",
      label: "Amount (PKR)",
      type: "number",
      required: true,
      default: amount,
      max: amount,
    },
    {
      name: "date",
      label: "Payment date",
      type: "date",
      default: today,
      required: true,
    },
    {
      name: "method",
      label: "Payment method",
      options: ["Bank transfer", "Cash", "Cheque", "Other"].map((x) => ({
        value: x,
        label: x,
      })),
      required: true,
    },
    {
      name: "accountId",
      label: "Cash account",
      options: s.accounts.map((a: any) => ({ value: a.id, label: a.name })),
      default: "A1",
      required: true,
    },
    { name: "reference", label: "Transaction reference" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}
