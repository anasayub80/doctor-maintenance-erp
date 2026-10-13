import { useState } from "react";
import {
  Plus,
  Upload,
  ArrowUpRight,
  ArrowRight,
  Download,
  Target,
  TrendingUp,
  Info as InfoIcon,
  AlertTriangle,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { useApp } from "../store";
import {
  type Campaign,
  finance,
  money,
  pct,
  compact,
  inMonth,
  directCost,
  jobValue,
  balance,
  paid,
  invoiceTotal,
  invoiceStatus,
  quoteTotal,
  today,
  uid,
} from "../domain";
import {
  Heading,
  Panel,
  Table,
  Btn,
  Badge,
  Metric,
  Tabs,
  Info,
  DetailHeader,
  PeriodFilters,
  ExportButton,
  Drawer,
  Empty,
} from "../components/ui";
import { CompareBars, TrendChart } from "../components/charts";
import { parseCSV, validImportRow } from "../csv";
export function campaignMetrics(
  s: ReturnType<typeof useApp>["state"],
  c: Campaign,
  month = "all",
) {
  const leads = s.leads.filter(
      (l) => l.campaignId === c.id && inMonth(l.date, month),
    ),
    jobs = s.jobs.filter((j) => j.campaignId === c.id && inMonth(j.end, month));
  const spend = s.expenses
    .filter(
      (e) =>
        e.campaignId === c.id &&
        e.status === "Approved" &&
        inMonth(e.date, month),
    )
    .reduce((a, e) => a + e.amount, 0);
  const revenue = jobs.reduce((a, j) => a + j.earned, 0),
    gross = jobs.reduce((a, j) => a + j.earned - directCost(s, j.id), 0);
  return {
    leads,
    qualified: leads.filter(
      (l) => !["New", "Contacted", "Lost"].includes(l.stage),
    ).length,
    jobs,
    spend,
    revenue,
    gross,
    contribution: gross - spend,
    cpl: leads.length ? spend / leads.length : 0,
    cac: jobs.length ? spend / jobs.length : 0,
  };
}
export function Marketing() {
  const { state: s, recordId, go, openCreate, month, save } = useApp();
  const [importing, setImporting] = useState(false),
    [tab, setTab] = useState("Performance");
  const cp = s.campaigns.find((c) => c.id === recordId);
  if (cp) {
    const m = campaignMetrics(s, cp, month);
    return (
      <>
        <DetailHeader
          title={cp.name}
          reference={`${cp.id} · ${cp.platform}`}
          status={cp.status}
          back="Marketing"
          actions={
            <>
              <Btn
                onClick={() =>
                  save(
                    "campaigns",
                    {
                      ...cp,
                      status: cp.status === "Active" ? "Paused" : "Active",
                    },
                    "Campaign status updated",
                  )
                }
              >
                {cp.status === "Active" ? "Pause campaign" : "Resume campaign"}
              </Btn>
              <Btn
                primary
                onClick={() => openCreate("expense", { campaignId: cp.id })}
              >
                Record ad spend
              </Btn>
            </>
          }
        />
        <PeriodFilters />
        <div className="metrics four">
          <Metric
            label="Marketing spend"
            value={m.spend}
            hint="Approved attributed expenses"
          />
          <Metric
            label="Leads attributed"
            value={String(m.leads.length)}
            hint={`${m.qualified} qualified opportunities`}
          />
          <Metric
            label="Earned revenue"
            value={m.revenue}
            hint="Attributed completed work"
          />
          <Metric
            label="Contribution"
            value={m.contribution}
            hint="Gross profit less campaign spend"
          />
        </div>
        <Info>
          Attributed revenue is not return on investment. Contribution includes
          job costs and campaign spend, without deducting the spend twice.
        </Info>
        <Tabs
          tabs={["Performance", "Leads", "Projects", "Spend ledger"]}
          value={tab}
          onChange={setTab}
        />
        {tab === "Performance" ? (
          <div className="two-col">
            <Panel title="From attention to earned work">
              <div className="campaign-funnel">
                {[
                  ["Attributed leads", m.leads.length],
                  ["Qualified", m.qualified],
                  [
                    "Quotations",
                    s.quotes.filter((q) =>
                      m.leads.some((l) => l.id === q.leadId),
                    ).length,
                  ],
                  ["Converted projects", m.jobs.length],
                ].map(([label, count], i) => (
                  <div
                    key={String(label)}
                    style={{ width: `${100 - i * 12}%` }}
                  >
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Acquisition economics">
              <div className="padded">
                <div className="detail-facts">
                  <div>
                    <label>Cost per lead</label>
                    <strong>{money(m.cpl)}</strong>
                  </div>
                  <div>
                    <label>Cost per converted job</label>
                    <strong>{money(m.cac)}</strong>
                  </div>
                  <div>
                    <label>Attributed gross profit</label>
                    <strong>{money(m.gross)}</strong>
                  </div>
                  <div>
                    <label>After marketing</label>
                    <strong
                      className={
                        m.contribution < 0 ? "overdue-text" : "success-text"
                      }
                    >
                      {money(m.contribution)}
                    </strong>
                  </div>
                </div>
                <p>{cp.notes}</p>
              </div>
            </Panel>
          </div>
        ) : tab === "Leads" ? (
          <Panel>
            <Table
              rows={m.leads}
              onRow={(l) => go("Leads", l.id)}
              columns={[
                {
                  key: "customerId",
                  label: "Customer",
                  render: (l) =>
                    s.customers.find((c) => c.id === l.customerId)?.name,
                },
                { key: "requirements", label: "Request" },
                {
                  key: "stage",
                  label: "Stage",
                  render: (l) => <Badge>{l.stage}</Badge>,
                },
                {
                  key: "value",
                  label: "Expected value",
                  numeric: true,
                  render: (l) => money(l.value),
                },
              ]}
            />
          </Panel>
        ) : tab === "Projects" ? (
          <Panel>
            <Table
              rows={m.jobs}
              onRow={(j) => go("Jobs & Projects", j.id)}
              columns={[
                { key: "title", label: "Project" },
                {
                  key: "earned",
                  label: "Earned revenue",
                  numeric: true,
                  render: (j) => money(j.earned),
                },
                {
                  key: "cost",
                  label: "Direct cost",
                  numeric: true,
                  render: (j) => money(directCost(s, j.id)),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (j) => <Badge>{j.status}</Badge>,
                },
              ]}
            />
          </Panel>
        ) : (
          <Panel>
            <Table
              rows={s.expenses.filter((e) => e.campaignId === cp.id)}
              onRow={() => go("Expenses")}
              columns={[
                { key: "description", label: "Ad expense" },
                { key: "date", label: "Incurred" },
                {
                  key: "amount",
                  label: "Spend",
                  numeric: true,
                  render: (e) => money(e.amount),
                },
                {
                  key: "status",
                  label: "Approval",
                  render: (e) => <Badge>{e.status}</Badge>,
                },
              ]}
            />
          </Panel>
        )}
      </>
    );
  }
  const m = s.campaigns.map((c) => ({ c, m: campaignMetrics(s, c, month) }));
  return (
    <>
      <Heading
        eyebrow="MARKETING INTELLIGENCE"
        title="Promote what performs."
        description="Measure the work your campaigns create — and the profit they leave."
        actions={
          <>
            <Btn onClick={() => setImporting(true)}>
              <Upload size={15} />
              Import CSV
            </Btn>
            <Btn primary onClick={() => openCreate("campaign")}>
              <Plus size={16} />
              New campaign
            </Btn>
          </>
        }
      />
      <PeriodFilters />
      <div className="metrics four">
        <Metric
          dark
          label="Ad spend"
          value={m.reduce((a, r) => a + r.m.spend, 0)}
          hint="Manual entry · No Meta connection"
        />
        <Metric
          label="Attributed leads"
          value={String(m.reduce((a, r) => a + r.m.leads.length, 0))}
          hint="Based on recorded campaign sources"
        />
        <Metric
          label="Attributed revenue"
          value={m.reduce((a, r) => a + r.m.revenue, 0)}
          hint="Earned work, not invoice totals"
        />
        <Metric
          label="Contribution after ads"
          value={m.reduce((a, r) => a + r.m.contribution, 0)}
          hint="Revenue − direct costs − ad spend"
        />
      </div>
      <Panel
        title="Campaign performance"
        subtitle="Every campaign should earn its place in your budget."
      >
        <Table
          rows={m.map((r) => ({ ...r.c, ...r.m, id: r.c.id }))}
          onRow={(r) => go("Marketing", r.id)}
          columns={[
            {
              key: "name",
              label: "Campaign",
              render: (r) => (
                <div>
                  <strong>{r.name}</strong>
                  <small className="muted block">{r.platform}</small>
                </div>
              ),
            },
            {
              key: "spend",
              label: "Spend",
              numeric: true,
              render: (r) => money(r.spend),
            },
            {
              key: "leads",
              label: "Leads",
              numeric: true,
              render: (r) => r.leads.length,
            },
            {
              key: "jobs",
              label: "Jobs",
              numeric: true,
              render: (r) => r.jobs.length,
            },
            {
              key: "revenue",
              label: "Earned revenue",
              numeric: true,
              render: (r) => money(r.revenue),
            },
            {
              key: "cac",
              label: "Acquisition cost",
              numeric: true,
              render: (r) => money(r.cac),
            },
            {
              key: "contribution",
              label: "Contribution",
              numeric: true,
              render: (r) => (
                <strong
                  className={
                    r.contribution < 0 ? "overdue-text" : "success-text"
                  }
                >
                  {money(r.contribution)}
                </strong>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <Badge>{r.status}</Badge>,
            },
          ]}
        />
      </Panel>
      <div className="insight wide-insight">
        <Target size={23} />
        <div>
          <h3>Revenue draws attention. Contribution guides decisions.</h3>
          <p>
            Compare the cost of acquiring work with the actual margin of the
            jobs it creates.
          </p>
        </div>
        <Btn onClick={() => go("Reports & Analytics")}>
          Compare services
          <ArrowRight size={15} />
        </Btn>
      </div>
      {importing && <CSVImport close={() => setImporting(false)} />}
    </>
  );
}
function CSVImport({ close }: { close: () => void }) {
  const { state: s, mutate, toast } = useApp();
  const [step, setStep] = useState(0),
    [data, setData] = useState<string[][]>([]),
    [mapping, setMapping] = useState({ campaign: "", spend: "", date: "" }),
    [serviceId, setServiceId] = useState(s.services[3].id),
    [error, setError] = useState("");
  const headers = data[0] || [];
  const rows = data.slice(1).map((r, i) => ({
    id: String(i),
    campaign: r[headers.indexOf(mapping.campaign)] || "",
    spend: r[headers.indexOf(mapping.spend)] || "",
    date: r[headers.indexOf(mapping.date)] || "",
  }));
  const duplicate = (r: (typeof rows)[number]) =>
    s.expenses.some(
      (e) =>
        e.amount === Number(r.spend) &&
        e.date === r.date &&
        s.campaigns.find((c) => c.id === e.campaignId)?.name === r.campaign,
    );
  const valid = rows.filter(validImportRow).filter((r) => !duplicate(r));
  return (
    <Drawer
      wide
      title="Import advertising expenses"
      subtitle="Frontend-only import. No requests are sent to Meta."
      onClose={close}
    >
      <div className="import-steps">
        {["Select file", "Map & review", "Import summary"].map((x, i) => (
          <span className={i === step ? "active" : ""} key={x}>
            <b>{i + 1}</b>
            {x}
          </span>
        ))}
      </div>
      {step === 0 ? (
        <>
          <label className="upload-zone">
            <FileSpreadsheet size={36} />
            <strong>Choose an advertising CSV</strong>
            <span>Campaign, spend and incurred date are required.</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 1000000)
                    throw new Error(
                      "Use a CSV smaller than 1 MB for this prototype.",
                    );
                  const parsed = parseCSV(await file.text());
                  setData(parsed);
                  setMapping({
                    campaign: parsed[0].find((x) => /campaign/i.test(x)) || "",
                    spend: parsed[0].find((x) => /spend|amount/i.test(x)) || "",
                    date: parsed[0].find((x) => /date/i.test(x)) || "",
                  });
                  setStep(1);
                  setError("");
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            />
          </label>
          <Info>
            Dates use YYYY-MM-DD and amounts are entered in PKR. Imported
            expenses are incurred costs, not cash payments.
          </Info>
          <Btn
            onClick={() => {
              const content =
                "campaign,spend,date\nPainting test campaign,15000,2026-10-14\n";
              const a = document.createElement("a");
              a.href = URL.createObjectURL(
                new Blob([content], { type: "text/csv" }),
              );
              a.download = "advertising-import-template.csv";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            <Download size={15} />
            Download template
          </Btn>
        </>
      ) : step === 1 ? (
        <>
          <div className="form-grid">
            {Object.entries(mapping).map(([key, value]) => (
              <label className="field" key={key}>
                <span>{key} column</span>
                <select
                  value={value}
                  onChange={(e) =>
                    setMapping({ ...mapping, [key]: e.target.value })
                  }
                >
                  <option value="">Select column</option>
                  {headers.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
            ))}
            <label className="field">
              <span>Service for new campaigns</span>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                {s.services.map((sv) => (
                  <option key={sv.id} value={sv.id}>
                    {sv.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Table
            rows={rows}
            columns={[
              { key: "campaign", label: "Campaign" },
              { key: "spend", label: "Spend", numeric: true },
              { key: "date", label: "Date" },
              {
                key: "validation",
                label: "Validation",
                render: (r) => (
                  <Badge>
                    {!validImportRow(r)
                      ? "Invalid row"
                      : duplicate(r)
                        ? "Duplicate skipped"
                        : "Ready"}
                  </Badge>
                ),
              },
            ]}
          />
          <Info>
            {valid.length} valid rows · {rows.filter(duplicate).length} existing
            duplicates skipped · {rows.filter((r) => !validImportRow(r)).length}{" "}
            invalid rows skipped. Duplicate rows inside this file will also be
            skipped.
          </Info>
          <Btn
            primary
            disabled={!valid.length}
            onClick={() => {
              let count = 0;
              mutate((st) => {
                const next = structuredClone(st);
                for (const r of valid) {
                  let cp = next.campaigns.find((c) => c.name === r.campaign);
                  if (!cp) {
                    cp = {
                      id: uid("CP"),
                      name: r.campaign,
                      platform: "Meta • CSV import",
                      serviceId,
                      start: r.date,
                      end: r.date,
                      status: "Active",
                      notes: "Imported manually from CSV",
                    };
                    next.campaigns.push(cp);
                  }
                  if (
                    next.expenses.some(
                      (e) =>
                        e.campaignId === cp!.id &&
                        e.date === r.date &&
                        e.amount === Number(r.spend),
                    )
                  )
                    continue;
                  next.expenses.push({
                    id: uid("EXP"),
                    description: r.campaign,
                    category: "Marketing",
                    amount: Number(r.spend),
                    date: r.date,
                    jobId: "",
                    campaignId: cp.id,
                    status: "Approved",
                    accountId: "A1",
                    attachment: "",
                  });
                  count++;
                }
                return next;
              }, "Advertising CSV imported");
              setStep(2);
              toast(`${count} advertising expenses imported into the demo`);
            }}
          >
            <Check size={15} />
            Import valid rows
          </Btn>
        </>
      ) : (
        <div className="import-success">
          <Check size={36} />
          <h2>Expenses added to your workspace.</h2>
          <p>
            Campaign reporting and accrued marketing costs now include the
            imported records. Cash is unchanged.
          </p>
          <Btn primary onClick={close}>
            Done
          </Btn>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Drawer>
  );
}
const reportNames = [
  "Service profitability",
  "Job profitability",
  "Contractor performance",
  "Lead conversion",
  "Quotation conversion",
  "Marketing performance",
  "Monthly P&L",
  "Cash flow",
  "Receivables aging",
  "Payables aging",
  "Revenue trends",
];
export function Reports() {
  const { state: s, go, month, serviceFilter, setServiceFilter } = useApp();
  const [report, setReport] = useState("Service profitability"),
    [compare, setCompare] = useState(false),
    [contractor, setContractor] = useState("all"),
    [campaign, setCampaign] = useState("all");
  const f = finance(s, month, serviceFilter);
  const previousMonth =
    month === "all"
      ? "2026-09"
      : new Date(
          Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 2, 1),
        )
          .toISOString()
          .slice(0, 7);
  const previousRevenue = finance(s, previousMonth, serviceFilter).earned;

  const serviceRows = s.services
    .filter((v) => serviceFilter === "all" || v.id === serviceFilter)
    .map((v) => {
      const f = finance(s, month, v.id);
      return {
        id: v.id,
        service: v.name,
        jobs: s.jobs.filter(
          (j) => j.serviceId === v.id && j.earned > 0 && inMonth(j.end, month),
        ).length,
        revenue: f.earned,
        cost: f.direct,
        gross: f.gross,
        grossMargin: pct(f.gross, f.earned),
        marketing: f.marketing,
        contribution: f.contribution,
        contributionMargin: pct(f.contribution, f.earned),
      };
    })
    .filter((r) => r.revenue || r.cost || r.marketing);
  let rows: any[] = [],
    columns: any[] = [];
  let target: (r: any) => void = () => {};
  const amountCol = (key: string, label: string) => ({
    key,
    label,
    numeric: true,
    render: (r: any) => money(r[key]),
  });
  if (report === "Service profitability") {
    rows = serviceRows;
    columns = [
      { key: "service", label: "Service" },
      { key: "jobs", label: "Completed jobs", numeric: true },
      amountCol("revenue", "Earned revenue"),
      amountCol("cost", "Direct costs"),
      amountCol("gross", "Gross profit"),
      {
        key: "grossMargin",
        label: "Gross margin",
        numeric: true,
        render: (r: any) => `${r.grossMargin}%`,
      },
      amountCol("marketing", "Marketing"),
      {
        ...amountCol("contribution", "Contribution"),
        render: (r: any) => (
          <strong
            className={r.contribution < 0 ? "overdue-text" : "success-text"}
          >
            {money(r.contribution)}
          </strong>
        ),
      },
      {
        key: "contributionMargin",
        label: "Margin",
        numeric: true,
        render: (r: any) => `${r.contributionMargin}%`,
      },
    ];
    target = (r) => {
      setServiceFilter(r.id);
      setReport("Job profitability");
    };
  }
  if (report === "Job profitability") {
    rows = s.jobs
      .filter(
        (j) =>
          inMonth(j.end, month) &&
          (serviceFilter === "all" || j.serviceId === serviceFilter) &&
          (contractor === "all" || j.contractorIds.includes(contractor)) &&
          (campaign === "all" || j.campaignId === campaign),
      )
      .map((j) => ({
        ...j,
        contract: jobValue(j),
        cost: directCost(s, j.id),
        profit: j.earned - directCost(s, j.id),
        variance:
          directCost(s, j.id) -
          j.budget -
          j.changes.reduce((a, c) => a + c.cost, 0),
      }));
    columns = [
      { key: "title", label: "Project" },
      amountCol("contract", "Contract"),
      amountCol("earned", "Earned revenue"),
      amountCol("cost", "Actual costs"),
      amountCol("profit", "Gross profit"),
      amountCol("variance", "Over / under budget"),
      {
        key: "status",
        label: "Delivery status",
        render: (r: any) => <Badge>{r.status}</Badge>,
      },
    ];
    target = (r) => go("Jobs & Projects", r.id);
  }
  if (report === "Contractor performance") {
    rows = s.contractors
      .filter((c) => contractor === "all" || c.id === contractor)
      .map((c) => ({
        ...c,
        jobs: s.jobs.filter(
          (j) => j.contractorIds.includes(c.id) && inMonth(j.end, month),
        ).length,
        billed: s.bills
          .filter(
            (b) =>
              b.contractorId === c.id &&
              b.status === "Approved" &&
              inMonth(b.date, month),
          )
          .reduce((a, b) => a + b.amount, 0),
        outstanding: s.bills
          .filter((b) => b.contractorId === c.id && b.status === "Approved")
          .reduce((a, b) => a + b.amount - paid(s, b.id), 0),
      }));
    columns = [
      { key: "name", label: "Specialist" },
      { key: "jobs", label: "Projects", numeric: true },
      amountCol("billed", "Approved labour"),
      amountCol("outstanding", "Outstanding"),
      { key: "quality", label: "Internal quality score", numeric: true },
      { key: "notes", label: "Performance notes" },
    ];
    target = (r) => go("Contractors", r.id);
  }
  if (report === "Lead conversion") {
    rows = [
      "New",
      "Contacted",
      "Qualified",
      "Site Visit",
      "Quotation Sent",
      "Negotiation",
      "Won",
      "Lost",
    ].map((stage) => ({
      id: stage,
      stage,
      count: s.leads.filter(
        (l) =>
          l.stage === stage &&
          inMonth(l.date, month) &&
          (serviceFilter === "all" || l.serviceId === serviceFilter),
      ).length,
      value: s.leads
        .filter(
          (l) =>
            l.stage === stage &&
            inMonth(l.date, month) &&
            (serviceFilter === "all" || l.serviceId === serviceFilter),
        )
        .reduce((a, l) => a + l.value, 0),
    }));
    columns = [
      { key: "stage", label: "Current stage" },
      { key: "count", label: "Lead count", numeric: true },
      amountCol("value", "Expected value"),
    ];
    target = () => go("Leads");
  }
  if (report === "Quotation conversion") {
    rows = s.quotes
      .filter(
        (q) =>
          inMonth(q.date, month) &&
          (serviceFilter === "all" || q.serviceId === serviceFilter),
      )
      .map((q) => ({
        ...q,
        total: quoteTotal(q),
        customer: s.customers.find((c) => c.id === q.customerId)?.name,
      }));
    columns = [
      { key: "id", label: "Quotation" },
      { key: "title", label: "Project" },
      { key: "customer", label: "Customer" },
      amountCol("total", "Quoted value"),
      { key: "version", label: "Revision", numeric: true },
      {
        key: "status",
        label: "Outcome",
        render: (r: any) => <Badge>{r.status}</Badge>,
      },
    ];
    target = (r) => go("Quotations", r.id);
  }
  if (report === "Marketing performance") {
    rows = s.campaigns
      .filter(
        (c) =>
          (campaign === "all" || c.id === campaign) &&
          (serviceFilter === "all" || c.serviceId === serviceFilter),
      )
      .map((c) => {
        const m = campaignMetrics(s, c, month);
        return {
          ...c,
          ...m,
          leadCount: m.leads.length,
          jobCount: m.jobs.length,
        };
      });
    columns = [
      { key: "name", label: "Campaign" },
      amountCol("spend", "Spend"),
      { key: "leadCount", label: "Leads", numeric: true },
      { key: "jobCount", label: "Jobs", numeric: true },
      amountCol("revenue", "Earned revenue"),
      amountCol("gross", "Gross profit"),
      amountCol("contribution", "Contribution"),
    ];
    target = (r) => go("Marketing", r.id);
  }
  if (report === "Monthly P&L" || report === "Revenue trends") {
    rows = ["2026-09", "2026-10"]
      .filter((m) => month === "all" || m === month)
      .map((m) => ({ ...finance(s, m, serviceFilter), id: m, period: m }));
    columns = [
      { key: "period", label: "Period" },
      amountCol("earned", "Earned revenue"),
      amountCol("direct", "Direct costs"),
      amountCol("gross", "Gross profit"),
      amountCol("marketing", "Marketing"),
      amountCol("overhead", "Overhead"),
      amountCol("net", "Net profit"),
    ];
    target = () => go("Cash & Accounts");
  }
  if (report === "Cash flow") {
    rows = s.payments
      .filter((p) => inMonth(p.date, month))
      .map((p) => ({
        ...p,
        inflow: p.kind === "Customer receipt" ? p.amount : 0,
        outflow: p.kind === "Customer receipt" ? 0 : p.amount,
        account: s.accounts.find((a) => a.id === p.accountId)?.name,
      }));
    columns = [
      { key: "date", label: "Date" },
      { key: "kind", label: "Movement" },
      { key: "recordId", label: "Source record" },
      { key: "account", label: "Account" },
      amountCol("inflow", "Inflow"),
      amountCol("outflow", "Outflow"),
    ];
    target = (r) =>
      go(
        r.kind === "Customer receipt"
          ? "Invoices & Receipts"
          : "Cash & Accounts",
        r.kind === "Customer receipt" ? r.recordId : "",
      );
  }
  if (report === "Receivables aging" || report === "Payables aging") {
    const recv = report === "Receivables aging";
    rows = (
      recv
        ? s.invoices.filter((i) => !["Draft", "Voided"].includes(i.status))
        : s.bills.filter((b) => b.status === "Approved")
    )
      .map((r: any) => {
        const days = Math.max(
          0,
          Math.floor(
            (new Date(today).getTime() - new Date(r.due).getTime()) / 86400000,
          ),
        );
        return {
          ...r,
          party: recv
            ? s.customers.find((c) => c.id === r.customerId)?.name
            : s.contractors.find((c) => c.id === r.contractorId)?.name,
          remaining: (recv ? invoiceTotal(r) : r.amount) - paid(s, r.id),
          days,
          bucket:
            days === 0
              ? "Current"
              : days <= 30
                ? "1–30 days"
                : days <= 60
                  ? "31–60 days"
                  : days <= 90
                    ? "61–90 days"
                    : "90+ days",
        };
      })
      .filter((r) => r.remaining > 0);
    columns = [
      { key: "id", label: "Reference" },
      { key: "party", label: recv ? "Customer" : "Contractor" },
      { key: "due", label: "Due date" },
      amountCol("remaining", "Outstanding"),
      { key: "days", label: "Days overdue", numeric: true },
      { key: "bucket", label: "Aging bucket" },
    ];
    target = (r) =>
      go(
        recv ? "Invoices & Receipts" : "Contractor Payables",
        recv ? r.id : "",
      );
  }
  return (
    <>
      <Heading
        eyebrow="BUSINESS INTELLIGENCE"
        title="See what’s working. Know what to change."
        description="Financial clarity, with a path back to every source record."
        actions={<PeriodFilters />}
      />
      <div className="reports-layout">
        <aside className="reports-nav">
          <span className="eyebrow">REPORT LIBRARY</span>
          {reportNames.map((r) => (
            <button
              className={report === r ? "selected" : ""}
              key={r}
              onClick={() => setReport(r)}
            >
              {r}
              <ArrowUpRight size={13} />
            </button>
          ))}
        </aside>
        <div className="report-content">
          <div className="report-title">
            <div>
              <h2>{report}</h2>
              <p>
                {report === "Service profitability"
                  ? "Completed job volume is only one part of the picture."
                  : "Click a record to inspect the underlying workspace."}
              </p>
            </div>
            <ExportButton
              rows={rows}
              name={report.toLowerCase().replaceAll(" ", "-")}
            />
          </div>
          <div className="report-filter-row">
            <select
              disabled={
                !["Job profitability", "Contractor performance"].includes(
                  report,
                )
              }
              aria-label="Contractor filter"
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
            >
              <option value="all">All contractors</option>
              {s.contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              disabled={
                !["Job profitability", "Marketing performance"].includes(report)
              }
              aria-label="Campaign filter"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
            >
              <option value="all">All campaigns</option>
              {s.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
              />
              Compare previous month
            </label>
          </div>
          {compare && (
            <Info>
              Current period earned revenue: {money(f.earned)}. Previous period
              ({previousMonth}): {money(previousRevenue)}.{" "}
              {previousRevenue
                ? `${pct(f.earned - previousRevenue, previousRevenue)}% change.`
                : "No previous-period revenue; percentage change is undefined."}
            </Info>
          )}
          {report === "Service profitability" && (
            <>
              <Panel title="Contribution, beyond volume">
                <CompareBars
                  rows={serviceRows.map((r) => ({
                    label: r.service,
                    revenue: r.revenue,
                    profit: r.contribution,
                  }))}
                  onRow={(i) => target(serviceRows[i])}
                />
              </Panel>
              <Info tone="warning">
                <AlertTriangle size={17} />
                More jobs can create less profit. Negative contribution needs a
                scope, pricing or acquisition-cost review.
              </Info>
            </>
          )}
          <Panel>
            <Table key={report} rows={rows} columns={columns} onRow={target} />
          </Panel>
          <div className="report-definition">
            <InfoIcon size={16} />
            <p>
              <strong>How to read this:</strong> Gross profit = earned revenue −
              approved direct costs. Contribution = gross profit − attributable
              marketing. Company net profit deducts remaining overhead once.
              In-progress project costs may precede revenue at handover.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
