import { useEffect, useRef, useState } from "react";
export function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const from = previous.current;
    const start = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min((time - start) / 650, 1);
      setDisplay(from + (value - from) * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    previous.current = value;
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return display;
}
export function useScrollReveal() {
  useEffect(() => {
    if (
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.06 },
    );
    const nodes = document.querySelectorAll(
      ".panel,.service-card,.account-card,.lead-card,.terms-clause",
    );
    nodes.forEach((node, index) => {
      node.classList.add("reveal-ready");
      (node as HTMLElement).style.setProperty(
        "--reveal-delay",
        `${Math.min((index % 4) * 45, 135)}ms`,
      );
      observer.observe(node);
    });
    return () => {
      observer.disconnect();
      nodes.forEach((node) => node.classList.remove("reveal-ready"));
    };
  }, []);
}
