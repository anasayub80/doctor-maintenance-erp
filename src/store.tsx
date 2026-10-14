import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initialState } from "./seed";
import { migrateDemoState } from "./terms";
import {
  type State,
  type Page,
  type Quote,
  type Payment,
  type Job,
  uid,
  quoteTotal,
  invoiceTotal,
  paid,
  permissions,
  today,
} from "./domain";
export { saveRecord, convertQuote, recordPayment } from "./workflows";
import { saveRecord, type Collection } from "./workflows";
interface AppContext {
  state: State;
  page: Page;
  recordId: string;
  go: (p: Page, id?: string) => void;
  save: (c: Collection, r: any, msg?: string) => void;
  mutate: (fn: (s: State) => State, msg: string) => boolean;
  toast: (s: string) => void;
  confirm: (title: string, message: string, fn: () => void) => void;
  setRole: (r: State["role"]) => void;
  reset: () => void;
  month: string;
  setMonth: (s: string) => void;
  serviceFilter: string;
  setServiceFilter: (s: string) => void;
  openCreate: (kind: string, context?: any) => void;
  setCreateHandler: (fn: (kind: string, context?: any) => void) => void;
}
const Ctx = createContext<AppContext>(null!);
export const useApp = () => useContext(Ctx);
export function Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => {
    try {
      const raw = localStorage.getItem("dm-erp-v1");
      return migrateDemoState(
        raw ? JSON.parse(raw) : structuredClone(initialState),
      );
    } catch {
      return migrateDemoState(structuredClone(initialState));
    }
  });
  const parse = () => {
    const [p, id] = (
      decodeURIComponent(location.hash.slice(1)) || "Dashboard"
    ).split("/");
    return { p: p as Page, id: id || "" };
  };
  const [route, setRoute] = useState(parse);
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    fn: () => void;
  } | null>(null);
  const [month, setMonth] = useState("2026-10"),
    [serviceFilter, setServiceFilter] = useState("all");
  const [createHandler, setHandler] = useState<
    (kind: string, context?: any) => void
  >(() => () => {});
  useEffect(() => {
    try {
      localStorage.setItem("dm-erp-v1", JSON.stringify(state));
    } catch {}
  }, [state]);
  useEffect(() => {
    const cb = () => setRoute(parse());
    window.addEventListener("hashchange", cb);
    return () => window.removeEventListener("hashchange", cb);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  const go = (p: Page, id = "") => {
    location.hash = encodeURIComponent(p) + (id ? "/" + id : "");
    setRoute({ p, id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const mutate = (fn: (s: State) => State, msg: string) => {
    try {
      const next = fn(state);
      next.audit = [
        {
          id: uid("AU"),
          message: msg,
          date: new Date().toISOString(),
          role: state.role,
        },
        ...next.audit,
      ];
      setState(next);
      setNotice(msg);
      return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Action failed. Try again.");
      return false;
    }
  };
  const save = (c: Collection, r: any, msg = "Record saved") => {
    mutate((s) => saveRecord(s, c, r), msg);
  };
  return (
    <Ctx.Provider
      value={{
        state,
        page: route.p,
        recordId: route.id,
        go,
        save,
        mutate,
        toast: setNotice,
        confirm: (title, message, fn) =>
          setConfirmation({ title, message, fn }),
        setRole: (role) => {
          setState({ ...state, role });
          if (!permissions[role].includes(route.p)) go("Dashboard");
          setNotice(`Previewing ${role} permissions`);
        },
        reset: () => {
          setState(migrateDemoState(structuredClone(initialState)));
          go("Dashboard");
          setNotice("Demonstration workspace restored");
        },
        month,
        setMonth,
        serviceFilter,
        setServiceFilter,
        openCreate: createHandler,
        setCreateHandler: (fn) => setHandler(() => fn),
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          <span className="toast-dot" />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
      {confirmation && (
        <div className="overlay" onClick={() => setConfirmation(null)}>
          <section
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eyebrow">PLEASE CONFIRM</div>
            <h2 id="confirm-title">{confirmation.title}</h2>
            <p>{confirmation.message}</p>
            <div className="actions">
              <button
                autoFocus
                className="btn"
                onClick={() => setConfirmation(null)}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  const fn = confirmation.fn;
                  setConfirmation(null);
                  fn();
                }}
              >
                Confirm
              </button>
            </div>
          </section>
        </div>
      )}
    </Ctx.Provider>
  );
}
