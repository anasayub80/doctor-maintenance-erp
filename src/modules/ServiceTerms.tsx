import { useEffect, useState } from "react";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  FileText,
  ShieldCheck,
  ArrowRight,
  Settings2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { useApp } from "../store";
import { uid } from "../domain";
import { serviceTerms, type ServiceTerm } from "../terms";
import { Btn, Info, Empty } from "../components/ui";
export default function ServiceTermsWorkspace({
  serviceId,
  onSelect,
}: {
  serviceId: string;
  onSelect: (id: string) => void;
}) {
  const { state: s, save, confirm, toast, openCreate } = useApp();
  const service = s.services.find((v) => v.id === serviceId) || s.services[0];
  const [draft, setDraft] = useState<ServiceTerm[]>(() =>
      structuredClone(serviceTerms(service)),
    ),
    [editing, setEditing] = useState("");
  useEffect(() => {
    setDraft(structuredClone(serviceTerms(service)));
    setEditing("");
  }, [service.id, service.termsVersion]);
  const owner = s.role === "Owner",
    dirty = JSON.stringify(draft) !== JSON.stringify(serviceTerms(service));
  const patch = (id: string, changes: Partial<ServiceTerm>) =>
    setDraft(draft.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  const reorder = (index: number, direction: number) => {
    const next = [...draft];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    setDraft(next);
  };
  const commit = () => {
    if (draft.some((t) => !t.text.trim())) {
      toast("Write a condition or remove the empty row before saving.");
      return;
    }
    save(
      "services",
      {
        ...service,
        quotationTerms: draft.map((t) => ({ ...t, text: t.text.trim() })),
        termsVersion: (service.termsVersion || 1) + 1,
      },
      `Quotation terms updated for ${service.name}`,
    );
  };
  return (
    <div className="terms-workspace">
      <label className="terms-mobile-select">
        <span>SERVICE CATEGORY</span>
        <select
          value={service.id}
          aria-label="Service terms category"
          onChange={(e) => {
            if (dirty)
              confirm(
                "Discard unsaved terms?",
                "Unsaved edits will be discarded.",
                () => onSelect(e.target.value),
              );
            else onSelect(e.target.value);
          }}
        >
          {s.services.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
      <aside className="terms-service-nav">
        <div className="terms-nav-title">
          <span className="eyebrow">SELECT A SERVICE</span>
          <small>{s.services.length} categories</small>
        </div>
        {s.services.map((v) => (
          <button
            className={v.id === service.id ? "selected" : ""}
            key={v.id}
            onClick={() => {
              if (dirty) {
                confirm(
                  "Discard unsaved terms?",
                  "Your saved service defaults will remain unchanged.",
                  () => onSelect(v.id),
                );
              } else onSelect(v.id);
            }}
          >
            <span>{v.name}</span>
            <small>{serviceTerms(v).filter((t) => t.enabled).length}</small>
          </button>
        ))}
      </aside>
      <section className="terms-editor">
        <header>
          <div>
            <div className="eyebrow">QUOTATION CONDITIONS</div>
            <h2>{service.name}</h2>
            <p>Define clear expectations before the work begins.</p>
          </div>
          <span className="library-version">
            <ShieldCheck size={14} />
            Library v{service.termsVersion || 1}
          </span>
        </header>
        <div className="terms-policy">
          <CheckCircle2 size={19} />
          <div>
            <strong>Set it once. Carry it forward.</strong>
            <p>
              Enabled conditions appear in new quotations. Auto-include selects
              a condition by default; staff can adjust the selection per
              quotation.
            </p>
          </div>
        </div>
        {!owner && (
          <Info>
            This role can read the terms library. Owner access is required to
            change company conditions.
          </Info>
        )}
        <fieldset disabled={!owner} className="terms-clause-list">
          {draft.map((term, index) => (
            <article
              className={`terms-clause ${!term.enabled ? "disabled-term" : ""}`}
              key={term.id}
            >
              <div className="clause-top">
                <span className="clause-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="clause-label">SERVICE CONDITION</span>
                <div className="clause-move">
                  <button
                    aria-label="Move condition up"
                    disabled={index === 0}
                    onClick={() => reorder(index, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    aria-label="Move condition down"
                    disabled={index === draft.length - 1}
                    onClick={() => reorder(index, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
              {editing === term.id ? (
                <textarea
                  autoFocus
                  rows={3}
                  value={term.text}
                  aria-label={`Condition ${index + 1}`}
                  placeholder="Describe the condition in clear customer-friendly language…"
                  onChange={(e) => patch(term.id, { text: e.target.value })}
                />
              ) : (
                <p className="clause-text">
                  {term.text || "New condition — add your wording"}
                </p>
              )}
              <footer>
                <label className="mini-switch">
                  <input
                    type="checkbox"
                    checked={term.enabled}
                    onChange={(e) =>
                      patch(term.id, { enabled: e.target.checked })
                    }
                  />
                  <span />
                  <small>{term.enabled ? "Enabled" : "Disabled"}</small>
                </label>
                <label className="auto-include">
                  <input
                    type="checkbox"
                    checked={term.defaultSelected}
                    disabled={!term.enabled}
                    onChange={(e) =>
                      patch(term.id, { defaultSelected: e.target.checked })
                    }
                  />
                  <Check size={12} />
                  <span>Auto-include</span>
                </label>
                <div className="clause-actions">
                  <button
                    className="text-btn"
                    onClick={() =>
                      setEditing(editing === term.id ? "" : term.id)
                    }
                  >
                    {editing === term.id ? "Done editing" : "Edit wording"}
                  </button>
                  <button
                    className="icon-btn"
                    aria-label="Remove condition"
                    onClick={() =>
                      confirm(
                        "Remove this condition?",
                        "It will be removed from future quotations after saving. Existing quotations keep their wording.",
                        () => setDraft(draft.filter((t) => t.id !== term.id)),
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </footer>
            </article>
          ))}
          {!draft.length && (
            <Empty
              title="Set expectations for this service"
              message="Add reusable conditions, exclusions or service-specific commitments."
            />
          )}
          <button
            className="add-clause"
            onClick={() => {
              const id = uid("TERM");
              setDraft([
                ...draft,
                { id, text: "", enabled: true, defaultSelected: true },
              ]);
              setEditing(id);
            }}
          >
            <Plus size={17} />
            <span>Add a service condition</span>
            <small>Your wording, your standards.</small>
          </button>
        </fieldset>
        <div className="terms-savebar">
          <div>
            <span className={dirty ? "unsaved-dot" : "saved-dot"} />
            <strong>
              {dirty ? "Unsaved changes" : "Service defaults saved"}
            </strong>
            <small>Existing issued quotations stay unchanged.</small>
          </div>
          <Btn primary disabled={!owner || !dirty} onClick={commit}>
            <Check size={16} />
            Save service terms
          </Btn>
        </div>
      </section>
      <aside className="terms-context">
        <div className="terms-context-card">
          <div className="terms-context-icon">
            <FileText size={24} />
          </div>
          <span className="eyebrow">CLIENT DOCUMENT</span>
          <h3>A clear scope deserves clear conditions.</h3>
          <p>
            {draft.filter((t) => t.enabled && t.defaultSelected).length}{" "}
            conditions selected automatically for a new{" "}
            {service.name.toLowerCase()} quotation.
          </p>
          <div className="terms-preview-list">
            {draft
              .filter((t) => t.enabled && t.defaultSelected)
              .slice(0, 3)
              .map((t, i) => (
                <div key={t.id}>
                  <span>{i + 1}</span>
                  <p>{t.text}</p>
                </div>
              ))}
          </div>
          <Btn
            onClick={() => {
              if (dirty) {
                toast("Save service terms before creating a quotation.");
                return;
              }
              openCreate("quotation", { serviceId: service.id });
            }}
          >
            Try a new quotation
            <ArrowRight size={14} />
          </Btn>
        </div>
        <div className="terms-snapshot-note">
          <ShieldCheck size={17} />
          <p>
            <strong>Each quotation keeps a snapshot.</strong> Updating this
            library affects future quotations. Drafts can explicitly apply the
            latest defaults in Payments & terms.
          </p>
        </div>
      </aside>
    </div>
  );
}
