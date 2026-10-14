import ServiceTermsWorkspace from "../src/modules/ServiceTerms";
import { snapshotTerms } from "../src/terms";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import assert from "node:assert/strict";
import { Provider } from "../src/store";
import { initialState } from "../src/seed";
import { DocumentPreview } from "../src/components/Documents";
import Dashboard from "../src/modules/Dashboard";
import { Leads, Customers } from "../src/modules/Relationships";
import { Quotations, Invoices } from "../src/modules/Studios";
import { Jobs, Contractors, Services } from "../src/modules/Operations";
import { Expenses, Payables, Finance } from "../src/modules/Finance";
import { Marketing, Reports } from "../src/modules/Intelligence";
import {
  Team,
  Settings,
  Templates,
  Audit,
} from "../src/modules/Administration";
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {} };
(globalThis as any).location = { hash: "#Dashboard" };
let views = 0;
for (const [route, Component] of [
  ["Dashboard", Dashboard],
  ["Leads", Leads],
  ["Leads/L9", Leads],
  ["Customers", Customers],
  ["Customers/C1", Customers],
  ["Quotations", Quotations],
  ["Quotations/QT-1041", Quotations],
  ["Quotations/QT-1050", Quotations],
  ["Invoices & Receipts", Invoices],
  ["Invoices & Receipts/INV-301", Invoices],
  ["Jobs & Projects", Jobs],
  ["Jobs & Projects/JB-201", Jobs],
  ["Contractors", Contractors],
  ["Contractors/CT1", Contractors],
  ["Services & Rates", Services],
  ["Expenses", Expenses],
  ["Contractor Payables", Payables],
  ["Cash & Accounts", Finance],
  ["Marketing", Marketing],
  ["Marketing/CP1", Marketing],
  ["Reports & Analytics", Reports],
  ["Team & Permissions", Team],
  ["Document Templates", Templates],
  ["Settings", Settings],
  ["Audit History", Audit],
] as const) {
  (globalThis as any).location.hash = "#" + encodeURIComponent(route);
  const html = renderToStaticMarkup(
    <Provider>
      <Component />
    </Provider>,
  );
  assert(html.length > 400, `Empty view: ${route}`);
  assert(!html.includes("NaN"), `Invalid numeric data in ${route}`);
  views++;
}
const client = renderToStaticMarkup(
  <Provider>
    <DocumentPreview quote={initialState.quotes[0]} />
  </Provider>,
);
assert(client.includes("Saad Sheikh"));
assert(client.includes("Lasani ZRK"));
assert(!client.includes("240,000"));
assert(!client.includes("internalCost"));
assert(!client.includes("gross profit"));
assert(!client.includes("Expected margin"));
console.log(
  `${views} screen and detail renders passed; client document excludes internal costing.`,
);

const library = renderToStaticMarkup(
  <Provider>
    <ServiceTermsWorkspace serviceId="S7" onSelect={() => {}} />
  </Provider>,
);
assert(library.includes("Save service terms"));
assert(library.includes("Auto-include"));
const termsQuote = {
  ...initialState.quotes[0],
  ...snapshotTerms(initialState.services[6]),
};
termsQuote.serviceTerms![0].selected = false;
const termsDocument = renderToStaticMarkup(
  <Provider>
    <DocumentPreview quote={termsQuote} />
  </Provider>,
);
assert(termsDocument.includes("cabinet layout"));
assert(!termsDocument.includes(termsQuote.serviceTerms![0].text));
console.log(
  "Service terms workspace and selected client-document conditions passed.",
);
