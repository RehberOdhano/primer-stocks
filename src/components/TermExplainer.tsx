"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const POPOVER_WIDTH = 256; // px, matches w-64 below
const VIEWPORT_MARGIN = 8;

/**
 * Tap-to-reveal inline explainer — the mechanism behind both education
 * triggers in the spec: tapping an unfamiliar term, and flagging a
 * significant price move. Deliberately not a tooltip-on-hover, since taps
 * are what work on mobile.
 *
 * Renders the popover through a portal at a viewport-fixed position rather
 * than `position: absolute` in place. Every usage sits inside an
 * `overflow-x-auto` table wrapper, and some (comparison view row labels)
 * are in a narrow left-edge column — an in-place absolute popover gets
 * clipped by the ancestor's scroll clipping. Fixed + portal escapes that
 * entirely and lets us clamp to the viewport instead.
 */
export function TermExplainer({
  trigger,
  triggerClassName = "",
  title,
  explainer,
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  title: string;
  explainer: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(
          rect.right - POPOVER_WIDTH,
          window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN,
        ),
      );
      setPosition({ top: rect.bottom + 8, left });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={title}
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
            className="fixed z-50 rounded-lg border border-zinc-200 bg-white p-3 text-left text-sm font-normal text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <p className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">{title}</p>
            <p>{explainer}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
