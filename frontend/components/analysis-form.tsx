"use client";

import { FormEvent, useRef, useState } from "react";
import { createAnalysis, ApiClientError } from "@/lib/api";
import type { AnalysisRequest, AnalysisResponse } from "@/lib/contracts";
import { AnalysisResult } from "./analysis-result";
import { ConnectedAccountCard } from "./connected-account-card";

type FormErrors = Partial<Record<"creator_name" | "content" | "target_audience" | "brand_tone", string>>;
const initial: AnalysisRequest = {
  creator_name: "Narrative Co.",
  content_url: "",
  manual_content: "",
  platform: "instagram",
  content_medium: "carousel",
  target_audience: "Instagram nano-business audience",
  goal: "grow_reach",
  primary_metric: "reach",
  brand_tone: ["practical"],
  manual_metrics: null,
  connected_account_id: null,
};

const goalOptions = [
  ["grow_reach", "reach", "Maximize Reach"],
  ["increase_saves_per_reach", "saves_per_reach", "Saves Per Reach"],
  ["increase_share_rate", "shares_per_reach", "Share Rate Improvement"],
  ["increase_follow_conversion", "follow_conversion", "Conversion to Follows"],
] as const;

const metricFields = [
  ["impressions", "Impressions"],
  ["reach", "Reach"],
  ["saves", "Saves"],
  ["shares", "Shares"],
  ["profile_visits", "Profile visits"],
] as const;

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

  function updateMetric(key: (typeof metricFields)[number][0], rawValue: string) {
    setForm((current) => {
      const metrics = { ...(current.manual_metrics ?? {}) };
      if (rawValue === "") delete metrics[key];
      else metrics[key] = Number(rawValue);
      return { ...current, manual_metrics: Object.keys(metrics).length ? metrics : null };
    });
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
        <ConnectedAccountCard selectedAccountId={form.connected_account_id} onSelect={(id) => update("connected_account_id", id)} />
        <div className="field-row">
          <label><span>Creator / Workspace name</span><input value={form.creator_name} onChange={(event) => update("creator_name", event.target.value)} aria-invalid={!!errors.creator_name} />{errors.creator_name ? <small className="field-error">{errors.creator_name}</small> : null}</label>
          <label><span>Target audience</span><input value={form.target_audience} onChange={(event) => update("target_audience", event.target.value)} aria-invalid={!!errors.target_audience} />{errors.target_audience ? <small className="field-error">{errors.target_audience}</small> : null}</label>
        </div>
        <label><span>Instagram Post URL</span><div className="inline-field"><input type="url" value={form.content_url ?? ""} onChange={(e) => update("content_url", e.target.value)} aria-invalid={!!errors.content} aria-describedby={errors.content ? "content-error" : undefined} placeholder="https://www.instagram.com/p/Cr7y..." /><button className="button ghost" type="button" onClick={pasteLink}>Paste Link</button></div></label>
        <p className="reveal-line">Use an Instagram URL as a reference and enter Insights manually until live Insights verification passes.</p>
        <div className="field-row">
          <label><span>Post Caption Text</span><textarea value={form.manual_content ?? ""} onChange={(e) => update("manual_content", e.target.value)} aria-invalid={!!errors.content} placeholder="Paste or type caption details here for qualitative copy analysis..." maxLength={20000} /></label>
          <label><span>Content Medium</span><select value={form.content_medium} onChange={(event) => update("content_medium", event.target.value as AnalysisRequest["content_medium"])}><option value="carousel">Carousel Post (Static)</option><option value="single_image">Single Image</option><option value="reel">Video / Reel</option><option value="story">Story</option></select></label>
        </div>
        {errors.content ? <small id="content-error" className="field-error">{errors.content}</small> : null}
        <fieldset><legend>Manual Instagram Insights data</legend><div className="manual-metrics">{metricFields.map(([key, label]) => <label key={key}><span>{label}</span><input type="number" min="0" inputMode="numeric" placeholder="Not provided" value={form.manual_metrics?.[key] ?? ""} onChange={(event) => updateMetric(key, event.target.value)} /></label>)}</div></fieldset>
        <fieldset className="audit-focus"><legend>Audit Focus Objective</legend><div className="check-grid">{goalOptions.map(([goal, primaryMetric, label]) => <label key={goal}><input type="radio" name="goal" checked={form.goal === goal} onChange={() => setForm((current) => ({ ...current, goal, primary_metric: primaryMetric }))} /><span>{label}</span></label>)}</div></fieldset>
        <div className="privacy-note">OAuth is read-only and accepts Professional accounts only. Instagram passwords are never requested or stored.</div>
        <div className="form-actions"><button className="button primary" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Analyzing…" : "Run System Diagnostic"}</button><button className="button ghost" type="button" onClick={resetForm}>Clear Form</button>{status === "submitting" ? <button className="button ghost" type="button" onClick={() => abortRef.current?.abort()}>Cancel</button> : null}</div>
        <p className={`form-status ${status}`} role="status" aria-live="polite">{message || "No social account access or automatic posting is used."}</p>
      </form>
      {result ? <AnalysisResult result={result} /> : null}
    </>
  );
}
