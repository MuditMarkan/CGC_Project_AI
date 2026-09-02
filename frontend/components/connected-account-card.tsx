"use client";

import { useEffect, useState } from "react";
import {
  ApiClientError,
  beginInstagramConnect,
  disconnectInstagramAccount,
  getInstagramAccounts,
  getInstagramConfig,
} from "@/lib/api";
import type { InstagramAccountSummary, InstagramConfigResponse } from "@/lib/contracts";

interface Props {
  selectedAccountId: string | null;
  onSelect: (accountId: string | null) => void;
}

export function ConnectedAccountCard({ selectedAccountId, onSelect }: Props) {
  const [config, setConfig] = useState<InstagramConfigResponse | null>(null);
  const [accounts, setAccounts] = useState<InstagramAccountSummary[]>([]);
  const [status, setStatus] = useState("Checking Instagram connection…");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const [nextConfig, nextAccounts] = await Promise.all([
        getInstagramConfig(),
        getInstagramAccounts(),
      ]);
      setConfig(nextConfig);
      setAccounts(nextAccounts.accounts);
      if (nextAccounts.accounts.length && !selectedAccountId) {
        onSelect(nextAccounts.accounts[0].id);
      }
      setStatus(
        nextAccounts.accounts.length
          ? "Professional account connected with read-only OAuth permissions."
          : nextConfig.configured
            ? "No Instagram Professional account is connected."
            : "Meta App configuration is incomplete. Manual Insights remain available.",
      );
    } catch (error) {
      setStatus(error instanceof ApiClientError ? error.message : "Could not load Instagram connection status.");
    }
  }

  useEffect(() => {
    void refresh();
    // Refresh only when the component mounts; selection changes are local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect() {
    setBusy(true);
    try {
      const response = await beginInstagramConnect();
      window.location.assign(response.authorization_url);
    } catch (error) {
      setStatus(error instanceof ApiClientError ? error.message : "Instagram connection could not start.");
      setBusy(false);
    }
  }

  async function disconnect(accountId: string) {
    setBusy(true);
    try {
      await disconnectInstagramAccount(accountId);
      onSelect(null);
      await refresh();
    } catch (error) {
      setStatus(error instanceof ApiClientError ? error.message : "Instagram account could not be disconnected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="connected-account" aria-labelledby="instagram-account-heading">
      <div>
        <small>CONNECTED DATA SOURCE</small>
        <h2 id="instagram-account-heading">Instagram Professional account</h2>
        <p>{status}</p>
      </div>
      {accounts.length ? (
        <div className="account-actions">
          <label>
            <span>Account used for this analysis</span>
            <select value={selectedAccountId ?? ""} onChange={(event) => onSelect(event.target.value || null)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>@{account.username}</option>
              ))}
            </select>
          </label>
          <button className="button ghost" type="button" disabled={busy || !selectedAccountId} onClick={() => selectedAccountId && void disconnect(selectedAccountId)}>
            Disconnect
          </button>
        </div>
      ) : (
        <button className="button primary" type="button" disabled={busy || !config?.configured} onClick={() => void connect()}>
          {busy ? "Opening Instagram…" : "Connect Instagram"}
        </button>
      )}
    </section>
  );
}
