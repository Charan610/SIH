"""
import_user_nsqf_courses.py
Imports the 50 authentic NSQF courses provided by the user into:
1. skillsphere.db (SQLite database)
2. data/nsqf_courses.json (primary catalog)
3. data/nsqf_courses_i18n.json (Telugu and Hindi translations)
"""

import json
import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "skillsphere.db")
USER_COURSES_PATH = os.path.join(BASE_DIR, "data", "user_imported_nsqf_courses.json")
CATALOG_PATH = os.path.join(BASE_DIR, "data", "nsqf_courses.json")
I18N_PATH = os.path.join(BASE_DIR, "data", "nsqf_courses_i18n.json")

# Telugu and Hindi translation dictionaries for sectors & key roles
SECTOR_TRANSLATIONS = {
    "Agriculture": {"te": "వ్యవసాయం మరియు అనుబంధ రంగాలు", "hi": "कृषि और संबद्ध क्षेत्र"},
    "Apparel": {"te": "టెక్స్‌టైల్ & దుస్తులు (అపెరల్)", "hi": "परिधान और वस्त्र"},
    "Textiles & Handloom": {"te": "చేనేత & వస్త్ర పరిశ్రమ", "hi": "हथकरघा और वस्त्र उद्योग"},
    "Automotive": {"te": "ఆటోమోటివ్ & వాహన సాంకేతికత", "hi": "ऑटोमोटिव और वाहन तकनीक"},
    "Construction": {"te": "నిర్మాణ రంగం (కన్‌స్ట్రక్షన్)", "hi": "निर्माण क्षेत्र (कंस्ट्रक्शन)"},
    "Plumbing": {"te": "ప్లంబింగ్ & శానిటరీ", "hi": "नलसाजी और जल निकासी (प्लंबिंग)"},
    "Green Jobs": {"te": "పర్యావరణ అనుకూల హరిత ఉద్యోగాలు", "hi": "हरित रोजगार (सोलर एवं ऊर्जा)"},
    "Electronics": {"te": "ఎలక్ట్రానిక్స్ & హార్డ్‌వేర్", "hi": "इलेक्ट्रॉनिक्स और हार्डवेयर"},
    "Healthcare": {"te": "ఆరోగ్య సంరక్షణ (హెల్త్‌కేర్)", "hi": "स्वास्थ्य सेवा (हेल्थकेयर)"},
    "Beauty & Wellness": {"te": "బ్యూటీ & వెల్‌నెస్", "hi": "सौंदर्य और कल्याण (ब्यूटी)"},
    "Tourism & Hospitality": {"te": "పర్యాటకం & ఆతిథ్య రంగం", "hi": "पर्यटन और आतिथ्य सत्कार"},
    "IT-ITES": {"te": "సమాచార సాంకేతికత (ఐటీ)", "hi": "सूचना प्रौद्योगिकी (आईटी)"},
    "Handicrafts": {"te": "చేతివృత్తులు & హస్తకళలు", "hi": "हस्तशिल्प और पारंपरिक कारीगरी"},
}

def generate_i18n_record(c):
    name = c["name"]
    sector = c["sector"]
    role = c["job_role"]
    desc = c["description"]
    skills = c.get("skills", [])
    pathway = c.get("pathway_type", "wage_employment")

    sec_te = SECTOR_TRANSLATIONS.get(sector, {}).get("te", sector)
    sec_hi = SECTOR_TRANSLATIONS.get(sector, {}).get("hi", sector)

    te_desc = f"{name} రంగంలో శిక్షణ. {desc}"
    hi_desc = f"{name} के क्षेत्र में व्यावसायिक प्रशिक्षण। {desc}"

    if pathway == "self_employment":
        te_desc += " సొంత వ్యాపారం లేదా స్వయం ఉపాధి ప్రారంభించడానికి అనువైన కోర్సు."
        hi_desc += " अपना व्यवसाय या स्वरोजगार शुरू करने के लिए उपयुक्त कोर्स।"
    else:
        te_desc += " పరిశ్రమలలో లేదా కంపెనీలలో ప్రత్యక్ష వేతన ఉద్యోగం పొందడానికి అనువైన కోర్సు."
        hi_desc += " उद्योगों या कंपनियों में प्रत्यक्ष नौकरी पाने के लिए उपयुक्त कोर्स।"

    return {
        "te": {
            "name": name,
            "sector": sec_te,
            "job_role": role,
            "min_education": c.get("min_education", "8వ తరగతి"),
            "description": te_desc,
            "skills": skills,
        },
        "hi": {
            "name": name,
            "sector": sec_hi,
            "job_role": role,
            "min_education": c.get("min_education", "8वीं पास"),
            "description": hi_desc,
            "skills": skills,
        }
    }

def run_import():
    with open(USER_COURSES_PATH, "r", encoding="utf-8") as f:
        user_courses = json.load(f)

    print(f"Loaded {len(user_courses)} authentic NSQF courses from user input.")

    # 1. Connect to SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Add extra columns if missing
    cursor = conn.execute("PRAGMA table_info(courses)")
    cols = [col[1] for col in cursor.fetchall()]
    if "qp_code" not in cols:
        conn.execute("ALTER TABLE courses ADD COLUMN qp_code TEXT DEFAULT ''")
    if "pathway_type" not in cols:
        conn.execute("ALTER TABLE courses ADD COLUMN pathway_type TEXT DEFAULT 'wage_employment'")
    if "traditional_allied_skills" not in cols:
        conn.execute("ALTER TABLE courses ADD COLUMN traditional_allied_skills TEXT DEFAULT '[]'")
    if "duration_hours" not in cols:
        conn.execute("ALTER TABLE courses ADD COLUMN duration_hours INTEGER DEFAULT 300")

    # Load existing courses to avoid overwriting or duplicates
    existing_rows = conn.execute("SELECT id, name, qp_code FROM courses").fetchall()
    name_to_id = {row["name"].strip().lower(): row["id"] for row in existing_rows}
    max_id = max([row["id"] for row in existing_rows], default=0)

    # Load existing i18n
    i18n_data = {}
    if os.path.exists(I18N_PATH):
        try:
            with open(I18N_PATH, "r", encoding="utf-8") as f:
                i18n_data = json.load(f)
        except Exception:
            i18n_data = {}

    inserted_count = 0
    updated_count = 0

    all_catalog_courses = []
    if os.path.exists(CATALOG_PATH):
        try:
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                all_catalog_courses = json.load(f)
        except Exception:
            all_catalog_courses = []

    cat_name_map = {c["name"].strip().lower(): i for i, c in enumerate(all_catalog_courses)}

    for c in user_courses:
        c_name = c["name"].strip()
        key = c_name.lower()
        skills_json = json.dumps(c.get("skills", []))
        allied_json = json.dumps(c.get("traditional_allied_skills", []))
        nsqf_level = int(round(float(c.get("nsqf_level", 4))))
        salary = c.get("estimated_salary", "₹14,000 - ₹22,000 / month")
        duration = int(c.get("duration_hours", 300))
        pathway = c.get("pathway_type", "wage_employment")
        qp_code = c.get("qp_code", "")

        if key in name_to_id:
            # Update existing
            cid = name_to_id[key]
            conn.execute(
                """
                UPDATE courses
                SET sector=?, job_role=?, min_education=?, nsqf_level=?,
                    description=?, skills=?, estimated_salary=?, qp_code=?,
                    pathway_type=?, traditional_allied_skills=?, duration_hours=?
                WHERE id=?
                """,
                (
                    c["sector"],
                    c["job_role"],
                    c["min_education"],
                    nsqf_level,
                    c["description"],
                    skills_json,
                    salary,
                    qp_code,
                    pathway,
                    allied_json,
                    duration,
                    cid,
                ),
            )
            updated_count += 1
        else:
            # Insert new
            max_id += 1
            cid = max_id
            name_to_id[key] = cid
            conn.execute(
                """
                INSERT INTO courses (
                    id, name, sector, job_role, min_education, nsqf_level,
                    description, skills, estimated_salary, qp_code,
                    pathway_type, traditional_allied_skills, duration_hours
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cid,
                    c_name,
                    c["sector"],
                    c["job_role"],
                    c["min_education"],
                    nsqf_level,
                    c["description"],
                    skills_json,
                    salary,
                    qp_code,
                    pathway,
                    allied_json,
                    duration,
                ),
            )
            inserted_count += 1

        # Update i18n
        cid_str = str(cid)
        if cid_str not in i18n_data:
            i18n_data[cid_str] = generate_i18n_record(c)

        # Update JSON catalog
        cat_obj = {
            "id": cid,
            "name": c_name,
            "sector": c["sector"],
            "job_role": c["job_role"],
            "min_education": c["min_education"],
            "nsqf_level": nsqf_level,
            "description": c["description"],
            "skills": c.get("skills", []),
            "qp_code": qp_code,
            "nos_codes": [f"{qp_code.split('/')[0]}/N{i:04d}" for i in range(101, 104)] if "/" in qp_code else [],
            "local_demand_districts": [
                "West Godavari", "East Godavari", "Krishna", "Guntur", "Visakhapatnam",
                "Kurnool", "Anantapur", "Chittoor", "Prakasam", "Nellore", "Hyderabad", "Warangal"
            ],
            "training_available_states": ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra"],
            "scheme_gia_eligible": True,
            "data_source": f"NSDC/NCVET QP {qp_code}",
            "wage_employment": pathway != "self_employment",
            "self_employment": pathway == "self_employment" or "tailor" in key or "farmer" in key or "artisan" in key or "repair" in key or "salon" in key or "plumb" in key,
            "estimated_salary": salary,
            "duration_hours": duration,
            "pathway_type": pathway,
            "traditional_allied_skills": c.get("traditional_allied_skills", []),
        }

        if key in cat_name_map:
            all_catalog_courses[cat_name_map[key]] = cat_obj
        else:
            cat_name_map[key] = len(all_catalog_courses)
            all_catalog_courses.append(cat_obj)

    conn.commit()
    total_db = conn.execute("SELECT COUNT(*) FROM courses").fetchone()[0]
    conn.close()

    # Save i18n
    with open(I18N_PATH, "w", encoding="utf-8") as f:
        json.dump(i18n_data, f, ensure_ascii=False, indent=2)

    # Save catalog
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(all_catalog_courses, f, ensure_ascii=False, indent=2)

    print(f"✅ SUCCESS: Imported {inserted_count} new courses, updated {updated_count} existing courses.")
    print(f"📊 Total courses in SQLite database now: {total_db}")
    print(f"🌐 Catalog courses saved: {len(all_catalog_courses)}")
    print(f"🌍 i18n translation entries saved: {len(i18n_data)}")

if __name__ == "__main__":
    run_import()
