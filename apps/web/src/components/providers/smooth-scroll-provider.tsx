"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const windowLenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // ─── Window-level Lenis (for full-window pages like login/landing) ─────────
    const windowLenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      autoRaf: false,
      naiveDimensions: true,
      allowNestedScroll: true,
    });
    windowLenisRef.current = windowLenis;
    (window as any).__lenis = windowLenis;

    // ─── Inner scroll-container instances ────────────────────────────────────
    type InnerEntry = {
      lenis: Lenis;
      childObserver: MutationObserver;
      resizeObserver: ResizeObserver;
      wheelHandler: () => void;
    };

    const innerInstances = new Map<HTMLElement, InnerEntry>();

    const destroyInner = (container: HTMLElement) => {
      const entry = innerInstances.get(container);
      if (!entry) return;
      entry.lenis.destroy();
      entry.childObserver.disconnect();
      entry.resizeObserver.disconnect();
      container.removeEventListener("wheel", entry.wheelHandler);
      innerInstances.delete(container);
    };

    const createInner = (container: HTMLElement) => {
      destroyInner(container);

      // naiveDimensions: true dynamically queries rootElement.scrollHeight - clientHeight
      // on every scroll/wheel action, guaranteeing Lenis never clamps to an outdated height.
      const innerLenis = new Lenis({
        wrapper: container,
        content: container,
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        autoRaf: false,
        naiveDimensions: true,
        allowNestedScroll: true,
      });

      let resizeRaf: number | null = null;
      const scheduleResize = () => {
        if (resizeRaf !== null) return;
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = null;
          innerLenis.resize();
        });
      };

      // ResizeObserver: observe container AND its children so whenever table rows,
      // cards, or dynamic lists expand (e.g. page limit changed from 15 to 50),
      // the resize event fires immediately and updates Lenis dimensions.
      const resizeObserver = new ResizeObserver(() => {
        scheduleResize();
      });

      resizeObserver.observe(container);
      Array.from(container.children).forEach((child) => {
        resizeObserver.observe(child);
      });

      // MutationObserver: observe subtree child additions/removals to catch
      // dynamic table data rendering and new child container mounts.
      const childObserver = new MutationObserver(() => {
        Array.from(container.children).forEach((child) => {
          resizeObserver.observe(child);
        });
        scheduleResize();
      });
      childObserver.observe(container, { childList: true, subtree: true });

      // Live verification on wheel: if scrollHeight changed before next observer tick
      const wheelHandler = () => {
        if (container.scrollHeight !== (innerLenis as any).dimensions?.scrollHeight) {
          innerLenis.resize();
        }
      };
      container.addEventListener("wheel", wheelHandler, { passive: true });

      innerInstances.set(container, { lenis: innerLenis, childObserver, resizeObserver, wheelHandler });
    };

    const attachInner = () => {
      document
        .querySelectorAll<HTMLElement>("[data-lenis-scroll-container]")
        .forEach((el) => {
          if (!innerInstances.has(el)) createInner(el);
        });
    };

    attachInner();

    // Auto-attach when new scroll containers are mounted dynamically
    const bodyObserver = new MutationObserver(attachInner);
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // ─── RAF loop ─────────────────────────────────────────────────────────────
    let rafId: number;
    const raf = (time: number) => {
      windowLenis.raf(time);
      innerInstances.forEach(({ lenis }) => lenis.raf(time));
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      bodyObserver.disconnect();
      innerInstances.forEach(({ lenis, childObserver, resizeObserver, wheelHandler }, container) => {
        lenis.destroy();
        childObserver.disconnect();
        resizeObserver.disconnect();
        container.removeEventListener("wheel", wheelHandler);
      });
      innerInstances.clear();
      windowLenis.destroy();
      windowLenisRef.current = null;
      delete (window as any).__lenis;
    };
  }, []);

  return <>{children}</>;
}
