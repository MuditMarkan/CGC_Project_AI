"use client";

import { FormEvent, useState } from "react";
import { ApiClientError, discoverInstagramProfile } from "@/lib/api";
import type { InstagramDiscoveryResponse } from "@/lib/contracts";


function valueOrUnavailable(value: string | number | null) {
  return value ?? "Unavailable from Meta";
}


export function PublicProfileDiscovery() {
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "completed" | "error">("idle");
  const [message, setMessage] = useState("Connect/configure the owned Professional account on the server before live lookup.");
  const [result, setResult] = useState<InstagramDiscoveryResponse | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!target.trim()) {
      setStatus("error");
      setMessage("Enter a public Instagram Business or Creator username/profile URL.");
      return;
    }
    setStatus("loading");
    setMessage("Requesting permitted public fields from Meta…");
    setResult(null);
    try {
      const response = await discoverInstagramProfile(target.trim());
      setResult(response);
      setStatus("completed");
      setMessage("Verified public Professional-account fields returned by Meta.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof ApiClientError ? error.message : "Public profile lookup failed.");
    }
  }

  return <section className="discovery-section" aria-labelledby="public-profile-heading">
    <div className="section-title"><span>LIVE DATA PATH</span><h2 id="public-profile-heading">Public Professional Account Discovery</h2></div>
    <p>Use an eligible public Instagram Business/Creator username or profile URL. CGC never claims another account&apos;s private Insights.</p>
    <form onSubmit={submit} className="discovery-form">
      <label><span>Target username or profile URL</span><input aria-label="Target username or profile URL" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="@creator or https://instagram.com/creator/" /></label>
      <button className="button primary" type="submit" disabled={status === "loading"}>{status === "loading" ? "Checking Meta…" : "Get public profile data"}</button>
    </form>
    <p className={`form-status ${status}`} role="status">{message}</p>
    {result ? <div className="discovery-result">
      <div className="result-heading"><div><p>VERIFIED META RESPONSE</p><h2>@{result.profile.username}</h2></div><span className="pill">LIVE PUBLIC DATA</span></div>
      <div className="metric-grid four">
        <div className="metric"><span>Followers</span><strong>{valueOrUnavailable(result.profile.followers_count)}</strong></div>
        <div className="metric"><span>Following</span><strong>{valueOrUnavailable(result.profile.follows_count)}</strong></div>
        <div className="metric"><span>Media count</span><strong>{valueOrUnavailable(result.profile.media_count)}</strong></div>
        <div className="metric"><span>Returned media</span><strong>{result.profile.media.length}</strong></div>
      </div>
      <p><strong>{valueOrUnavailable(result.profile.name)}</strong> — {valueOrUnavailable(result.profile.biography)}</p>
      <ul className="finding-list">{result.profile.media.map((media) => <li key={media.id}><b>{media.media_type ?? "Media"}</b><span>{media.caption ?? "Caption unavailable"}<small>Likes: {valueOrUnavailable(media.like_count)} · Comments: {valueOrUnavailable(media.comments_count)}</small></span>{media.permalink ? <a href={media.permalink} target="_blank" rel="noreferrer">Open</a> : null}</li>)}</ul>
      {result.unavailable_fields.length ? <p className="limitations"><strong>Unavailable fields:</strong> {result.unavailable_fields.join(", ")}</p> : null}
    </div> : null}
  </section>;
}
