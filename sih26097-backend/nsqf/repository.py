"""
nsqf/repository.py — Data Persistence and SQLite Storage for NSQF Descriptors
==============================================================================
Source of Truth: level_description.pdf (17 Pages)
Manages schemas:
    1. nsqf_descriptors — 5-dimensional descriptor bands across Levels 1 to 8
    2. nsqf_entry_norms — STT & LTT minimum entry criteria & notional hours
"""

import json
import os
import sqlite3
from typing import List, Optional

import db
from nsqf.schemas import (
    NSQFDescriptorRecord,
    NSQFEntryNormRecord,
    BriefOutline,
    DetailedDescriptor,
    SourceMetadata,
    STTNormItem,
    LTTNorm,
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DESCRIPTORS_FILE = os.path.join(DATA_DIR, "nsqf_descriptors.json")
ENTRY_NORMS_FILE = os.path.join(DATA_DIR, "nsqf_entry_norms.json")


def init_nsqf_tables():
    """
    Creates SQLite tables for NSQF descriptors and standard entry norms,
    preserving exact source page metadata and versioning.
    """
    conn = db.get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS nsqf_descriptors (
                level_code          TEXT PRIMARY KEY,
                level_range         TEXT NOT NULL,
                typical_role        TEXT NOT NULL,
                brief_outline_json  TEXT NOT NULL,
                detailed_descriptor_json TEXT NOT NULL,
                source_document     TEXT NOT NULL,
                source_pages        TEXT NOT NULL,
                source_title        TEXT NOT NULL,
                source_version      TEXT NOT NULL,
                verification_status TEXT NOT NULL,
                is_active           INTEGER NOT NULL DEFAULT 1,
                created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS nsqf_entry_norms (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                level_code          TEXT NOT NULL,
                stt_norms_json      TEXT NOT NULL,
                ltt_norms_json      TEXT,
                source_page         INTEGER NOT NULL,
                is_active           INTEGER NOT NULL DEFAULT 1,
                created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(level_code)
            )
        """)
        conn.commit()
    finally:
        conn.close()


def seed_nsqf_data() -> dict:
    """
    Loads authoritative descriptor records and entry norms extracted directly
    from level_description.pdf into SQLite.
    """
    init_nsqf_tables()
    conn = db.get_connection()
    inserted_descriptors = 0
    inserted_norms = 0

    try:
        # 1. Seed Descriptors
        if os.path.exists(DESCRIPTORS_FILE):
            with open(DESCRIPTORS_FILE, "r", encoding="utf-8") as f:
                descriptors_data = json.load(f)

            for d in descriptors_data:
                conn.execute("""
                    INSERT OR REPLACE INTO nsqf_descriptors (
                        level_code, level_range, typical_role,
                        brief_outline_json, detailed_descriptor_json,
                        source_document, source_pages, source_title,
                        source_version, verification_status, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """, (
                    d["level_code"],
                    d["level_range"],
                    d["typical_role"],
                    json.dumps(d["brief_outline"]),
                    json.dumps(d["detailed_descriptor"]),
                    d["source"]["document"],
                    d["source"]["pages"],
                    d["source"]["title"],
                    d["source"]["version"],
                    d["source"]["verification_status"],
                ))
                inserted_descriptors += 1

        # 2. Seed Entry Norms
        if os.path.exists(ENTRY_NORMS_FILE):
            with open(ENTRY_NORMS_FILE, "r", encoding="utf-8") as f:
                norms_data = json.load(f)

            for n in norms_data:
                ltt_json = json.dumps(n["ltt_norms"]) if n.get("ltt_norms") else None
                conn.execute("""
                    INSERT OR REPLACE INTO nsqf_entry_norms (
                        level_code, stt_norms_json, ltt_norms_json, source_page, is_active
                    ) VALUES (?, ?, ?, ?, 1)
                """, (
                    n["level_code"],
                    json.dumps(n.get("stt_norms", [])),
                    ltt_json,
                    n["source_page"],
                ))
                inserted_norms += 1

        conn.commit()
    finally:
        conn.close()

    return {
        "descriptors_loaded": inserted_descriptors,
        "entry_norms_loaded": inserted_norms
    }


def _row_to_descriptor_record(row: sqlite3.Row) -> NSQFDescriptorRecord:
    brief_data = json.loads(row["brief_outline_json"])
    detailed_data = json.loads(row["detailed_descriptor_json"])
    source_meta = SourceMetadata(
        document=row["source_document"],
        pages=row["source_pages"],
        title=row["source_title"],
        version=row["source_version"],
        verification_status=row["verification_status"],
    )
    return NSQFDescriptorRecord(
        level_code=row["level_code"],
        level_range=row["level_range"],
        typical_role=row["typical_role"],
        brief_outline=BriefOutline(**brief_data),
        detailed_descriptor=DetailedDescriptor(**detailed_data),
        source=source_meta,
    )


def get_all_descriptors() -> List[NSQFDescriptorRecord]:
    """Retrieve all active NSQF level descriptor records ordered by level."""
    init_nsqf_tables()
    conn = db.get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM nsqf_descriptors WHERE is_active = 1 ORDER BY rowid"
        ).fetchall()
        return [_row_to_descriptor_record(r) for r in rows]
    finally:
        conn.close()


def get_descriptor_by_level(level_code: str) -> Optional[NSQFDescriptorRecord]:
    """Retrieve an NSQF level descriptor record by its level code (e.g. '1', '2', '2.5-3')."""
    init_nsqf_tables()
    conn = db.get_connection()
    try:
        # Normalize: trim and replace underscores or spaces
        clean_code = level_code.strip()
        row = conn.execute(
            "SELECT * FROM nsqf_descriptors WHERE level_code = ? AND is_active = 1",
            (clean_code,)
        ).fetchone()
        if not row:
            # Try alternate e.g. '2.5 to 3' vs '2.5-3'
            alt_code = clean_code.replace(" to ", "-").replace(" ", "")
            row = conn.execute(
                "SELECT * FROM nsqf_descriptors WHERE (level_code = ? OR level_range LIKE ?) AND is_active = 1",
                (alt_code, f"%{clean_code}%")
            ).fetchone()
        if not row:
            return None
        return _row_to_descriptor_record(row)
    finally:
        conn.close()


def get_all_entry_norms() -> List[NSQFEntryNormRecord]:
    """Retrieve standard entry criteria and notional hours for all levels."""
    init_nsqf_tables()
    conn = db.get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM nsqf_entry_norms WHERE is_active = 1 ORDER BY id"
        ).fetchall()
        results = []
        for r in rows:
            stt_list = [STTNormItem(**item) for item in json.loads(r["stt_norms_json"])]
            ltt = LTTNorm(**json.loads(r["ltt_norms_json"])) if r["ltt_norms_json"] else None
            results.append(NSQFEntryNormRecord(
                level_code=r["level_code"],
                stt_norms=stt_list,
                ltt_norms=ltt,
                source_page=r["source_page"]
            ))
        return results
    finally:
        conn.close()


def get_entry_norm_by_level(level_code: str) -> Optional[NSQFEntryNormRecord]:
    """Retrieve entry norms for a specific level."""
    init_nsqf_tables()
    conn = db.get_connection()
    try:
        clean_code = level_code.strip()
        row = conn.execute(
            "SELECT * FROM nsqf_entry_norms WHERE level_code = ? AND is_active = 1",
            (clean_code,)
        ).fetchone()
        if not row:
            return None
        stt_list = [STTNormItem(**item) for item in json.loads(row["stt_norms_json"])]
        ltt = LTTNorm(**json.loads(row["ltt_norms_json"])) if row["ltt_norms_json"] else None
        return NSQFEntryNormRecord(
            level_code=row["level_code"],
            stt_norms=stt_list,
            ltt_norms=ltt,
            source_page=row["source_page"]
        )
    finally:
        conn.close()
