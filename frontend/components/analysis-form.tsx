"use client";

import { FormEvent, useRef, useState } from "react";
import { createAnalysis, ApiClientError } from "@/lib/api";
import type { AnalysisRequest, AnalysisResponse } from "@/lib/contracts";
import { AnalysisResult } from "./analysis-result";

type FormErrors = Partial<Record<"creator_name" | "content" | "target_audience" | "brand_tone", string>>;
const initial: AnalysisRequest = {
  creator_name: "Narrative Co.",
  content_url: "",
  manual_content: "",
  platform: "instagram",
  content_medium: "carousel",
  target_audience: "Instagram nano-business audience",
  goal: "increase_saves",
  primary_metric: "saves",
  brand_tone: ["practical"],
};

export function AnalysisForm() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "completed" | "error">("idle");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [message, setMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  function update<K extends keyof AnalysisRequest>(key: K, value: AnalysisRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function pasteLink() {
    try {
      const clipboardText = (await navigator.clipboard.readText()).trim();
      if (!clipboardText) {
        setStatus("error");
        setMessage("The clipboard is empty. Copy an Instagram URL and try again.");
        return;
      }
      update("content_url", clipboardText);
      setErrors((current) => ({ ...current, content: undefined }));
      setStatus("idle");
      setMessage("Link pasted from the clipboard.");
    } catch {
      setStatus("error");
      setMessage("Clipboard access was blocked. Paste the Instagram URL into the field manually.");
    }
  }

  function resetForm() {
    abortRef.current?.abort();
    setForm(initial);
    setErrors({});
    setStatus("idle");
    setResult(null);
    setMessage("Form cleared.");
  }

  function validate() {
    const next: FormErrors = {};
    if (!form.creator_name.trim()) next.creator_name = "Enter the creator or workspace name.";
    if (!form.content_url?.trim() && !form.manual_content?.trim()) next.content = "Provide a public URL or paste the content.";
    if (form.content_url && !/^https?:\/\//i.test(form.content_url)) next.content = "Enter a complete public URL beginning with http:// or https://.";
    if (form.target_audience.trim().length < 3) next.target_audience = "Describe the target audience.";
    if (!form.brand_tone.length) next.brand_tone = "Select at least one brand tone.";
    setErrors(next);
    return !Object.keys(next).length;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) {
      setStatus("error");
      setMessage("Check the highlighted fields and try again.");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("submitting");
    setMessage("Analyzing the submitted brief…");
    setResult(null);
    try {
      const response = await createAnalysis({
        ...form,
        creator_name: form.creator_name.trim(),
        content_url: form.content_url?.trim() || null,
        manual_content: form.manual_content?.trim() || null,
        target_audience: form.target_audience.trim(),
      }, controller.signal);
      setResult(response);
      setStatus("completed");
      setMessage("Analysis completed.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        setMessage("Analysis cancelled. Your entries are still available.");
      } else {
        setStatus("error");
        setMessage(error instanceof ApiClientError ? error.message : "The analysis could not be completed. Try again.");
      }
    } finally {
      abortRef.current = null;
    }
  }

  return (
    <>
      <form className="analysis-form" onSubmit={submit} noValidate>
        <input type="hidden" value={form.creator_name} readOnly />
        <input type="hidden" value={form.target_audience} readOnly />
        <label><span>Instagram Post URL</span><div className="inline-field"><input type="url" value={form.content_url ?? ""} onChange={(e) => update("content_url", e.target.value)} aria-invalid={!!errors.content} aria-describedby={errors.content ? "content-error" : undefined} placeholder="https://www.instagram.com/p/Cr7y..." /><button className="button ghost" type="button" onClick={pasteLink}>Paste Link</button></div></label>
        <p className="reveal-line">Need manual metrics entry? Toggle fields below. <b>[REVEAL]</b></p>
        <div className="field-row">
          <label><span>Post Caption Text</span><textarea value={form.manual_content ?? ""} onChange={(e) => update("manual_content", e.target.value)} aria-invalid={!!errors.content} placeholder="Paste or type caption details here for qualitative copy analysis..." maxLength={20000} /></label>
          <label><span>Content Medium</span><select value={form.content_medium} onChange={(event) => update("content_medium", event.target.value as AnalysisRequest["content_medium"])}><option value="carousel">Carousel Post (Static)</option><option value="single_image">Single Image</option><option value="reel">Video / Reel</option><option value="story">Story</option></select></label>
        </div>
        {errors.content ? <small id="content-error" className="field-error">{errors.content}</small> : null}
        <fieldset><legend>Manual Instagram Insights data</legend><div className="manual-metrics">{["Impressions", "Reach", "Saves", "Shares", "Profile visits"].map((label) => <label key={label}><span>{label}</span><input inputMode="numeric" placeholder="0" /></label>)}</div></fieldset>
        <fieldset className="audit-focus"><legend>Audit Focus Objective</legend><div className="check-grid">{([[
          "increase_saves", "Maximize Reach"
        ], ["grow_reach", "Saves Per Reach"], ["improve_retention", "Share Rate Improvement"], ["increase_clicks", "Conversion to Follows"]] as const).map(([goal, label]) => <label key={goal}><input type="radio" name="goal" checked={form.goal === goal} onChange={() => update("goal", goal)} /><span>{label}</span></label>)}</div></fieldset>
        <div className="privacy-note">Tip: Your metric inputs remain private & are processed locally in this demo. No platform login is required.</div>
        <div className="form-actions"><button className="button primary" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Analyzing…" : "Run System Diagnostic"}</button><button className="button ghost" type="button" onClick={resetForm}>Clear Form</button>{status === "submitting" ? <button className="button ghost" type="button" onClick={() => abortRef.current?.abort()}>Cancel</button> : null}</div>
        <p className={`form-status ${status}`} role="status" aria-live="polite">{message || "No social account access or automatic posting is used."}</p>
      </form>
      {result ? <AnalysisResult result={result} /> : null}
    </>
  );
}
