#!/usr/bin/env python3
"""
scripts/import_nsqf_descriptors.py — Reusable Import & Validation CLI
====================================================================
Source of Truth: level_description.pdf (17 Pages)

Performs:
1. Extraction file reading
2. Strict schema and source metadata validation
3. Record normalization
4. Direct SQLite database ingestion
5. Error and audit reporting
"""

import sys
import os
import json

# Ensure parent directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from nsqf.repository import seed_nsqf_data, get_all_descriptors, get_all_entry_norms
from nsqf.schemas import NSQFDescriptorRecord, NSQFEntryNormRecord


def validate_and_import():
    print("==========================================================")
    print("NSQF DESCRIPTOR & ENTRY NORM IMPORT & VALIDATION PIPELINE")
    print("Authoritative Source: level_description.pdf (17 Pages)")
    print("==========================================================")

    data_dir = os.path.join(os.path.dirname(__file__), "..", "nsqf", "data")
    desc_path = os.path.join(data_dir, "nsqf_descriptors.json")
    norms_path = os.path.join(data_dir, "nsqf_entry_norms.json")

    errors = []

    # 1. Validate Descriptors JSON
    if not os.path.exists(desc_path):
        errors.append(f"Descriptors file missing: {desc_path}")
    else:
        with open(desc_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                seen_levels = set()
                for idx, item in enumerate(data):
                    try:
                        record = NSQFDescriptorRecord(**item)
                        if record.level_code in seen_levels:
                            errors.append(f"Duplicate level code found: {record.level_code}")
                        seen_levels.add(record.level_code)

                        # Verify source metadata
                        if not record.source.pages:
                            errors.append(f"Level {record.level_code}: Missing source page")
                        if record.source.document != "level_description.pdf":
                            errors.append(f"Level {record.level_code}: Unexpected source doc {record.source.document}")
                    except Exception as e:
                        errors.append(f"Validation error in descriptor #{idx}: {e}")
                print(f"✓ Validated {len(data)} descriptor level bands (Levels 1 to 8)")
            except json.JSONDecodeError as e:
                errors.append(f"Invalid JSON in {desc_path}: {e}")

    # 2. Validate Entry Norms JSON
    if not os.path.exists(norms_path):
        errors.append(f"Entry norms file missing: {norms_path}")
    else:
        with open(norms_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                for idx, item in enumerate(data):
                    try:
                        record = NSQFEntryNormRecord(**item)
                        if record.source_page < 12 or record.source_page > 17:
                            errors.append(f"Level {record.level_code}: Source page {record.source_page} outside expected range (12-17)")
                    except Exception as e:
                        errors.append(f"Validation error in entry norm #{idx}: {e}")
                print(f"✓ Validated {len(data)} entry norm records (Pages 12 to 17)")
            except json.JSONDecodeError as e:
                errors.append(f"Invalid JSON in {norms_path}: {e}")

    if errors:
        print("\n❌ VALIDATION FAILED WITH ERRORS:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    print("\nExecuting database ingestion into SQLite...")
    res = seed_nsqf_data()
    print(f"✓ Successfully seeded database:")
    print(f"   - Descriptors loaded: {res['descriptors_loaded']}")
    print(f"   - Entry norms loaded: {res['entry_norms_loaded']}")

    # Post-import verification
    descriptors = get_all_descriptors()
    norms = get_all_entry_norms()
    print(f"\nVerification query: Read back {len(descriptors)} active descriptors and {len(norms)} active entry norms.")
    for d in descriptors:
        print(f"   • Level {d.level_code:7s} | {d.typical_role:35s} | Source: Pages {d.source.pages}")

    print("\n✅ NSQF IMPORT & AUDIT COMPLETED SUCCESSFULLY!")


if __name__ == "__main__":
    validate_and_import()
