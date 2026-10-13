import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import React, { Component, lazy, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useApp } from "./store";
import Shell from "./components/Shell";
import CreateHost from "./components/CreateHost";
import "./styles.css";
const Dashboard = lazy(() => import("./modules/Dashboard"));
const Leads = lazy(() =>
  import("./modules/Relationships").then((m) => ({ default: m.Leads })),
);
const Customers = lazy(() =>
  import("./modules/Relationships").then((m) => ({ default: m.Customers })),
);
const Quotations = lazy(() =>
  import("./modules/Studios").then((m) => ({ default: m.Quotations })),
);
const Invoices = lazy(() =>
  import("./modules/Studios").then((m) => ({ default: m.Invoices })),
);
const Jobs = lazy(() =>
  import("./modules/Operations").then((m) => ({ default: m.Jobs })),
);
const Contractors = lazy(() =>
  import("./modules/Operations").then((m) => ({ default: m.Contractors })),
);
const Services = lazy(() =>
  import("./modules/Operations").then((m) => ({ default: m.Services })),
);
const Expenses = lazy(() =>
  import("./modules/Finance").then((m) => ({ default: m.Expenses })),
);
const Payables = lazy(() =>
  import("./modules/Finance").then((m) => ({ default: m.Payables })),
);
const Finance = lazy(() =>
  import("./modules/Finance").then((m) => ({ default: m.Finance })),
);
const Marketing = lazy(() =>
  import("./modules/Intelligence").then((m) => ({ default: m.Marketing })),
);
const Reports = lazy(() =>
  import("./modules/Intelligence").then((m) => ({ default: m.Reports })),
);
const Team = lazy(() =>
  import("./modules/Administration").then((m) => ({ default: m.Team })),
);
const Settings = lazy(() =>
  import("./modules/Administration").then((m) => ({ default: m.Settings })),
);
const Templates = lazy(() =>
  import("./modules/Administration").then((m) => ({ default: m.Templates })),
);
const Audit = lazy(() =>
  import("./modules/Administration").then((m) => ({ default: m.Audit })),
);
function Skeleton() {
  return (
    <div className="skeleton-page" role="status" aria-label="Loading workspace">
      <div className="skeleton heading" />
      <div className="skeleton subtitle" />
      <div className="skeleton-metrics">
        {[0, 1, 2, 3].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
      <div className="skeleton-columns">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="error-page">
        <h1>This preview needs a refresh.</h1>
        <p>
          Your local demonstration data is preserved. Reload to recover the
          workspace.
        </p>
        <button className="btn primary" onClick={() => location.reload()}>
          Reload workspace
        </button>
        <button
          className="btn"
          onClick={() => {
            localStorage.removeItem("dm-erp-v1");
            location.reload();
          }}
        >
          Restore demo data
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const { page } = useApp();
  const modules: Record<string, ReactNode> = {
    Dashboard: <Dashboard />,
    Leads: <Leads />,
    Customers: <Customers />,
    Quotations: <Quotations />,
    "Jobs & Projects": <Jobs />,
    Contractors: <Contractors />,
    "Services & Rates": <Services />,
    "Invoices & Receipts": <Invoices />,
    Expenses: <Expenses />,
    "Contractor Payables": <Payables />,
    "Cash & Accounts": <Finance />,
    Marketing: <Marketing />,
    "Reports & Analytics": <Reports />,
    "Team & Permissions": <Team />,
    "Document Templates": <Templates />,
    Settings: <Settings />,
    "Audit History": <Audit />,
  };
  return (
    <Shell>
      <div key={page} className="page-enter">
        <Suspense fallback={<Skeleton />}>
          {modules[page] || <Dashboard />}
        </Suspense>
      </div>
      <CreateHost />
    </Shell>
  );
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Provider>
      <App />
    </Provider>
  </ErrorBoundary>,
);
