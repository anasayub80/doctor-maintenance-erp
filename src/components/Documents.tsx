import { selectedTerms } from "../terms";
import {
  type Quote,
  type Invoice,
  type Payment,
  type Job,
  quoteTotal,
  invoiceTotal,
  money,
  itemTotal,
  paid,
} from "../domain";
import { useApp } from "../store";
export function DocumentPreview({
  quote,
  invoice,
  receipt,
  workOrder,
}: {
  quote?: Quote;
  invoice?: Invoice;
  receipt?: Payment;
  workOrder?: {
    job: Job;
    contractorId: string;
    scope: string;
    budget: number;
    id: string;
  };
}) {
  const { state: s } = useApp();
  const record = quote || invoice;
  const customer = s.customers.find(
    (c) =>
      c.id ===
      (record?.customerId ||
        s.invoices.find((i) => i.id === receipt?.recordId)?.customerId ||
        workOrder?.job.customerId),
  );
  const job = invoice
    ? s.jobs.find((j) => j.id === invoice.jobId)
    : workOrder?.job;
  const property = customer?.properties.find(
    (p) => p.id === (quote?.propertyId || job?.propertyId),
  );
  const type = quote
    ? "Quotation"
    : invoice
      ? "Invoice"
      : receipt
        ? "Payment receipt"
        : "Work order";
  const items = record?.items || [];
  const total = quote
    ? quoteTotal(quote)
    : invoice
      ? invoiceTotal(invoice)
      : receipt?.amount || workOrder?.budget || 0;
  return (
    <article className="document" id="print-document">
      <header className="doc-brand">
        <div className="doc-wordmark">
          <img src="/assets/mark.svg" alt="" />
          <strong>
            doctor<span>maintenance</span>
          </strong>
        </div>
        <p>{s.settings.tagline}</p>
        <span className="doc-classifier">
          {type === "Work order" ? "INTERNAL • CONTRACTOR COPY" : "CLIENT COPY"}
        </span>
      </header>
      <div className="doc-heading">
        <div>
          <span className="eyebrow">PREPARED WITH CARE</span>
          <h2>{type}</h2>
        </div>
        <div>
          <strong>{record?.id || receipt?.id || workOrder?.id}</strong>
          <span>
            Issued {record?.date || receipt?.date || workOrder?.job.start}
          </span>
          {quote && (
            <span>
              Valid until {quote.validUntil} · Revision {quote.version}
            </span>
          )}
          {invoice && <span>Payment due {invoice.due}</span>}
        </div>
      </div>
      <div className="doc-addresses">
        <div>
          <label>{workOrder ? "ASSIGNED TO" : "PREPARED FOR"}</label>
          <strong>
            {workOrder
              ? s.contractors.find((c) => c.id === workOrder.contractorId)?.name
              : customer?.name}
          </strong>
          {customer?.phone && <p>{customer.phone}</p>}
          {customer?.email && <p>{customer.email}</p>}
          <p>{property?.address || "Property address to be confirmed"}</p>
        </div>
        <div>
          <label>PROJECT</label>
          <strong>
            {quote?.title ||
              job?.title ||
              s.invoices.find((i) => i.id === receipt?.recordId)?.id}
          </strong>
          <p>
            {quote
              ? s.services.find((v) => v.id === quote.serviceId)?.name
              : job?.id || `Against ${receipt?.recordId}`}
          </p>
        </div>
      </div>
      {quote && (
        <div className="doc-scope">
          <label>SCOPE & MATERIALS</label>
          <p>{quote.materials}</p>
        </div>
      )}
      {record && (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty / unit</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, n) => (
              <tr key={i.id}>
                <td>
                  <span className="doc-item-number">
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  {i.description}
                </td>
                <td>
                  {i.quantity} {i.unit}
                </td>
                <td>{money(i.rate)}</td>
                <td>{money(i.quantity * i.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {workOrder && (
        <section className="doc-scope">
          <label>AGREED WORK SCOPE</label>
          <p>{workOrder.scope}</p>
          <p>Expected completion: {workOrder.job.end}</p>
        </section>
      )}
      {receipt && (
        <div className="doc-receipt">
          <label>PAYMENT RECEIVED</label>
          <strong>{money(receipt.amount)}</strong>
          <p>
            {receipt.method} · {receipt.reference || "No reference supplied"}
          </p>
          <p>{receipt.notes}</p>
        </div>
      )}
      <div className="doc-totals">
        {record && (
          <>
            <div>
              <span>Subtotal</span>
              <strong>{money(itemTotal(items))}</strong>
            </div>
            {quote && quote.discount > 0 && (
              <div>
                <span>Discount</span>
                <strong>−{money(quote.discount)}</strong>
              </div>
            )}
            {record.tax > 0 && (
              <div>
                <span>Tax ({record.tax}%)</span>
                <strong>
                  {money(
                    ((quote
                      ? itemTotal(items) - quote.discount
                      : itemTotal(items)) *
                      record.tax) /
                      100,
                  )}
                </strong>
              </div>
            )}
          </>
        )}
        <div className="doc-total">
          <span>
            {receipt
              ? "Amount received"
              : workOrder
                ? "Agreed amount"
                : "Total amount"}
          </span>
          <strong>{money(total)}</strong>
        </div>
        {invoice && (
          <>
            <div>
              <span>Payments received</span>
              <strong>{money(paid(s, invoice.id))}</strong>
            </div>
            <div className="doc-balance">
              <span>Balance due</span>
              <strong>{money(Math.max(0, total - paid(s, invoice.id)))}</strong>
            </div>
          </>
        )}
      </div>
      {quote && (
        <section className="doc-payment">
          <label>PAYMENT MILESTONES</label>
          <div>
            {quote.milestones.map((m, i) => (
              <div key={m.id}>
                <small>
                  0{i + 1} · {m.name}
                </small>
                <strong>{money((total * m.percentage) / 100)}</strong>
                <span>{m.percentage}% of total</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {(quote || invoice) && (
        <section className="doc-terms">
          <label>TERMS & CONDITIONS</label>
          {quote && selectedTerms(quote).length > 0 && (
            <ol className="doc-condition-list">
              {selectedTerms(quote).map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ol>
          )}
          <p>{quote?.terms || invoice?.notes || s.settings.terms}</p>
          {quote?.exclusions && (
            <>
              <label>EXCLUSIONS</label>
              <p>{quote.exclusions}</p>
            </>
          )}
        </section>
      )}
      <footer className="doc-footer">
        <div>
          <strong>{s.settings.name}</strong>
          <span>
            {[s.settings.address, s.settings.phone, s.settings.email]
              .filter(Boolean)
              .join(" · ") || "Company contact information to be configured"}
          </span>
        </div>
        <span>DEMONSTRATION DOCUMENT</span>
      </footer>
    </article>
  );
}
