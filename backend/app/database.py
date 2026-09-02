from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Any

from .models import AnalysisRequest, AnalysisResponse, InstagramAccountSummary


SCHEMA = """
CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    request_json TEXT NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS oauth_states (
    state_hash TEXT PRIMARY KEY,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS instagram_accounts (
    id TEXT PRIMARY KEY,
    instagram_user_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    account_type TEXT,
    token_ciphertext TEXT NOT NULL,
    scopes_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected',
    connected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    token_expires_at TEXT
);
"""


class Database:
    def __init__(self, path: str) -> None:
        self.path = path
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(SCHEMA)

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def save_analysis(self, request: AnalysisRequest, response: AnalysisResponse) -> None:
        with self.connect() as connection:
            connection.execute(
                "INSERT OR REPLACE INTO analyses (id, request_json, result_json) VALUES (?, ?, ?)",
                (
                    response.analysis_id,
                    request.model_dump_json(),
                    response.model_dump_json(),
                ),
            )

    def save_oauth_state(self, state: str, expires_at: str) -> None:
        state_hash = hashlib.sha256(state.encode("utf-8")).hexdigest()
        with self.connect() as connection:
            connection.execute(
                "INSERT INTO oauth_states (state_hash, expires_at) VALUES (?, ?)",
                (state_hash, expires_at),
            )

    def consume_oauth_state(self, state: str, now_iso: str) -> bool:
        state_hash = hashlib.sha256(state.encode("utf-8")).hexdigest()
        with self.connect() as connection:
            row = connection.execute(
                "SELECT expires_at FROM oauth_states WHERE state_hash = ?",
                (state_hash,),
            ).fetchone()
            connection.execute("DELETE FROM oauth_states WHERE state_hash = ?", (state_hash,))
        return bool(row and row["expires_at"] > now_iso)

    def upsert_instagram_account(
        self,
        *,
        instagram_user_id: str,
        username: str,
        account_type: str | None,
        token_ciphertext: str,
        scopes: list[str],
        now_iso: str,
        token_expires_at: str | None,
    ) -> InstagramAccountSummary:
        account_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"cgc-instagram:{instagram_user_id}"))
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO instagram_accounts (
                    id, instagram_user_id, username, account_type, token_ciphertext,
                    scopes_json, status, connected_at, updated_at, token_expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'connected', ?, ?, ?)
                ON CONFLICT(instagram_user_id) DO UPDATE SET
                    username = excluded.username,
                    account_type = excluded.account_type,
                    token_ciphertext = excluded.token_ciphertext,
                    scopes_json = excluded.scopes_json,
                    status = 'connected',
                    updated_at = excluded.updated_at,
                    token_expires_at = excluded.token_expires_at
                """,
                (
                    account_id,
                    instagram_user_id,
                    username,
                    account_type,
                    token_ciphertext,
                    json.dumps(scopes),
                    now_iso,
                    now_iso,
                    token_expires_at,
                ),
            )
        account = self.get_instagram_account(account_id)
        if account is None:
            raise RuntimeError("Instagram account persistence failed.")
        return account

    def list_instagram_accounts(self) -> list[InstagramAccountSummary]:
        with self.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM instagram_accounts WHERE status = 'connected' ORDER BY updated_at DESC"
            ).fetchall()
        return [self._account_from_row(row) for row in rows]

    def get_instagram_account(self, account_id: str) -> InstagramAccountSummary | None:
        with self.connect() as connection:
            row = connection.execute(
                "SELECT * FROM instagram_accounts WHERE id = ? AND status = 'connected'",
                (account_id,),
            ).fetchone()
        return self._account_from_row(row) if row else None

    def disconnect_instagram_account(self, account_id: str, now_iso: str) -> bool:
        with self.connect() as connection:
            cursor = connection.execute(
                """
                UPDATE instagram_accounts
                SET status = 'revoked', token_ciphertext = '', updated_at = ?
                WHERE id = ? AND status = 'connected'
                """,
                (now_iso, account_id),
            )
        return cursor.rowcount == 1

    @staticmethod
    def _account_from_row(row: sqlite3.Row) -> InstagramAccountSummary:
        return InstagramAccountSummary.model_validate(
            {
                "id": row["id"],
                "instagram_user_id": row["instagram_user_id"],
                "username": row["username"],
                "account_type": row["account_type"],
                "status": row["status"],
                "scopes": json.loads(row["scopes_json"]),
                "connected_at": row["connected_at"],
                "updated_at": row["updated_at"],
                "token_expires_at": row["token_expires_at"],
            }
        )


@lru_cache(maxsize=4)
def _database_for_path(path: str) -> Database:
    return Database(path)


def get_database() -> Database:
    default_path = str(Path(__file__).resolve().parents[1] / "data" / "cgc.db")
    return _database_for_path(os.getenv("CGC_DATABASE_PATH", default_path))
