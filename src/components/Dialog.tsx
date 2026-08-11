"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * The single modal shell for the app.
 *
 * Three regions: a sticky header, a body that is the only scrolling part, and
 * a sticky footer for the actions. The panel is capped at 85dvh and centred
 * with flex — not a negative-margin transform, which is what pushed the top of
 * a tall dialog above the viewport where the title and close button could not
 * be reached.
 *
 * dvh rather than vh: mobile browser chrome changes the viewport height, and
 * vh keeps measuring the tallest state, so the footer ends up under the
 * address bar.
 *
 * Under 640px it renders as a full-screen sheet with safe-area padding so the
 * action row clears the home indicator.
 *
 * Layering comes from the scale in globals.css; nothing here hardcodes a z.
 */
export function Dialog({
  open,
  title,
  description,
  onClose,
  onSubmit,
  footer,
  children,
  busy = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  busy?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);

    // Lock the page behind the dialog without losing the reading position:
    // position:fixed would jump to the top, so only overflow is touched.
    // Both elements are set because which one scrolls varies by browser.
    const scrollY = window.scrollY;
    const prevBody = document.body.style.overflow;
    const prevRoot = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Focus the first control so keyboard users land inside the dialog.
    const firstField = panelRef.current?.querySelector<HTMLElement>(
      "input:not([type=hidden]), select, textarea, button"
    );
    firstField?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevRoot;
      window.scrollTo({ top: scrollY });
      restoreFocusTo.current?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open || !mounted) return null;

  const body = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 text-sm">{children}</div>
      {footer && (
        <div
          className="shrink-0 border-t px-5 py-3 flex items-center justify-end gap-2"
          style={{
            borderColor: "var(--border-primary)",
            background: "var(--bg-card)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          {footer}
        </div>
      )}
    </>
  );

  /*
   * Rendered into document.body rather than in place.
   *
   * Page wrappers use animate-fade-in, and its forwards fill-mode leaves a
   * transform on the element for good. A transformed ancestor becomes the
   * containing block for position:fixed, so `inset-0` resolved to the page
   * content box instead of the viewport and the dialog was centred against
   * the wrong rectangle — measured 122px above the top of the screen with the
   * header unreachable. A portal escapes every such ancestor.
   */
  return createPortal(
    <div
      className="fixed inset-0 flex items-stretch sm:items-center justify-center sm:p-4"
      style={{ zIndex: "var(--z-backdrop)" as any, background: "var(--bg-modal-overlay)" }}
      onClick={() => !busy && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={
          // Full-screen sheet on phones, centred capped panel from sm up.
          "relative w-full flex flex-col border animate-fade-in " +
          "h-[100dvh] rounded-none " +
          "sm:h-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-xl"
        }
        style={{
          zIndex: "var(--z-dialog)" as any,
          background: "var(--bg-card)",
          borderColor: "var(--border-primary)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b"
          style={{ borderColor: "var(--border-primary)", background: "var(--bg-card)" }}
        >
          <div className="min-w-0">
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            {description && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
            className="shrink-0 -mr-2 -mt-1 rounded-lg disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {onSubmit ? (
          <form onSubmit={onSubmit} noValidate className="flex flex-col min-h-0 flex-1">
            {body}
          </form>
        ) : (
          body
        )}
      </div>
    </div>,
    document.body
  );
}
