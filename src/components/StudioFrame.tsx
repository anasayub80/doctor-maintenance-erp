import { editorViewportHeight } from "../layout";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
export function StudioFrame({
  title,
  footer,
  children,
}: {
  title: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        if (window.innerWidth <= 1050 || window.innerHeight < 500) {
          setHeight(undefined);
          return;
        }
        const header =
          document.querySelector(".topbar")?.getBoundingClientRect().height ||
          70;
        const chrome = Array.from(
          el.querySelectorAll(
            ":scope > .studio-top, :scope > .tabs, :scope > .studio-editor-footer",
          ),
        ).reduce((sum, child) => sum + child.getBoundingClientRect().height, 0);
        setHeight(
          editorViewportHeight(
            window.innerWidth,
            window.innerHeight,
            el.getBoundingClientRect().top,
            header,
            chrome,
          ),
        );
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    const heading = document.querySelector(".detail-heading");
    if (heading) observer?.observe(heading);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, []);
  return (
    <section
      ref={ref}
      className="studio-editor"
      aria-label={title}
      style={
        height
          ? ({ "--editor-height": `${height}px` } as CSSProperties)
          : undefined
      }
    >
      {children}
      <div className="studio-editor-footer">{footer}</div>
    </section>
  );
}
export function StudioScroll({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [label]);
  return (
    <div
      ref={ref}
      className="studio-scroll"
      role="region"
      tabIndex={0}
      aria-label={label}
    >
      {children}
    </div>
  );
}
