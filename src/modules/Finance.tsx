import { useState } from "react";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpRight as ArrowOut,
  Wallet,
  Landmark,
  LockKeyhole,
  Info as InfoIcon,
  Check,
  FileText,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../store";
import {
  finance,
  accountBalance,
  money,
  paid,
  canFinance,
  inMonth,
  balance,
  invoiceTotal,
  invoiceStatus,
  today,
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
  Drawer,
  Timeline,
  PeriodFilters,
  ExportButton,
  Empty,
} from "../components/ui";
export function Expenses() {
  const { state: s, save, openCreate, go, confirm, month } = useApp();
  const [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState("");
  const e = s.expenses.find((e) => e.id === selected);
  return (
    <>
      <Heading
        eyebrow="FINANCIAL CONTROL"
        title="Every rupee, accounted for."
        description="Track incurred costs first. Record cash payments separately."
        actions={
          <>
            <ExportButton rows={s.expenses} name="expenses" />
            <Btn primary onClick={() => openCreate("expense")}>
              <Plus size={16} />
              New expense
            </Btn>
          </>
        }
      />
      <div className="metrics three">
        <Metric
          label="Approved expenses"
          value={s.expenses
            .filter((e) => e.status === "Approved")
            .reduce((a, e) => a + e.amount, 0)}
          hint="Incurred costs across the demo"
        />
        <Metric
          label="Awaiting approval"
          value={s.expenses
            .filter((e) => e.status === "Pending")
            .reduce((a, e) => a + e.amount, 0)}
          hint="Excluded from accrued profit until approved"
        />
        <Metric
          label="Unpaid approved expenses"
          value={s.expenses
            .filter((e) => e.status === "Approved")
            .reduce((a, e) => a + e.amount - paid(s, e.id), 0)}
          hint="Cash has not moved for this balance"
        />
      </div>
      <Panel>
        <Table
          rows={s.expenses.filter(
            (e) => filter === "all" || e.status === filter,
          )}
          onRow={(e) => setSelected(e.id)}
          toolbar={
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Expense approval"
            >
              <option value="all">All approval states</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          }
          columns={[
            {
              key: "description",
              label: "Expense",
              render: (e) => (
                <div>
                  <strong>{e.description}</strong>
                  <small className="muted block">{e.id}</small>
                </div>
              ),
            },
            { key: "category", label: "Category" },
            { key: "date", label: "Incurred date" },
            {
              key: "linked",
              label: "Allocation",
              render: (e) =>
                e.jobId
                  ? s.jobs.find((j) => j.id === e.jobId)?.title
                  : e.campaignId
                    ? s.campaigns.find((c) => c.id === e.campaignId)?.name
                    : "Company overhead",
            },
            {
              key: "amount",
              label: "Amount",
              numeric: true,
              render: (e) => money(e.amount),
            },
            {
              key: "paid",
              label: "Cash paid",
              numeric: true,
              render: (e) => money(paid(s, e.id)),
            },
            {
              key: "status",
              label: "Approval",
              render: (e) => <Badge>{e.status}</Badge>,
            },
          ]}
        />
      </Panel>
      {e && (
        <Drawer
          title={e.description}
          subtitle={`${e.id} · ${e.category}`}
          onClose={() => setSelected("")}
        >
          <div className="drawer-financial">
            <span>Incurred amount</span>
            <strong>{money(e.amount)}</strong>
            <Badge>{e.status}</Badge>
          </div>
          <div className="detail-facts">
            <div>
              <label>Incurred date</label>
              <strong>{e.date}</strong>
            </div>
            <div>
              <label>Paid to date</label>
              <strong>{money(paid(s, e.id))}</strong>
            </div>
            <div>
              <label>Outstanding</label>
              <strong>{money(e.amount - paid(s, e.id))}</strong>
            </div>
            <div>
              <label>Receipt</label>
              <strong>{e.attachment || "Not attached"}</strong>
            </div>
          </div>
          <Info>
            Approved costs affect accrual profit. Payments affect cash accounts.
            They are never deducted twice.
          </Info>
          {canFinance(s) ? (
            <div className="actions">
              {e.status === "Pending" ? (
                <>
                  <Btn
                    primary
                    onClick={() =>
                      confirm(
                        "Approve incurred expense?",
                        `${money(e.amount)} will enter the accrued cost ledger. Cash stays unchanged.`,
                        () =>
                          save(
                            "expenses",
                            { ...e, status: "Approved" },
                            "Expense approved",
                          ),
                      )
                    }
                  >
                    <Check size={15} />
                    Approve
                  </Btn>
                  <Btn
                    onClick={() =>
                      save(
                        "expenses",
                        { ...e, status: "Rejected" },
                        "Expense rejected",
                      )
                    }
                  >
                    Reject
                  </Btn>
                </>
              ) : (
                e.status === "Approved" && (
                  <Btn
                    primary
                    disabled={paid(s, e.id) >= e.amount}
                    onClick={() => {
                      setSelected("");
                      openCreate("payexpense", e);
                    }}
                  >
                    Record cash payment
                  </Btn>
                )
              )}
            </div>
          ) : (
            <Info>Finance approval is required before payment.</Info>
          )}
          {e.jobId && (
            <Btn onClick={() => go("Jobs & Projects", e.jobId)}>
              Open linked project
              <ArrowRight size={15} />
            </Btn>
          )}
          <h3 className="spaced-heading">Cash payment history</h3>
          <Timeline
            items={s.payments
              .filter((p) => p.recordId === e.id)
              .map((p) => ({
                title: money(p.amount),
                detail: p.method,
                date: p.date,
              }))}
          />
        </Drawer>
      )}
    </>
  );
}
export function Payables() {
  const { state: s, save, go, openCreate, confirm } = useApp();
  const [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState("");
  const bill = s.bills.find((b) => b.id === selected);
  const status = (b: (typeof s.bills)[number]) =>
    b.status !== "Approved"
      ? b.status
      : paid(s, b.id) >= b.amount
        ? "Paid"
        : b.due < today
          ? "Overdue"
          : paid(s, b.id) > 0
            ? "Partially Paid"
            : "Outstanding";
  const owed = s.bills
    .filter((b) => b.status === "Approved")
    .reduce((a, b) => a + b.amount - paid(s, b.id), 0);
  return (
    <>
      <Heading
        eyebrow="CONTRACTOR PAYABLES"
        title="Fair work. Clear obligations."
        description="Approved bills, partial payments and due balances for every partner."
        actions={
          <Btn primary onClick={() => openCreate("bill")}>
            <Plus size={16} />
            Record contractor bill
          </Btn>
        }
      />
      <div className="metrics three">
        <Metric
          label="Contractor obligations"
          value={owed}
          hint="Approved and unpaid bills"
        />
        <Metric
          label="Payments made"
          value={s.payments
            .filter((p) => p.kind === "Contractor payment")
            .reduce((a, p) => a + p.amount, 0)}
          hint="Cash already transferred"
        />
        <Metric
          label="Bills to approve"
          value={String(s.bills.filter((b) => b.status === "Pending").length)}
          hint="Review scope and work before approving"
        />
      </div>
      <Panel>
        <Table
          rows={s.bills.filter((b) => filter === "all" || status(b) === filter)}
          onRow={(b) => setSelected(b.id)}
          toolbar={
            <select
              aria-label="Bill status filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All balances</option>
              {[
                "Outstanding",
                "Partially Paid",
                "Paid",
                "Pending",
                "Overdue",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          }
          columns={[
            {
              key: "contractorId",
              label: "Contractor",
              render: (b) => (
                <div>
                  <strong>
                    {s.contractors.find((c) => c.id === b.contractorId)?.name}
                  </strong>
                  <small className="muted block">
                    {b.id} · {b.description}
                  </small>
                </div>
              ),
            },
            {
              key: "jobId",
              label: "Project",
              render: (b) => s.jobs.find((j) => j.id === b.jobId)?.title,
            },
            {
              key: "amount",
              label: "Bill amount",
              numeric: true,
              render: (b) => money(b.amount),
            },
            {
              key: "paid",
              label: "Paid",
              numeric: true,
              render: (b) => money(paid(s, b.id)),
            },
            {
              key: "remaining",
              label: "Outstanding",
              numeric: true,
              render: (b) => money(b.amount - paid(s, b.id)),
            },
            { key: "due", label: "Due date" },
            {
              key: "status",
              label: "Status",
              render: (b) => <Badge>{status(b)}</Badge>,
            },
          ]}
        />
      </Panel>
      {bill && (
        <Drawer
          title="Contractor bill"
          subtitle={`${bill.id} · ${s.contractors.find((c) => c.id === bill.contractorId)?.name}`}
          onClose={() => setSelected("")}
        >
          <div className="drawer-financial">
            <span>{bill.description}</span>
            <strong>{money(bill.amount - paid(s, bill.id))}</strong>
            <Badge>{status(bill)}</Badge>
          </div>
          <p>
            Due {bill.due} · Incurred {bill.date}
          </p>
          <Info>
            Bill approval records incurred labour cost once. Payments settle the
            obligation and reduce cash.
          </Info>
          <div className="actions">
            {bill.status === "Pending" ? (
              <Btn
                primary
                onClick={() =>
                  confirm(
                    "Approve contractor bill?",
                    `${money(bill.amount)} will count as direct project cost.`,
                    () =>
                      save(
                        "bills",
                        { ...bill, status: "Approved" },
                        "Contractor bill approved",
                      ),
                  )
                }
              >
                Approve bill
              </Btn>
            ) : (
              <Btn
                primary
                disabled={
                  bill.status !== "Approved" || paid(s, bill.id) >= bill.amount
                }
                onClick={() => {
                  setSelected("");
                  openCreate("paybill", bill);
                }}
              >
                Record payment
              </Btn>
            )}
            <Btn onClick={() => go("Jobs & Projects", bill.jobId)}>
              Open project
            </Btn>
          </div>
          <h3 className="spaced-heading">Payment history</h3>
          <Timeline
            items={s.payments
              .filter((p) => p.recordId === bill.id)
              .map((p) => ({
                title: money(p.amount),
                detail: `${p.method} · ${p.reference}`,
                date: p.date,
              }))}
          />
        </Drawer>
      )}
    </>
  );
}
export function Finance() {
  const { state: s, month, serviceFilter, go, openCreate } = useApp();
  const [mode, setMode] = useState("Accrual profitability"),
    [tab, setTab] = useState("Overview"),
    [account, setAccount] = useState("all"),
    [transaction, setTransaction] = useState("");
  const f = finance(s, month, serviceFilter),
    cash = mode === "Cash movement";
  const tx = s.payments.find((p) => p.id === transaction);
  const periodsClosed = s.settings.periodClosed;
  const transactions = s.payments.filter(
    (p) =>
      inMonth(p.date, month) && (account === "all" || p.accountId === account),
  );
  return (
    <>
      <Heading
        eyebrow="FINANCE & ACCOUNTING"
        title="Understand the business behind the balance."
        description="A deliberate separation of profitability and cash movement."
        actions={<PeriodFilters />}
      />
      <div className="finance-mode">
        <Tabs
          tabs={["Accrual profitability", "Cash movement"]}
          value={mode}
          onChange={setMode}
        />
        <span>
          <InfoIcon size={15} />
          {cash
            ? "Cash received and paid, including advances."
            : "Earned revenue and incurred costs, regardless of payment."}
        </span>
      </div>
      <div className="metrics four">
        <Metric
          dark
          label={cash ? "Cash collected" : "Revenue earned"}
          value={cash ? f.receipts : f.earned}
          hint={
            cash ? "Actual customer receipts" : "Work recognized at handover"
          }
        />
        <Metric
          label={cash ? "Cash paid" : "Gross profit"}
          value={cash ? f.outflow : f.gross}
          hint={
            cash
              ? "Contractor & expense payments"
              : `${f.earned ? Math.round((f.gross / f.earned) * 100) : 0}% gross margin`
          }
        />
        <Metric
          label={cash ? "Net cash movement" : "Net profit"}
          value={cash ? f.receipts - f.outflow : f.net}
          hint={cash ? "Inflow minus outflow" : "After marketing and overhead"}
        />
        <Metric
          label={cash ? "Current cash balance" : "Contractor payables"}
          value={cash ? f.cash : f.payables}
          hint="Current balance across all periods"
        />
      </div>
      <Tabs
        tabs={[
          "Overview",
          "Accounts",
          "Transactions",
          "Receivables",
          "Period controls",
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Overview" && (
        <div className="two-col">
          <Panel
            title={cash ? "Where the cash moved" : "Profit & loss bridge"}
            subtitle={
              cash
                ? "Actual recorded receipts and payments"
                : "Each incurred expense appears exactly once"
            }
          >
            <div className="profit-bridge">
              {(cash
                ? [
                    ["Cash collected", f.receipts],
                    ["Cash paid", -f.outflow],
                    ["Net cash movement", f.receipts - f.outflow],
                  ]
                : [
                    ["Earned revenue", f.earned],
                    ["Direct job costs", -f.direct],
                    ["Gross profit", f.gross],
                    ["Attributable marketing", -f.marketing],
                    ["Contribution profit", f.contribution],
                    ["Remaining overhead", -f.overhead],
                    ["Company net profit", f.net],
                  ]
              ).map(([label, value], i) => (
                <div
                  className={
                    String(label).includes("profit") ||
                    label === "Net cash movement"
                      ? "subtotal"
                      : ""
                  }
                  key={String(label)}
                >
                  <span>
                    <i
                      style={{
                        background:
                          Number(value) < 0
                            ? "#b87561"
                            : i === 0
                              ? "#b3925a"
                              : "#496552",
                      }}
                    />
                    {label}
                  </span>
                  <strong className={Number(value) < 0 ? "negative-text" : ""}>
                    {money(Number(value))}
                  </strong>
                </div>
              ))}
            </div>
            <div className="panel-note">
              {serviceFilter !== "all"
                ? "Filtered service view shows contribution; shared company overhead is excluded."
                : "Period figures reflect demonstration recognition dates."}
            </div>
          </Panel>
          <Panel title="What the balances are telling you">
            <div className="padded">
              <button
                className="balance-link"
                onClick={() => go("Invoices & Receipts")}
              >
                <div>
                  <span>Customer receivables</span>
                  <strong>{money(f.receivables)}</strong>
                  <small>Issued invoices less receipts</small>
                </div>
                <ArrowUpRight size={20} />
              </button>
              <button
                className="balance-link"
                onClick={() => go("Contractor Payables")}
              >
                <div>
                  <span>Contractor payables</span>
                  <strong>{money(f.payables)}</strong>
                  <small>Approved bills less payments</small>
                </div>
                <ArrowUpRight size={20} />
              </button>
              <Info tone="warning">
                <strong>Cash is not profit.</strong> Advances increase cash
                before revenue is earned. Approved bills reduce profit before
                cash is paid.
              </Info>
              <Btn onClick={() => go("Reports & Analytics")}>
                Compare service contribution
                <ArrowRight size={15} />
              </Btn>
            </div>
          </Panel>
        </div>
      )}
      {tab === "Accounts" && (
        <>
          <div className="workspace-toolbar">
            <p className="muted">Opening balances + recorded cash movements</p>
            <Btn primary onClick={() => openCreate("account")}>
              <Plus size={15} />
              Add account
            </Btn>
          </div>
          <div className="account-grid">
            {s.accounts.map((a) => (
              <button
                className="account-card"
                key={a.id}
                onClick={() => {
                  setAccount(a.id);
                  setTab("Transactions");
                }}
              >
                <span className="account-icon">
                  {a.type === "Bank" ? (
                    <Landmark size={20} />
                  ) : (
                    <Wallet size={20} />
                  )}
                </span>
                <div>
                  <span>{a.type} account</span>
                  <h3>{a.name}</h3>
                </div>
                <strong>{money(accountBalance(s, a.id))}</strong>
                <small>Opening balance {money(a.opening)}</small>
                <span className="text-btn">
                  Inspect transactions
                  <ArrowUpRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </>
      )}
      {tab === "Transactions" && (
        <Panel
          title="Cash ledger"
          action={<ExportButton rows={transactions} name="cash-ledger" />}
        >
          <Table
            rows={transactions}
            onRow={(p) => setTransaction(p.id)}
            toolbar={
              <select
                aria-label="Account filter"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              >
                <option value="all">All accounts</option>
                {s.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            }
            columns={[
              {
                key: "id",
                label: "Transaction",
                render: (p) => (
                  <div className="transaction-name">
                    <span
                      className={
                        p.kind === "Customer receipt" ? "inflow" : "outflow"
                      }
                    >
                      {p.kind === "Customer receipt" ? (
                        <ArrowDownLeft size={16} />
                      ) : (
                        <ArrowOut size={16} />
                      )}
                    </span>
                    <div>
                      <strong>{p.kind}</strong>
                      <small>
                        {p.id} · {p.recordId}
                      </small>
                    </div>
                  </div>
                ),
              },
              { key: "date", label: "Date" },
              {
                key: "accountId",
                label: "Account",
                render: (p) =>
                  s.accounts.find((a) => a.id === p.accountId)?.name,
              },
              { key: "reference", label: "Reference" },
              { key: "method", label: "Method" },
              {
                key: "amount",
                label: "Movement",
                numeric: true,
                render: (p) => (
                  <span
                    className={
                      p.kind === "Customer receipt"
                        ? "success-text"
                        : "negative-text"
                    }
                  >
                    {p.kind === "Customer receipt" ? "+" : "−"}
                    {money(p.amount)}
                  </span>
                ),
              },
            ]}
          />
        </Panel>
      )}
      {tab === "Receivables" && (
        <Panel title="Customer balances">
          <Table
            rows={s.invoices.filter(
              (i) =>
                invoiceStatus(s, i) !== "Paid" &&
                !["Draft", "Voided"].includes(i.status),
            )}
            onRow={(i) => go("Invoices & Receipts", i.id)}
            columns={[
              { key: "id", label: "Invoice" },
              {
                key: "customerId",
                label: "Customer",
                render: (i) =>
                  s.customers.find((c) => c.id === i.customerId)?.name,
              },
              { key: "due", label: "Due" },
              {
                key: "balance",
                label: "Outstanding",
                numeric: true,
                render: (i) => money(balance(s, i)),
              },
              {
                key: "status",
                label: "Collection status",
                render: (i) => <Badge>{invoiceStatus(s, i)}</Badge>,
              },
            ]}
          />
        </Panel>
      )}
      {tab === "Period controls" && (
        <Panel title="A clear path to production accounting">
          <div className="padded">
            <Info>
              <LockKeyhole size={17} />
              Double-entry journals, bank reconciliation, reversals and enforced
              period closing require the backend accounting engine.
            </Info>
            <div className="period-controls">
              <div>
                <strong>October 2026</strong>
                <small>Demonstration reporting period</small>
              </div>
              <Badge>{periodsClosed ? "Preview locked" : "Open preview"}</Badge>
            </div>
            <Btn disabled>Close period — backend required</Btn>
            <Btn disabled>Reconcile bank — backend required</Btn>
          </div>
        </Panel>
      )}
      {tx && (
        <Drawer
          title="Transaction trace"
          subtitle={tx.id}
          onClose={() => setTransaction("")}
        >
          <div className="drawer-financial">
            <span>{tx.kind}</span>
            <strong>{money(tx.amount)}</strong>
          </div>
          <Timeline
            items={[
              { title: "Linked source record", detail: tx.recordId },
              {
                title: "Cash account",
                detail: s.accounts.find((a) => a.id === tx.accountId)?.name,
              },
              { title: "Payment method", detail: tx.method },
              { title: "Reference", detail: tx.reference, date: tx.date },
            ]}
          />
          <Info>
            Cash movement is linked to the source invoice, bill or expense. It
            is not a second accrued cost.
          </Info>
          <Btn
            onClick={() => {
              go(
                tx.kind === "Customer receipt"
                  ? "Invoices & Receipts"
                  : tx.kind === "Contractor payment"
                    ? "Contractor Payables"
                    : "Expenses",
                tx.kind === "Customer receipt" ? tx.recordId : "",
              );
              setTransaction("");
            }}
          >
            Open source record
            <ArrowRight size={15} />
          </Btn>
        </Drawer>
      )}
    </>
  );
}
