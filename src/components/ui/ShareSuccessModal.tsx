"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Clipboard, Download, ExternalLink, X } from "lucide-react";
import { openTwitterPopup } from "@/lib/shareImage";

type Mode = "clipboard" | "downloaded";

export function ShareSuccessModal({
  open,
  mode,
  shareText,
  onClose,
}: {
  open: boolean;
  mode: Mode | null;
  shareText: string;
  onClose: () => void;
}) {
  const t = useTranslations("dashboard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mode || !mounted) return null;

  function onOpenX() {
    openTwitterPopup(shareText);
  }

  const title =
    mode === "clipboard"
      ? t("share_modal_clipboard_title")
      : t("share_modal_downloaded_title");
  const body =
    mode === "clipboard"
      ? t("share_modal_clipboard_body")
      : t("share_modal_downloaded_body");
  const Icon = mode === "clipboard" ? Clipboard : Download;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-md w-full rounded-lg border-2 border-primary bg-card p-8 shadow-[0_0_40px_hsl(var(--primary)/0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label={t("share_modal_close")}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full border-2 border-primary bg-primary/10 p-4">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-base text-muted-foreground whitespace-pre-line">
            {body}
          </p>
          {mode === "clipboard" && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2">
              <kbd className="rounded border border-primary/60 bg-background px-2 py-0.5 text-sm font-mono font-bold text-primary">
                Ctrl
              </kbd>
              <span className="text-muted-foreground">+</span>
              <kbd className="rounded border border-primary/60 bg-background px-2 py-0.5 text-sm font-mono font-bold text-primary">
                V
              </kbd>
            </div>
          )}
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              onClick={onOpenX}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />
              {t("share_modal_open_x")}
            </button>
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("share_modal_close")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
