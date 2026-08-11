"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Modal shell with a three-part layout: a header and footer that stay put and
 * a body that scrolls between them.
 *
 * The previous dialogs made the whole panel one scrolling box, so on a short
 * viewport the first field scrolled out of reach behind the header — and a
 * validation error on it was invisible. Here the panel is a flex column with a
 * fixed max height; only the middle section moves, so the title field and the
 * action buttons are always on screen.
 *
 * Uses dvh so mobile browser chrome does not eat the footer.
 */
export function Dialog({
  open,
  title,
  onClose,
  onSubmit,
  footer,
  children,
  busy = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  busy?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);

    // Stop the page behind the dialog scrolling with it.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const body = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 text-sm">{children}</div>
      {footer && (
        <div
          className="shrink-0 border-t px-5 py-3 flex items-center justify-end gap-2"
          style={{ borderColor: "var(--border-primary)" }}
        >
          {footer}
        </div>
      )}
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "var(--bg-modal-overlay)" }}
      onClick={() => !busy && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg flex flex-col rounded-t-2xl sm:rounded-xl border animate-fade-in max-h-[92dvh] sm:max-h-[88dvh]"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-primary)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="shrink-0 flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
            className="p-2 -mr-2 rounded-lg disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
    </div>
  );
}
