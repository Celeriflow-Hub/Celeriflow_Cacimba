"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { EducationActionResult } from "./s1-actions";

export type FormField = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "select" | "textarea" | "checkbox" | "hidden";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[];
};

export function S1ActionForm({ title, description, submitLabel, fields, action }: { title: string; description?: string; submitLabel: string; fields: FormField[]; action: (data: FormData) => Promise<EducationActionResult> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<EducationActionResult | null>(null);

  return <details className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
    <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300">{title}</summary>
    <form ref={formRef} className="grid gap-2 border-t border-slate-100 p-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(event) => {
      event.preventDefault();
      setResult(null);
      const data = new FormData(event.currentTarget);
      startTransition(async () => {
        const response = await action(data);
        setResult(response);
        if (!response.error) { formRef.current?.reset(); router.refresh(); }
      });
    }}>
      {description && <p className="text-xs text-slate-500 sm:col-span-2 lg:col-span-3">{description}</p>}
      {fields.map((field) => field.type === "hidden" ? <input key={field.name} type="hidden" name={field.name} value={field.defaultValue || ""} /> : <label key={field.name} className={field.type === "textarea" ? "space-y-1 sm:col-span-2 lg:col-span-3" : field.type === "checkbox" ? "flex items-center gap-2 pt-5 text-xs" : "space-y-1"}>
        {field.type !== "checkbox" && <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">{field.label}{field.required ? " *" : ""}</span>}
        {field.type === "select" ? <select name={field.name} required={field.required} defaultValue={field.defaultValue || ""} className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">Selecione...</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          : field.type === "textarea" ? <textarea name={field.name} required={field.required} placeholder={field.placeholder} className="min-h-24 w-full rounded border border-slate-200 p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950" />
          : field.type === "checkbox" ? <><input type="checkbox" name={field.name} className="size-4" /><span>{field.label}</span></>
          : <input name={field.name} type={field.type || "text"} required={field.required} placeholder={field.placeholder} defaultValue={field.defaultValue} className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950" />}
      </label>)}
      {result && <p className={`text-xs sm:col-span-2 lg:col-span-3 ${result.error ? "text-red-700" : "text-emerald-700"}`} role="status">{result.error || result.message}</p>}
      <div className="flex justify-end sm:col-span-2 lg:col-span-3"><button disabled={pending} className="inline-flex h-8 items-center gap-1.5 rounded bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-60">{pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}{submitLabel}</button></div>
    </form>
  </details>;
}
