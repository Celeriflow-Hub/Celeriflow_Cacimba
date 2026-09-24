"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type InteractionEvent = "PAGE_VIEW" | "UI_INTERACTION" | "FORM_SUBMIT";
type TargetType = "PAGE" | "CONTROL" | "FORM";

function sendUsageEvent(eventType: InteractionEvent, targetType: TargetType, targetId: string) {
  void fetch("/api/audit/interaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, targetType, targetId }),
    keepalive: true,
  });
}

export default function UsageAuditTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) sendUsageEvent("PAGE_VIEW", "PAGE", pathname);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const source = event.target;
      if (!(source instanceof Element)) return;

      const control = source.closest("a, button, [role='button'], summary");
      if (!control || control.hasAttribute("data-audit-ignore")) return;

      // Form submission is recorded separately to avoid duplicate records for submit buttons.
      if (control instanceof HTMLButtonElement && control.type === "submit" && control.form) return;

      const controlType = control instanceof HTMLAnchorElement
        ? "link"
        : control.tagName.toLowerCase();
      sendUsageEvent("UI_INTERACTION", "CONTROL", `${pathname}|${controlType}`);
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.hasAttribute("data-audit-ignore")) return;
      sendUsageEvent("FORM_SUBMIT", "FORM", pathname);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [pathname]);

  return null;
}
