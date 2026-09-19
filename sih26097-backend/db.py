"""
db.py — ALL Database Operations In One Place
==============================================
WHAT:   Creates the SQLite database, creates tables, and provides functions
        to read/write data. This is the ONLY file that talks to the database.
WHY:    By keeping all SQL in one file, the rest of the app never needs to
        know HOW data is stored — it just calls functions like:
            db.get_all_courses()
            db.add_user(user)
            db.save_recommendation(rec)
USED BY: main.py (to initialize), routers (to fetch/save data).
CALLS:   config.py (for database path), models.py (for data shapes).

HOW SQLITE WORKS (quick primer):
    - SQLite stores everything in a single .db file (no server needed!)
    - We write SQL commands to create tables, insert rows, and query data
    - Python's built-in `sqlite3` module handles the connection
"""

import sqlite3
import json
import os
from typing import Optional

from config import settings
from models import Course, User, Recommendation, Feedback


# ═══════════════════════════════════════════════════════════════
# DATABASE CONNECTION
# ═══════════════════════════════════════════════════════════════

def get_connection() -> sqlite3.Connection:
    """
    Open a connection to the SQLite database.

    Returns a connection object. The caller MUST close it when done,
    or use it in a `with` statement.

    row_factory = sqlite3.Row means we can access columns by name:
        row["name"] instead of row[1]
    """
    conn = sqlite3.connect(settings.database_path, timeout=20.0)
    conn.row_factory = sqlite3.Row  # So we can do row["column_name"]
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")  # Enforce foreign key rules
    return conn


# ═══════════════════════════════════════════════════════════════
# TABLE CREATION — Run once when the app starts
# ═══════════════════════════════════════════════════════════════

def create_tables():
    """
    Create all database tables if they don't already exist.

    Called by: main.py at startup.

    Tables created:
        1. courses        — The NSQF course catalog
        2. users          — People using the assistant
        3. recommendations — Courses recommended to users
        4. feedback       — User ratings of recommendations
    """
    conn = get_connection()

    # ── Table 1: courses ─────────────────────────────────────
    # Stores every course in our catalog.
    # The "skills" column stores a JSON array like '["wiring","safety"]'
    conn.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            id              INTEGER PRIMARY KEY,
            name            TEXT    NOT NULL,
            sector          TEXT    NOT NULL,
            job_role        TEXT    NOT NULL,
            min_education   TEXT    NOT NULL,
            nsqf_level      INTEGER NOT NULL,
            description     TEXT    NOT NULL,
            skills          TEXT    NOT NULL DEFAULT '[]',
            estimated_salary TEXT   DEFAULT '₹15,000 - ₹22,000 / month'
        )
    """)

    # Migration check for courses table (add estimated_salary if missing)
    cursor = conn.execute("PRAGMA table_info(courses)")
    course_cols = [col[1] for col in cursor.fetchall()]
    if "estimated_salary" not in course_cols:
        conn.execute("ALTER TABLE courses ADD COLUMN estimated_salary TEXT DEFAULT '₹15,000 - ₹22,000 / month'")

    # ── Table 2: users ───────────────────────────────────────
    # Stores user profiles. Most fields are optional because we
    # might learn about the user gradually through conversation.
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT    NOT NULL,
            age             INTEGER,
            gender          TEXT,
            caste_category  TEXT,
            state           TEXT,
            district        TEXT,
            education_level TEXT,
            annual_income   INTEGER,
            language        TEXT,
            skills          TEXT    NOT NULL DEFAULT '[]',
            interests       TEXT    NOT NULL DEFAULT '[]',
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── Table 3: recommendations ─────────────────────────────
    # Each row = "we recommended course X to user Y with score Z".
    # user_id points to the users table, course_id points to courses.
    # trace stores the full auditable decision pipeline JSON (Phase 12).
    conn.execute("""
        CREATE TABLE IF NOT EXISTS recommendations (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            course_id       INTEGER NOT NULL,
            score           REAL    NOT NULL DEFAULT 0.0,
            reason          TEXT    NOT NULL DEFAULT '',
            trace           TEXT    NOT NULL DEFAULT '{}',
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)   REFERENCES users(id),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        )
    """)

    # Migration check for recommendations table
    cursor = conn.execute("PRAGMA table_info(recommendations)")
    rec_cols = [col[1] for col in cursor.fetchall()]
    if "trace" not in rec_cols:
        conn.execute("ALTER TABLE recommendations ADD COLUMN trace TEXT NOT NULL DEFAULT '{}'")

    # ── Table 4: feedback ────────────────────────────────────
    # Stores user outcomes and ratings on recommendations.
    # CRITICAL: Feedback is future training data for MLMatcher.
    # The current EmbeddingMatcher does NOT train on this data.
    conn.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             INTEGER,
            recommendation_id   INTEGER NOT NULL,
            accepted            INTEGER NOT NULL DEFAULT 0,
            outcome_note        TEXT    NOT NULL DEFAULT '',
            rating              INTEGER CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5)),
            comment             TEXT    NOT NULL DEFAULT '',
            created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)           REFERENCES users(id),
            FOREIGN KEY (recommendation_id) REFERENCES recommendations(id)
        )
    """)

    # Migration check for existing databases
    cursor = conn.execute("PRAGMA table_info(feedback)")
    table_info = {col[1]: col for col in cursor.fetchall()}
    # If rating or user_id has legacy NOT NULL constraint (col[3] == 1), migrate the table
    if "rating" in table_info and table_info["rating"][3] == 1:
        conn.execute("ALTER TABLE feedback RENAME TO feedback_old")
        conn.execute("""
            CREATE TABLE feedback (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id             INTEGER,
                recommendation_id   INTEGER NOT NULL,
                accepted            INTEGER NOT NULL DEFAULT 0,
                outcome_note        TEXT    NOT NULL DEFAULT '',
                rating              INTEGER CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5)),
                comment             TEXT    NOT NULL DEFAULT '',
                created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id)           REFERENCES users(id),
                FOREIGN KEY (recommendation_id) REFERENCES recommendations(id)
            )
        """)
        conn.execute("""
            INSERT INTO feedback (id, user_id, recommendation_id, rating, comment, created_at)
            SELECT id, user_id, recommendation_id, rating, comment, created_at FROM feedback_old
        """)
        conn.execute("DROP TABLE feedback_old")
    else:
        cols = list(table_info.keys())
        if "accepted" not in cols:
            conn.execute("ALTER TABLE feedback ADD COLUMN accepted INTEGER NOT NULL DEFAULT 0")
        if "outcome_note" not in cols:
            conn.execute("ALTER TABLE feedback ADD COLUMN outcome_note TEXT NOT NULL DEFAULT ''")

    # ── Table 5: voice_assessment_answers ─────────────────────
    # Stores individual question-and-answer turns from the voice assessment.
    # Enables step-by-step progress tracking, auditability, and profile generation.
    conn.execute("""
        CREATE TABLE IF NOT EXISTS voice_assessment_answers (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id      TEXT    NOT NULL,
            user_id         INTEGER,
            step_number     INTEGER NOT NULL,
            question_id     TEXT    NOT NULL,
            question_text   TEXT    NOT NULL,
            answer_text     TEXT    NOT NULL,
            language        TEXT    NOT NULL DEFAULT 'en',
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_voice_assessment_session ON voice_assessment_answers(session_id)")

    # ── Table 6: business_pathways ────────────────────────────
    # Stores verified micro-enterprise and self-employment models.
    conn.execute("""
        CREATE TABLE IF NOT EXISTS business_pathways (
            id                  INTEGER PRIMARY KEY,
            trade_category      TEXT    NOT NULL,
            business_title      TEXT    NOT NULL,
            business_type       TEXT    NOT NULL,
            description         TEXT    NOT NULL,
            target_customers    TEXT    NOT NULL,
            operating_model     TEXT    NOT NULL,
            skills_have         TEXT    NOT NULL DEFAULT '[]',
            skills_recommended  TEXT    NOT NULL DEFAULT '[]',
            nsqf_course_id      INTEGER,
            nsqf_course_name    TEXT,
            nsqf_level          INTEGER,
            equipment           TEXT    NOT NULL DEFAULT '[]',
            investment_breakdown TEXT   NOT NULL DEFAULT '{}',
            translations        TEXT    NOT NULL DEFAULT '{}',
            FOREIGN KEY (nsqf_course_id) REFERENCES courses(id)
        )
    """)

    # ── Table 7: government_schemes ───────────────────────────
    # Stores verified government enterprise and livelihood schemes (PM-AJAY GIA, Vishwakarma, PMEGP, Mudra).
    conn.execute("""
        CREATE TABLE IF NOT EXISTS government_schemes (
            id                  INTEGER PRIMARY KEY,
            scheme_name         TEXT    NOT NULL,
            ministry            TEXT    NOT NULL,
            description         TEXT    NOT NULL,
            purpose             TEXT    NOT NULL,
            eligibility_criteria TEXT   NOT NULL DEFAULT '[]',
            support_type        TEXT    NOT NULL,
            max_subsidy_amount  TEXT,
            official_url        TEXT    NOT NULL,
            is_verified         INTEGER NOT NULL DEFAULT 1,
            source              TEXT    NOT NULL,
            applicable_business_types TEXT NOT NULL DEFAULT '[]',
            applicable_trades   TEXT    NOT NULL DEFAULT '[]',
            translations        TEXT    NOT NULL DEFAULT '{}'
        )
    """)

    # ── Table 8: scheme_business_mapping ──────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scheme_business_mapping (
            business_id         INTEGER NOT NULL,
            scheme_id           INTEGER NOT NULL,
            PRIMARY KEY (business_id, scheme_id),
            FOREIGN KEY (business_id) REFERENCES business_pathways(id),
            FOREIGN KEY (scheme_id) REFERENCES government_schemes(id)
        )
    """)

    # ── Table 9: skills (Normalized Competency Taxonomy) ─────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS skills (
            skill_id            TEXT PRIMARY KEY,
            canonical_name      TEXT UNIQUE NOT NULL,
            domain              TEXT NOT NULL,
            description         TEXT,
            verification_type   TEXT NOT NULL,
            source_reference    TEXT NOT NULL
        )
    """)

    # ── Table 10: occupations (NCO & Sector Skill Councils) ───
    conn.execute("""
        CREATE TABLE IF NOT EXISTS occupations (
            occupation_id       TEXT PRIMARY KEY,
            occupation_title    TEXT NOT NULL,
            nco_code            TEXT NOT NULL,
            sector_skill_council TEXT NOT NULL,
            entry_education     TEXT NOT NULL,
            employment_opportunities TEXT,
            self_employment_potential TEXT,
            primary_tools       TEXT,
            verification_status TEXT NOT NULL
        )
    """)

    # ── Table 11: nsqf_qualifications (NCVET National Register) ─
    conn.execute("""
        CREATE TABLE IF NOT EXISTS nsqf_qualifications (
            qualification_code  TEXT PRIMARY KEY,
            qualification_name  TEXT NOT NULL,
            sector              TEXT NOT NULL,
            nsqf_level          INTEGER,
            theory_hours        INTEGER NOT NULL,
            practical_hours     INTEGER NOT NULL,
            employability_hours INTEGER DEFAULT 60,
            total_hours         INTEGER NOT NULL,
            minimum_age         INTEGER DEFAULT 18,
            entry_requirement   TEXT NOT NULL,
            official_source_url TEXT NOT NULL,
            last_verified       DATE DEFAULT '2026-04-16'
        )
    """)

    # ── Table 12: skill_occupation_mapping ────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS skill_occupation_mapping (
            mapping_id          TEXT PRIMARY KEY,
            skill_id            TEXT NOT NULL,
            occupation_id       TEXT NOT NULL,
            relevance_weight    REAL DEFAULT 1.0,
            FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE,
            FOREIGN KEY (occupation_id) REFERENCES occupations(occupation_id) ON DELETE CASCADE
        )
    """)

    # ── Table 13: training_centres (Physical Hubs & ITIs) ─────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS training_centres (
            centre_id           TEXT PRIMARY KEY,
            centre_name         TEXT NOT NULL,
            operating_agency    TEXT NOT NULL,
            district            TEXT NOT NULL,
            state               TEXT DEFAULT 'Andhra Pradesh',
            pincode             TEXT NOT NULL,
            address             TEXT NOT NULL,
            facilities          TEXT NOT NULL,
            contact_person      TEXT,
            contact_phone       TEXT,
            is_active           INTEGER DEFAULT 1,
            verification_status TEXT DEFAULT 'Verified Official Data'
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_training_centres_district ON training_centres(district)")

    # ── Table 14: district_skill_demand (DSDP & APSSDC Reports) ──
    conn.execute("""
        CREATE TABLE IF NOT EXISTS district_skill_demand (
            demand_id           TEXT PRIMARY KEY,
            district            TEXT NOT NULL,
            state               TEXT DEFAULT 'Andhra Pradesh',
            economic_focus      TEXT NOT NULL,
            occupation_category TEXT NOT NULL,
            demand_indicator    TEXT NOT NULL,
            demand_rationale    TEXT NOT NULL,
            verification_confidence TEXT NOT NULL,
            last_updated        DATE DEFAULT '2026-04-16'
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_district_demand ON district_skill_demand(district, occupation_category)")

    # ── Table 15: scheme_eligibility (Deterministic Rules) ───
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scheme_eligibility (
            rule_id             TEXT PRIMARY KEY,
            scheme_code         TEXT NOT NULL,
            evaluated_field     TEXT NOT NULL,
            required_condition  TEXT NOT NULL,
            logical_operator    TEXT NOT NULL,
            failure_message     TEXT NOT NULL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_scheme_eligibility_code ON scheme_eligibility(scheme_code)")

    # ── Table 16: ap_district_profiles (AP 26 Districts Ecosystem) ─
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ap_district_profiles (
            district_name       TEXT PRIMARY KEY,
            headquarters        TEXT NOT NULL,
            sc_population_percent REAL NOT NULL,
            dominant_subcastes  TEXT NOT NULL,
            leading_industrial_sectors TEXT NOT NULL,
            priority_skilling_sectors  TEXT NOT NULL,
            district_nodal_office      TEXT NOT NULL
        )
    """)

    # ── Table 17: multilingual_terms (NCVET & SSC Terminology) ─
    conn.execute("""
        CREATE TABLE IF NOT EXISTS multilingual_terms (
            term_id             TEXT PRIMARY KEY,
            canonical_en        TEXT NOT NULL,
            term_te             TEXT NOT NULL,
            term_hi             TEXT NOT NULL,
            functional_definition TEXT NOT NULL,
            translation_category  TEXT NOT NULL
        )
    """)

    # ── Table 18: skill_gap_matrix (Differential Deficits) ───
    conn.execute("""
        CREATE TABLE IF NOT EXISTS skill_gap_matrix (
            gap_id              TEXT PRIMARY KEY,
            informal_competency TEXT NOT NULL,
            target_job_role     TEXT NOT NULL,
            compulsory_nos      TEXT NOT NULL,
            competency_deficit  TEXT NOT NULL,
            bridge_module       TEXT NOT NULL,
            training_mode       TEXT NOT NULL,
            classification      TEXT DEFAULT 'Derived System Mapping'
        )
    """)

    # Seed verified self-employment data
    seed_self_employment_data(conn)

    # Seed authoritative research datasets
    seed_research_dataset(conn)

    conn.commit()
    conn.close()
    print("✅ Database tables created successfully.")



# ═══════════════════════════════════════════════════════════════
# COURSE OPERATIONS
# ═══════════════════════════════════════════════════════════════

def load_courses_from_json(filepath: str) -> int:
    """
    Read courses from a JSON file and insert them into the database.

    Args:
        filepath: Path to the JSON file (e.g. "data/nsqf_courses.json")

    Returns:
        Number of courses loaded.

    How it works:
        1. Open the JSON file and read the list of courses
        2. For each course, insert a row into the 'courses' table
        3. If a course with the same ID already exists, skip it (OR IGNORE)
    """
    # Read the JSON file
    with open(filepath, "r", encoding="utf-8") as f:
        courses_data = json.load(f)

    conn = get_connection()
    count = 0

    for course in courses_data:
        # Convert the skills list to a JSON string for storage
        # e.g. ["wiring", "safety"] → '["wiring", "safety"]'
        skills_json = json.dumps(course.get("skills", []))
        salary_str = course.get("estimated_salary", "₹15,000 - ₹22,000 / month")

        conn.execute(
            """
            INSERT INTO courses
                (id, name, sector, job_role, min_education, nsqf_level, description, skills, estimated_salary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                sector=excluded.sector,
                job_role=excluded.job_role,
                min_education=excluded.min_education,
                nsqf_level=excluded.nsqf_level,
                description=excluded.description,
                skills=excluded.skills,
                estimated_salary=excluded.estimated_salary
            """,
            (
                course["id"],
                course["name"],
                course["sector"],
                course["job_role"],
                course["min_education"],
                course["nsqf_level"],
                course["description"],
                skills_json,
                salary_str,
            ),
        )
        count += 1

    conn.commit()
    conn.close()
    print(f"✅ Loaded {count} courses from {filepath}")
    return count


def get_all_courses() -> list[dict]:
    """
    Get every course from the database.

    Returns:
        A list of dictionaries, one per course. Example:
        [
            {"id": 1, "name": "Assistant Electrician", "sector": "Electrical", ...},
            {"id": 2, "name": "Plumber General", ...},
        ]
    """
    conn = get_connection()
    rows = conn.execute("SELECT * FROM courses ORDER BY id").fetchall()
    conn.close()

    # Convert each database row into a plain dictionary
    courses = []
    for row in rows:
        course = dict(row)  # Convert sqlite3.Row → dict
        # Parse the skills JSON string back into a Python list
        course["skills"] = json.loads(course["skills"])
        courses.append(course)

    return courses


def get_course_by_id(course_id: int) -> Optional[dict]:
    """
    Get one specific course by its ID.

    Args:
        course_id: The course ID number.

    Returns:
        A dictionary with course data, or None if not found.
    """
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM courses WHERE id = ?", (course_id,)
    ).fetchone()
    conn.close()

    if row is None:
        return None

    course = dict(row)
    course["skills"] = json.loads(course["skills"])
    return course


def get_courses_by_sector(sector: str) -> list[dict]:
    """
    Get all courses in a specific sector (e.g. "Healthcare", "Construction").

    Uses LIKE for case-insensitive partial matching, so
    "health" will match "Healthcare".
    """
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM courses WHERE sector LIKE ? ORDER BY id",
        (f"%{sector}%",),
    ).fetchall()
    conn.close()

    courses = []
    for row in rows:
        course = dict(row)
        course["skills"] = json.loads(course["skills"])
        courses.append(course)
    return courses


def query_courses_by_nsqf_and_skills(
    estimated_level_range: str,
    skills: list[str],
    role_or_sector: Optional[str] = None,
    pathway_preference: Optional[str] = None,
    traditional_occupation: Optional[str] = None,
    education_level: Optional[str] = None,
    district: Optional[str] = None,
    limit: int = 10,
) -> list[dict]:
    """
    Directly queries the SQLite 'courses' table filtered by the candidate's
    estimated NSQF level, stated skills, traditional occupation, pathway preference
    (self-employment vs wage), and education level.

    Returns exactly 9 to 10 authentic courses from the database.
    """
    # 1. Determine target NSQF levels from estimated range
    lvl_str = (estimated_level_range or "3").lower()
    target_levels = []
    if "1" in lvl_str and "2" not in lvl_str:
        target_levels = [1, 2, 3]
    elif "2.5" in lvl_str or "3" in lvl_str:
        target_levels = [3, 4, 2]
    elif "3.5" in lvl_str or "4" in lvl_str:
        target_levels = [4, 3, 5]
    elif "4.5" in lvl_str or "5" in lvl_str:
        target_levels = [5, 4, 3]
    elif "2" in lvl_str:
        target_levels = [2, 3, 4]
    else:
        target_levels = [3, 4, 2, 5]

    primary_level = target_levels[0] if target_levels else 3

    conn = get_connection()
    rows = conn.execute("SELECT * FROM courses").fetchall()
    conn.close()

    if not rows:
        return []

    # Clean inputs
    clean_skills = [s.lower().strip() for s in skills if s and s.strip()]
    role_lower = (role_or_sector or "").lower()
    trad_lower = (traditional_occupation or "").lower()
    pref_lower = (pathway_preference or "").lower()
    edu_lower = (education_level or "").lower()

    # Multilingual Keyword Translation Map (Telugu & Hindi -> Sector/Domain concepts)
    INDIC_DOMAIN_MAP = {
        # Agriculture / Dairy / Poultry
        "వ్యవసాయం": "agriculture farming organic crop",
        "రైతు": "farmer agriculture grower",
        "పొలం": "farm agriculture field",
        "గేదెలు": "dairy animal cattle milk",
        "ఆవులు": "dairy cattle farm animal",
        "కోళ్లు": "poultry farm bird",
        "తోట": "gardener horticulture floriculturist",
        "खेती": "agriculture farming crop",
        "किसान": "farmer agriculture grower",
        "डेयरी": "dairy milk cattle animal",
        "मुर्गी": "poultry farm bird",
        "बागवानी": "gardener horticulture floriculturist",
        # Textiles / Handloom / Tailoring
        "చేనేత": "handloom weaver textiles fabric",
        "మగ్గం": "loom handloom weaver",
        "కుట్టు": "sewing tailor garment apparel",
        "టైలర్": "tailor sewing garment",
        "వస్త్రాలు": "apparel textiles fabric garment",
        "बुनकर": "weaver handloom textiles",
        "हथकरघा": "handloom weaver textiles",
        "सिलाई": "sewing tailor apparel garment",
        "दर्जी": "tailor sewing apparel",
        # Construction / Masonry / Plumbing
        "మేస్త్రీ": "mason construction brick building",
        "తాపీ": "mason plastering construction",
        "ప్లంబర్": "plumber plumbing pipe fixture",
        "పైపులు": "plumber pipe fitting",
        "వెల్డింగ్": "welder fabrication steel",
        "కార్పెంటర్": "carpenter wood construction",
        "मिस्त्री": "mason construction brick",
        "राजमिस्त्री": "mason brick construction",
        "प्लंबर": "plumber pipe fitting",
        # Electrical / Solar / Electronics / Mechanics
        "ఎలక్ట్రీషియన్": "electrician wiring electrical power",
        "వైరింగ్": "wiring electrician electrical",
        "సోలార్": "solar photovoltaic green energy",
        "మొబైల్": "mobile phone hardware repair electronics",
        "మెకానిక్": "mechanic automotive vehicle repair",
        "బైక్": "two wheeler automotive bike service",
        "ఇవి": "electric vehicle ev battery",
        "इलेक्ट्रीशियन": "electrician wiring electrical",
        "सौर": "solar photovoltaic green energy",
        "सोलर": "solar photovoltaic green energy",
        "मोबाइल": "mobile repair electronics phone",
        "मैकेनिक": "mechanic automotive service",
        # Healthcare & Sanitation
        "ఆసుపత్రి": "hospital healthcare patient assistant",
        "నర్సింగ్": "nursing healthcare general duty",
        "సఫాయి": "safai sanitation cleaning hygiene",
        "పరిశుభ్రత": "hygiene sanitation cleaning",
        "अस्पताल": "hospital healthcare patient",
        "सफाई": "safai sanitation cleaning",
        # Beauty & Salon
        "బ్యూటీ": "beauty therapist parlour salon grooming",
        "సెలూన్": "salon hair stylist beauty wellness",
        "జుట్టు": "hair stylist salon hairdresser",
        "ब्यूटी": "beauty therapist salon parlour",
        "सैलून": "salon hair stylist hairdresser",
        # IT / Data Entry / Office
        "కంప్యూటర్": "computer data entry ites office",
        "టైపింగ్": "typing data entry computer",
        "హోటల్": "hotel front office hospitality steward",
        "कंप्यूटर": "computer data entry ites",
        "टाइपिंग": "typing data entry computer",
        "होटल": "hotel hospitality front office",
    }

    # Expand role/trad keywords using domain map
    search_context = f"{role_lower} {trad_lower} {' '.join(clean_skills)}"
    for term, exp in INDIC_DOMAIN_MAP.items():
        if term in search_context:
            search_context += f" {exp}"

    is_self_emp = any(w in pref_lower for w in ["self", "business", "సొంత", "వ్యాపారం", "దుకాణం", "व्यवसाय", "दुकान", "entrepreneur"])
    is_wage_emp = any(w in pref_lower for w in ["wage", "job", "ఉద్యోగం", "జాబ్", "నౌకరీ", "नौकरी", "direct"])

    scored_courses = []
    for r in rows:
        c = dict(r)
        c["skills"] = json.loads(c["skills"]) if isinstance(c["skills"], str) else c.get("skills", [])
        c_allied = json.loads(c.get("traditional_allied_skills", "[]")) if isinstance(c.get("traditional_allied_skills"), str) else c.get("traditional_allied_skills", [])
        
        course_lvl = c.get("nsqf_level", 3)
        course_skills = [s.lower() for s in c.get("skills", [])]
        course_name = c.get("name", "").lower()
        course_role = c.get("job_role", "").lower()
        course_sector = c.get("sector", "").lower()
        course_desc = c.get("description", "").lower()
        course_pathway = (c.get("pathway_type") or "wage_employment").lower()
        allied_tokens = [a.lower() for a in c_allied]

        score = 0.0

        # 1. Level proximity scoring (0-10 pts)
        if course_lvl == primary_level:
            score += 10.0
        elif course_lvl in target_levels:
            score += 6.0
        else:
            diff = abs(course_lvl - primary_level)
            score += max(0.0, 3.0 - diff)

        # 2. Pathway Alignment (Self-employment vs Wage) (+12 pts)
        if is_self_emp:
            if course_pathway == "self_employment" or "farmer" in course_name or "tailor" in course_name or "artisan" in course_name or "repair" in course_name or "stylist" in course_name:
                score += 12.0
            else:
                score -= 3.0
        elif is_wage_emp:
            if course_pathway == "wage_employment":
                score += 10.0

        # 3. Traditional Family Occupation & Stated Work Matching (+15 pts)
        for token in search_context.replace(",", " ").replace(".", " ").split():
            token_clean = token.strip()
            if len(token_clean) >= 3:
                if any(token_clean in a for a in allied_tokens):
                    score += 15.0
                if token_clean in course_name or token_clean in course_role:
                    score += 10.0
                elif token_clean in course_sector:
                    score += 7.0
                elif any(token_clean in s for s in course_skills):
                    score += 4.0
                elif token_clean in course_desc:
                    score += 2.0

        # 4. Education requirement matching (+5 pts)
        min_edu = (c.get("min_education") or "").lower()
        if "5th" in edu_lower and "5th" in min_edu:
            score += 5.0
        elif "8th" in edu_lower and ("8th" in min_edu or "5th" in min_edu):
            score += 5.0
        elif ("10th" in edu_lower or "12th" in edu_lower or "iti" in edu_lower) and ("10th" in min_edu or "8th" in min_edu or "5th" in min_edu):
            score += 4.0

        c["fit_score"] = round(score, 2)
        scored_courses.append(c)

    # Sort descending by score, then by fit
    scored_courses.sort(key=lambda x: (x["fit_score"], -abs(x.get("nsqf_level", 3) - primary_level)), reverse=True)

    # Return top 9 or 10 real items
    target_count = min(len(scored_courses), max(9, limit))
    selected = scored_courses[:target_count]

    return selected


# ═══════════════════════════════════════════════════════════════
# USER OPERATIONS
# ═══════════════════════════════════════════════════════════════

def add_user(user: User) -> int:
    """
    Add a new user to the database.

    Args:
        user: A User object from models.py

    Returns:
        The new user's ID number.
    """
    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO users
            (name, age, gender, caste_category, state, district,
             education_level, annual_income, language, skills, interests)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user.name,
            user.age,
            user.gender,
            user.caste_category,
            user.state,
            user.district,
            user.education_level,
            user.annual_income,
            user.language,
            json.dumps(user.skills),
            json.dumps(user.interests),
        ),
    )
    user_id = cursor.lastrowid  # SQLite gives us the auto-generated ID
    conn.commit()
    conn.close()
    return user_id


def get_user_by_id(user_id: int) -> Optional[dict]:
    """Get one user by their ID. Returns None if not found."""
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    if row is None:
        return None

    user = dict(row)
    user["skills"] = json.loads(user["skills"])
    user["interests"] = json.loads(user["interests"])
    return user


def update_user(user_id: int, updates: dict) -> Optional[dict]:
    """
    Update an existing user's profile in the database.
    Returns the updated user dict, or None if not found.
    """
    conn = get_connection()
    existing = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if not existing:
        conn.close()
        return None

    fields = []
    values = []
    for key, val in updates.items():
        if key in ["skills", "interests"] and isinstance(val, list):
            fields.append(f"{key} = ?")
            values.append(json.dumps(val))
        elif key in [
            "name", "age", "gender", "caste_category", "state", "district",
            "education_level", "annual_income", "language"
        ]:
            fields.append(f"{key} = ?")
            values.append(val)

    if fields:
        values.append(user_id)
        sql = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
        conn.execute(sql, tuple(values))
        conn.commit()

    conn.close()
    return get_user_by_id(user_id)


def get_all_users() -> list[dict]:
    """Get all users from the database."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM users ORDER BY id").fetchall()
    conn.close()

    users = []
    for row in rows:
        user = dict(row)
        user["skills"] = json.loads(user["skills"])
        user["interests"] = json.loads(user["interests"])
        users.append(user)
    return users


def load_users_from_json(filepath: str) -> int:
    """
    Load demo users from a JSON file into the database.

    Args:
        filepath: Path to the JSON file (e.g. "data/seed_users.json")

    Returns:
        Number of users loaded.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        users_data = json.load(f)

    count = 0
    for user_data in users_data:
        user = User(**user_data)
        add_user(user)
        count += 1

    print(f"✅ Loaded {count} demo users from {filepath}")
    return count


# ═══════════════════════════════════════════════════════════════
# RECOMMENDATION OPERATIONS
# ═══════════════════════════════════════════════════════════════

def save_recommendation(rec: Recommendation) -> int:
    """Save a course recommendation to the database. Returns the recommendation ID."""
    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO recommendations (user_id, course_id, score, reason)
        VALUES (?, ?, ?, ?)
        """,
        (rec.user_id, rec.course_id, rec.score, rec.reason),
    )
    rec_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return rec_id


def save_recommendation_with_trace(
    user_id: int,
    course_id: int,
    score: float,
    reason: str,
    trace: dict,
) -> int:
    """
    Save a course recommendation along with its full auditable decision trace.
    (Phase 12: Decision Trace / Auditability).
    """
    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO recommendations (user_id, course_id, score, reason, trace)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, course_id, score, reason, json.dumps(trace)),
    )
    rec_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return rec_id


def get_recommendation_by_id(rec_id: int) -> Optional[dict]:
    """Get one recommendation by ID, automatically parsing JSON trace if present."""
    conn = get_connection()
    row = conn.execute("SELECT * FROM recommendations WHERE id = ?", (rec_id,)).fetchone()
    conn.close()
    if not row:
        return None
    res = dict(row)
    if "trace" in res and res["trace"]:
        try:
            res["trace"] = json.loads(res["trace"])
        except Exception:
            pass
    return res


def get_recommendations_for_user(user_id: int) -> list[dict]:
    """Get all recommendations given to a specific user, newest first."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT r.*, c.name as course_name, c.sector, c.nsqf_level
        FROM recommendations r
        JOIN courses c ON r.course_id = c.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        """,
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# ═══════════════════════════════════════════════════════════════
# FEEDBACK OPERATIONS (Phase 11)
# ═══════════════════════════════════════════════════════════════
# ┌─────────────────────────────────────────────────────────────┐
# │ EXPLICIT ARCHITECTURAL DOCUMENTATION:                       │
# │ Feedback is future training data for MLMatcher. The current │
# │ EmbeddingMatcher does NOT train on this data.               │
# │                                                             │
# │ CRITICAL RULES:                                             │
# │ 1. Do NOT train any ML model yet.                           │
# │ 2. Do NOT let feedback alter eligibility rules.             │
# │ 3. Do NOT let feedback directly alter ranking during this   │
# │    prototype phase.                                         │
# └─────────────────────────────────────────────────────────────┘

def save_feedback(
    fb: Optional[Feedback] = None,
    recommendation_id: Optional[int] = None,
    accepted: bool = False,
    outcome_note: str = "",
    user_id: Optional[int] = None,
    rating: Optional[int] = None,
    comment: str = "",
) -> int:
    """
    Save user feedback on a course recommendation. Returns the feedback ID.

    Accepts either a Feedback model instance, or keyword arguments:
        recommendation_id: Which recommendation is being rated/updated
        accepted: True if user enrolled/accepted, False otherwise
        outcome_note: Text notes on real-world outcome
        user_id: Optional user ID (resolved from recommendations table if omitted)

    NOTE: Feedback stored here is purely collected for future ML model training.
    It does NOT modify current eligibility checks or embedding ranking.
    """
    # If a Feedback model was passed, extract values
    if fb is not None:
        rec_id = fb.recommendation_id
        is_accepted = 1 if fb.accepted else 0
        note = fb.outcome_note or ""
        u_id = fb.user_id
        r_rating = fb.rating
        c_comment = fb.comment or ""
    else:
        if recommendation_id is None:
            raise ValueError("recommendation_id is required.")
        rec_id = recommendation_id
        is_accepted = 1 if accepted else 0
        note = outcome_note or ""
        u_id = user_id
        r_rating = rating
        c_comment = comment or ""

    conn = get_connection()

    # If user_id is not provided, attempt to look it up from recommendations table
    if u_id is None:
        rec_row = conn.execute(
            "SELECT user_id FROM recommendations WHERE id = ?", (rec_id,)
        ).fetchone()
        if rec_row:
            u_id = rec_row["user_id"]

    cursor = conn.execute(
        """
        INSERT INTO feedback (user_id, recommendation_id, accepted, outcome_note, rating, comment)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (u_id, rec_id, is_accepted, note, r_rating, c_comment),
    )
    fb_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return fb_id


def get_feedback_by_id(feedback_id: int) -> Optional[dict]:
    """Get a single feedback entry by ID."""
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM feedback WHERE id = ?", (feedback_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    res = dict(row)
    res["accepted"] = bool(res["accepted"])
    return res


def get_all_feedback() -> list[dict]:
    """Get all feedback entries from the database (newest first)."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM feedback ORDER BY id DESC"
    ).fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["accepted"] = bool(d["accepted"])
        results.append(d)
    return results


# ═══════════════════════════════════════════════════════════════
# VOICE ASSESSMENT OPERATIONS
# ═══════════════════════════════════════════════════════════════

def save_voice_assessment_answer(
    session_id: str,
    user_id: Optional[int],
    step_number: int,
    question_id: str,
    question_text: str,
    answer_text: str,
    language: str = "en",
) -> int:
    """
    Save a single turn's answer in the voice assessment.
    Returns the newly inserted row ID.
    """
    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO voice_assessment_answers
            (session_id, user_id, step_number, question_id, question_text, answer_text, language)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (session_id, user_id, step_number, question_id, question_text, answer_text, language),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id


def get_voice_assessment_answers(session_id: str) -> list[dict]:
    """
    Retrieve all answers recorded for a given voice assessment session,
    ordered sequentially by step number.
    """
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT * FROM voice_assessment_answers
        WHERE session_id = ?
        ORDER BY step_number ASC, id ASC
        """,
        (session_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_latest_voice_session(user_id: int) -> Optional[str]:
    """Get the most recent session_id for a user, if any."""
    conn = get_connection()
    row = conn.execute(
        """
        SELECT session_id FROM voice_assessment_answers
        WHERE user_id = ?
        ORDER BY id DESC LIMIT 1
        """,
        (user_id,),
    ).fetchone()
    conn.close()
    return row["session_id"] if row else None


# ═══════════════════════════════════════════════════════════════
# SELF-EMPLOYMENT & GOVERNMENT SCHEMES OPERATIONS
# ═══════════════════════════════════════════════════════════════

def seed_self_employment_data(conn: sqlite3.Connection):
    """
    Seed verified government enterprise schemes and micro-enterprise pathways.
    Enforces strict anti-hallucination boundary: schemes and indicative investments
    come strictly from verified database records.
    """
    schemes_count = conn.execute("SELECT COUNT(*) FROM government_schemes").fetchone()[0]
    if schemes_count == 0:
        schemes = [
            (
                1,
                "PM-AJAY GIA Component (Capital Subsidy)",
                "Ministry of Social Justice and Empowerment, Government of Bharat",
                "Direct capital subsidy and tool kit assistance for income-generating micro-enterprises and self-employment units for Scheduled Caste beneficiaries.",
                "Promote viable self-employment and sustainable family income generation for SC candidates.",
                json.dumps([
                    "Candidate belongs to Scheduled Caste (SC) category",
                    "Annual family income <= ₹3,00,000 / year",
                    "Age between 18 and 45 years",
                    "Vocational or NSQF certification completed"
                ]),
                "Capital Subsidy (Up to 50% project cost or ₹50,000) + Free Skilling",
                "₹50,000 direct subsidy",
                "https://socialjustice.gov.in/schemes/pm-ajay",
                1,
                "Ministry of Social Justice & Empowerment Official Portal",
                json.dumps(["home_based", "small_unit", "mobile_service"]),
                json.dumps(["tailoring", "electrical", "solar", "plumbing", "mechanic", "carpentry", "food_processing", "handicrafts"]),
                json.dumps({
                    "te": {
                        "name": "పీఎం-అజయ్ GIA భాగస్వామ్య రాయితీ పథకం",
                        "desc": "ఎస్సీ లబ్ధిదారులకు స్వయం ఉపాధి మరియు సూక్ష్మ వ్యాపారాల కోసం గరిష్టంగా ₹50,000 ప్రత్యక్ష సబ్సిడీ మరియు ఉచిత నైపుణ్య శిక్షణ.",
                        "purpose": "ఎస్సీ కుటుంబాలకు శాశ్వత జీవనోపాధి మరియు స్వయం ఉపాధి కల్పన."
                    },
                    "hi": {
                        "name": "पीएम-अजय जीआईए पूंजी सब्सिडी घटक",
                        "desc": "अनुसूचित जाति के लाभार्थियों के लिए स्वरोजगार हेतु ₹50,000 तक की प्रत्यक्ष पूंजी सब्सिडी और निःशुल्क कौशल प्रशिक्षण।",
                        "purpose": "एससी परिवारों के लिए स्थायी आजीविका और सूक्ष्म उद्यम विकास।"
                    }
                })
            ),
            (
                2,
                "PM Vishwakarma Scheme",
                "Ministry of Micro, Small and Medium Enterprises (MSME)",
                "End-to-end support for traditional artisans and craftspersons across 18 family trades with modern tool kits and collateral-free enterprise credit.",
                "Enhance capability, productivity, and market linkage of traditional trade craftspersons.",
                json.dumps([
                    "Practicing one of 18 identified traditional family trades (Tailor, Carpenter, Electrician, Plumber, etc.)",
                    "Minimum age 18 years",
                    "No active default under central/state government credit schemes"
                ]),
                "₹15,000 Tool Kit E-Voucher + Collateral-Free Loan up to ₹3 Lakh at 5% interest",
                "₹15,000 tool voucher + ₹3,00,000 concessional loan",
                "https://pmvishwakarma.gov.in",
                1,
                "Ministry of MSME, Government of Bharat",
                json.dumps(["home_based", "small_unit", "mobile_service"]),
                json.dumps(["tailoring", "carpentry", "electrical", "plumbing", "mechanic", "handicrafts"]),
                json.dumps({
                    "te": {
                        "name": "పీఎం విశ్వకర్మ యోజన",
                        "desc": "చేతివృత్తుల వారికి ₹15,000 విలువైన ఆధునిక పనిముట్ల ఈ-వోచర్ మరియు 5% వడ్డీతో ₹3 లక్షల వరకు పూచీకత్తు లేని రుణం.",
                        "purpose": "సాంప్రదాయ వృత్తి నిపుణుల సాధికారత మరియు ఆధునిక సాంకేతికత పరికరాల మద్దతు."
                    },
                    "hi": {
                        "name": "पीएम विश्वकर्मा योजना",
                        "desc": "पारंपरिक कारीगरों के लिए ₹15,000 का आधुनिक टूलकिट ई-वाउचर और 5% ब्याज पर ₹3 लाख तक का बिना गारंटी ऋण।",
                        "purpose": "पारंपरिक कारीगरों की उत्पादकता और बाजार पहुंच में वृद्धि।"
                    }
                })
            ),
            (
                3,
                "PMEGP (Prime Minister's Employment Generation Programme)",
                "Ministry of MSME & Khadi and Village Industries Commission (KVIC)",
                "Credit-linked margin money subsidy scheme to generate non-farm micro-enterprises in rural and semi-urban clusters.",
                "Encourage micro-enterprise establishment with high government subsidy support.",
                json.dumps([
                    "Individual above 18 years of age",
                    "8th pass for project cost exceeding ₹10 Lakh (Mfg) / ₹5 Lakh (Service)",
                    "Special Category (SC/ST/Rural) eligible for 35% margin money subsidy in rural areas"
                ]),
                "25% to 35% Capital Margin Money Subsidy through Public Sector Banks",
                "Up to ₹17.5 Lakh subsidy (35% of ₹50L manufacturing project)",
                "https://www.kviconline.gov.in/pmegpeportal/",
                1,
                "KVIC Official Portal",
                json.dumps(["small_unit"]),
                json.dumps(["tailoring", "electrical", "solar", "carpentry", "food_processing", "mechanic"]),
                json.dumps({
                    "te": {
                        "name": "పీఎంఈజీపీ (ప్రధాన మంత్రి ఉపాధి కల్పన పథకం)",
                        "desc": "గ్రామీణ ప్రాంతాల ఎస్సీ వర్గాలకు కొత్త వ్యాపార ప్రాజెక్టు ఖర్చుపై 35% వరకు సబ్సిడీ మరియు బ్యాంకు రుణం.",
                        "purpose": "గ్రామీణ సూక్ష్మ పరిశ్రమల స్థాపన మరియు స్వయం ఉపాధి కల్పన."
                    },
                    "hi": {
                        "name": "पीएमईजीपी (प्रधानमंत्री रोजगार सृजन कार्यक्रम)",
                        "desc": "ग्रामीण क्षेत्रों में एससी लाभार्थियों के लिए परियोजना लागत पर 35% तक मार्जिन मनी सब्सिडी।",
                        "purpose": "सूक्ष्म उद्यमों की स्थापना और रोजगार सृजन।"
                    }
                })
            ),
            (
                4,
                "Pradhan Mantri MUDRA Yojana (Shishu & Kishore)",
                "Department of Financial Services, Ministry of Finance",
                "Collateral-free micro-enterprise institutional finance for small service providers, shops, repair clinics, and local artisans.",
                "Provide seamless formal credit to micro-enterprises without mortgage requirements.",
                json.dumps([
                    "Indian citizen with viable self-employment or business plan",
                    "Non-corporate small business segment (proprietorship, partnership)",
                    "Clean credit track record with bank"
                ]),
                "Collateral-Free Working Capital & Equipment Term Loan",
                "Shishu: up to ₹50,000 | Kishore: ₹50,000 to ₹5,00,000",
                "https://www.mudra.org.in",
                1,
                "MUDRA / Department of Financial Services, GoI",
                json.dumps(["home_based", "small_unit", "mobile_service"]),
                json.dumps(["tailoring", "electrical", "solar", "plumbing", "mechanic", "carpentry", "food_processing", "handicrafts"]),
                json.dumps({
                    "te": {
                        "name": "పీఎం ముద్ర యోజన (శిశు & కిశోర్)",
                        "desc": "పూచీకత్తు లేకుండా ₹50,000 నుండి ₹5 లక్షల వరకు చిన్న వ్యాపారాలకు సులభమైన బ్యాంకు రుణం.",
                        "purpose": "పరికరాల కొనుగోలు మరియు రోజువారీ వ్యాపార మూలధనం."
                    },
                    "hi": {
                        "name": "प्रधानमंत्री मुद्रा योजना (शिशु और किशोर)",
                        "desc": "बिना गारंटी ₹50,000 से ₹5 लाख तक का माइक्रो-एंटरप्राइज बैंक ऋण।",
                        "purpose": "उपकरण खरीद और कार्यशील पूंजी सहायता।"
                    }
                })
            ),
            (
                5,
                "Stand-Up India Scheme",
                "Department of Financial Services, Ministry of Finance & SIDBI",
                "Enterprise bank credit between ₹10 lakh and ₹1 crore to Scheduled Caste (SC) entrepreneurs for greenfield ventures.",
                "Support SC entrepreneurship in manufacturing, services, or trading.",
                json.dumps([
                    "Borrower must belong to Scheduled Caste (SC) or Scheduled Tribe (ST)",
                    "Enterprise must be a greenfield (first-time venture)",
                    "In case of non-individual enterprises, 51% shareholding by SC/ST"
                ]),
                "Composite Bank Loan (Term Loan + Working Capital) covering up to 85% of project cost",
                "₹10 Lakh to ₹1 Crore",
                "https://www.standupmitra.in",
                1,
                "Stand-Up Mitra / SIDBI",
                json.dumps(["small_unit"]),
                json.dumps(["tailoring", "electrical", "solar", "carpentry", "food_processing", "mechanic"]),
                json.dumps({
                    "te": {
                        "name": "స్టాండ్-అప్ ఇండియా పథకం",
                        "desc": "ఎస్సీ ఔత్సాహిక పారిశ్రామికవేత్తలకు కొత్త వ్యాపారాల స్థాపనకు ₹10 లక్షల నుండి ₹1 కోటి వరకు బ్యాంక్ లోన్.",
                        "purpose": "ఎస్సీ పారిశ్రామికవేత్తల ఆధ్వర్యంలో విస్తృత స్థాయి వ్యాపార యూనిట్ల స్థాపన."
                    },
                    "hi": {
                        "name": "स्टैंड-अप इंडिया योजना",
                        "desc": "अनुसूचित जाति के उद्यमियों को नए उद्यम के लिए ₹10 लाख से ₹1 करोड़ तक का बैंक ऋण।",
                        "purpose": "एससी समुदाय के उद्यमियों के लिए हरित उद्यम विकास।"
                    }
                })
            )
        ]

        conn.executemany("""
            INSERT INTO government_schemes (
                id, scheme_name, ministry, description, purpose,
                eligibility_criteria, support_type, max_subsidy_amount,
                official_url, is_verified, source, applicable_business_types,
                applicable_trades, translations
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, schemes)

    pathways_count = conn.execute("SELECT COUNT(*) FROM business_pathways").fetchone()[0]
    if pathways_count == 0:
        pathways = [
            # ── TAILORING PATHWAYS ──
            (
                1,
                "tailoring",
                "Home-Based Tailoring & Alteration Service",
                "home_based",
                "Operate a flexible home-based tailoring service offering custom stitching of blouses, salwar suits, school uniforms, and local alteration services.",
                "Neighborhood families, working women, local school students, festive custom wear seekers.",
                "Order-based custom stitching and alterations from home workspace.",
                json.dumps(["Garment Stitching", "Sewing Machine Operation", "Body Measurement", "Hand Finishing"]),
                json.dumps(["Designer Pattern Cutting", "Blouse Neck Finishing", "Cost Calculation", "Digital UPI Payments"]),
                5,  # Sewing Machine Operator course
                "Sewing Machine Operator",
                3,
                json.dumps([
                    {"name": "Heavy-Duty Motorized Sewing Machine", "category": "Machine", "indicative_cost": "₹9,000 - ₹14,000", "icon": "🧵"},
                    {"name": "Tailoring Shears & Rotary Cutter Set", "category": "Tool", "indicative_cost": "₹800 - ₹1,500", "icon": "✂️"},
                    {"name": "Professional Measurement Tape & Curve Rulers", "category": "Tool", "indicative_cost": "₹400 - ₹800", "icon": "📏"},
                    {"name": "Electric Steam Iron & Padded Pressing Board", "category": "Workspace", "indicative_cost": "₹1,800 - ₹2,800", "icon": "🪑"},
                    {"name": "Starter Thread, Needle & Interlining Kit", "category": "Materials", "indicative_cost": "₹1,500 - ₹2,500", "icon": "📦"}
                ]),
                json.dumps({
                    "equipment_cost": "₹12,000 - ₹19,000",
                    "materials_cost": "₹2,500 - ₹4,000",
                    "setup_cost": "₹1,500 - ₹3,000",
                    "total_indicative_cost": "₹16,000 - ₹26,000",
                    "currency": "INR",
                    "disclaimer": "Indicative Estimate. Actual costs may vary by location, supplier, and business scale."
                }),
                json.dumps({
                    "te": {
                        "title": "ఇంటి వద్ద టైలరింగ్ మరియు ఆల్టరేషన్ సేవలు",
                        "desc": "ఇంటి వద్దే ఉంటూ బ్లౌజ్‌లు, డ్రెస్సులు, యూనిఫామ్‌లు కుట్టడం మరియు ఆల్టరేషన్ చేయడం ద్వారా స్థిరమైన రోజువారీ ఆదాయం పొందవచ్చు.",
                        "customers": "స్థానిక నివాసితులు, మహిళలు, విద్యార్థులు."
                    },
                    "hi": {
                        "title": "घर पर सिलाई एवं ऑल्टरेशन सेवा",
                        "desc": "घर से सिलाई सेवा शुरू करके ब्लाउज, सूट, यूनिफॉर्म और कपड़ों की मरम्मत से नियमित दैनिक आय अर्जित करें।",
                        "customers": "स्थानीय परिवार, कामकाजी महिलाएं और छात्र।"
                    }
                })
            ),
            (
                2,
                "tailoring",
                "Custom Designer Boutique & Small Garment Unit",
                "small_unit",
                "Establish a dedicated high-volume tailoring and boutique studio equipped with zig-zag embroidery and buttonhole finishing.",
                "Boutique clients, bridal wear seekers, readymade garment retailers, local colleges.",
                "Retail shopfront + customized designer garment manufacturing.",
                json.dumps(["Sewing Machine Operation", "Pattern Drafting", "Measurement Taking"]),
                json.dumps(["Bridal Work & Embroidery", "Batch Production", "Staff Management", "Inventory Control"]),
                5,
                "Sewing Machine Operator",
                3,
                json.dumps([
                    {"name": "Industrial Lockstitch Sewing Machine (Direct Drive)", "category": "Machine", "indicative_cost": "₹18,000 - ₹25,000", "icon": "🧵"},
                    {"name": "3-Thread Overlock & Pico Machine", "category": "Machine", "indicative_cost": "₹14,000 - ₹20,000", "icon": "⚙️"},
                    {"name": "Cutting Table & Measuring Master Suite", "category": "Workspace", "indicative_cost": "₹6,000 - ₹10,000", "icon": "📏"},
                    {"name": "Mannequin Dress Form & Display Rack", "category": "Workspace", "indicative_cost": "₹4,000 - ₹7,000", "icon": "👗"},
                    {"name": "Fabric, Zips, Buttons & Thread Inventory", "category": "Materials", "indicative_cost": "₹10,000 - ₹18,000", "icon": "📦"}
                ]),
                json.dumps({
                    "equipment_cost": "₹42,000 - ₹62,000",
                    "materials_cost": "₹10,000 - ₹18,000",
                    "setup_cost": "₹8,000 - ₹15,000",
                    "total_indicative_cost": "₹60,000 - ₹95,000",
                    "currency": "INR",
                    "disclaimer": "Indicative Estimate. Actual costs may vary by location, supplier, and business scale."
                }),
                json.dumps({
                    "te": {
                        "title": "కస్టమ్ డిజైనర్ బోటిక్ & టైలరింగ్ యూనిట్",
                        "desc": "ఆధునిక పీకో మరియు ఎంబ్రాయిడరీ మిషన్లతో సొంత దుకాణంలో డిజైనర్ బట్టల వ్యాపార యూనిట్.",
                        "customers": "పెళ్లి బట్టలు, బొటీక్ కస్టమర్లు మరియు దుస్తుల రిటైలర్లు."
                    },
                    "hi": {
                        "title": "कस्टम डिज़ाइनर बुटीक एवं सिलाई यूनिट",
                        "desc": "औद्योगिक सिलाई और पीको मशीनों के साथ खुद की बुटीक दुकान और परिधान निर्माण यूनिट।",
                        "customers": "शादी-समारोह के ग्राहक, बुटीक खरीदार।"
                    }
                })
            ),

            # ── ELECTRICAL PATHWAYS ──
            (
                3,
                "electrical",
                "Domestic Electrical Repair & Doorstep Service",
                "mobile_service",
                "On-demand doorstep electrician enterprise handling domestic wiring, MCB tripping, fan rewinding, inverter setup, and pump repairs.",
                "Homeowners, apartment societies, small commercial shops, local offices.",
                "Mobile on-call repair service, emergency visits, and scheduled installation appointments.",
                json.dumps(["Domestic Wiring", "Switchboard Repair", "Continuity Testing", "Earthing Setup"]),
                json.dumps(["Load Calculation", "Inverter Battery Diagnostics", "Job Billing", "Safety Certification"]),
                1,  # Assistant Electrician
                "Assistant Electrician",
                4,
                json.dumps([
                    {"name": "True-RMS Digital Multimeter & Voltage Probe", "category": "Tool", "indicative_cost": "₹1,800 - ₹3,200", "icon": "⚡"},
                    {"name": "Rotary Hammer Drill Machine & Masonry Bits", "category": "Machine", "indicative_cost": "₹4,500 - ₹7,500", "icon": "🔨"},
                    {"name": "Heavy-Duty Insulated Pliers, Cutters & Crimpers", "category": "Tool", "indicative_cost": "₹1,200 - ₹2,000", "icon": "🔧"},
                    {"name": "1000V Certified Rubber Safety Gloves & Boots", "category": "Safety", "indicative_cost": "₹1,500 - ₹2,500", "icon": "🛡️"},
                    {"name": "Fuses, Wires, Capacitors & Switch Spares Starter Kit", "category": "Materials", "indicative_cost": "₹3,000 - ₹5,000", "icon": "📦"}
                ]),
                json.dumps({
                    "equipment_cost": "₹12,000 - ₹18,000",
                    "materials_cost": "₹3,000 - ₹5,000",
                    "setup_cost": "₹2,000 - ₹4,000",
                    "total_indicative_cost": "₹17,000 - ₹27,000",
                    "currency": "INR",
                    "disclaimer": "Indicative Estimate. Actual costs may vary by location, supplier, and business scale."
                }),
                json.dumps({
                    "te": {
                        "title": "గృహ విద్యుత్ మరమ్మతు & డోర్‌స్టెప్ సర్వీస్",
                        "desc": "గృహ వైరింగ్, ఇన్వర్టర్ అమరిక, ఫ్యాన్లు మరియు మోటార్ల మరమ్మతులకు నేరుగా కస్టమర్ ఇంటి వద్ద సేవలు అందించే యూనిట్.",
                        "customers": "ఇళ్ల యజమానులు, అపార్ట్‌మెంట్లు, చిన్న వ్యాపార కేంద్రాలు."
                    },
                    "hi": {
                        "title": "घरेलू विद्युत मरम्मत एवं ऑन-कॉल सेवा",
                        "desc": "घर-घर जाकर विद्युत वायरिंग, इन्वर्टर, पंखे और उपकरणों की त्वरित मरम्मत सेवा प्रदान करें।",
                        "customers": "मकान मालिक, आवासीय सोसायटी और दुकानें।"
                    }
                })
            ),
            (
                4,
                "electrical",
                "Electrical Contracting & Retail Spare Parts Center",
                "small_unit",
                "Full-fledged electrical contracting agency and shop providing wiring materials, tube fittings, cables, and contracted building wiring projects.",
                "Builders, civil contractors, commercial renovation projects, rural home construction.",
                "Shopfront sales + project-based contract installations.",
                json.dumps(["Domestic & Commercial Wiring", "Phase Balancing", "Multimeter Use"]),
                json.dumps(["Contract Bidding", "Sub-contractor Management", "GST Invoicing", "Wholesale Sourcing"]),
                1,
                "Assistant Electrician",
                4,
                json.dumps([
                    {"name": "Heavy Wall Chaser Machine & Dust Collector", "category": "Machine", "indicative_cost": "₹12,000 - ₹18,000", "icon": "⚙️"},
                    {"name": "Megger Digital Insulation Resistance Tester", "category": "Tool", "indicative_cost": "₹6,000 - ₹10,000", "icon": "📟"},
                    {"name": "Fiberglass Step Ladders & Safety Harness Kit", "category": "Safety", "indicative_cost": "₹5,000 - ₹8,000", "icon": "🪜"},
                    {"name": "Conduit Benders & Cable Pulling Winches", "category": "Tool", "indicative_cost": "₹4,000 - ₹7,000", "icon": "🔧"},
                    {"name": "Cable Spools, Conduit Pipes & MCB Box Starter Stock", "category": "Materials", "indicative_cost": "₹25,000 - ₹40,000", "icon": "📦"}
                ]),
                json.dumps({
                    "equipment_cost": "₹32,000 - ₹48,000",
                    "materials_cost": "₹25,000 - ₹40,000",
                    "setup_cost": "₹10,000 - ₹20,000",
                    "total_indicative_cost": "₹67,000 - ₹1,08,000",
                    "currency": "INR",
                    "disclaimer": "Indicative Estimate. Actual costs may vary by location, supplier, and business scale."
                }),
                json.dumps({
                    "te": {
                        "title": "ఎలక్ట్రికల్ కాంట్రాక్టింగ్ & స్పేర్ పార్ట్స్ సెంటర్",
                        "desc": "భవనాల వైరింగ్ కాంట్రాక్టులు మరియు ఎలక్ట్రికల్ సామాగ్రి అమ్మకాలతో కూడిన వ్యాపార కేంద్రం.",
                        "customers": "భవన నిర్మాణదారులు, కాంట్రాక్టర్లు, స్థానిక ప్రజలు."
                    },
                    "hi": {
                        "title": "विद्युत ठेकेदारी एवं उपकरण बिक्री केंद्र",
                        "desc": "भवनों की पूर्ण वायरिंग ठेकेदारी और बिजली सामग्री की बिक्री की वाणिज्यिक दुकान।",
                        "customers": "बिल्डर्स, ठेकेदार और नए मकान निर्माता।"
                    }
                })
            ),

            # ── SOLAR ENERGY PATHWAYS ──
            (
                5,
                "solar",
                "Solar Rooftop Installation & Annual Maintenance Unit",
                "mobile_service",
                "Specialized enterprise conducting residential rooftop solar survey, module installation, net metering paperwork, and periodic panel cleaning.",
                "Independent house owners, commercial warehouses, farm pump owners, rural institutions.",
                "Installation turnkey projects + Annual Maintenance Contracts (AMC).",
                json.dumps(["Solar Panel Mounting", "Inverter Connection", "Site Inspection"]),
                json.dumps(["Solar Net Metering Liaising", "Solar Cleaning Pump Operation", "Quotation Drafting"]),
                2,  # Solar PV Installer
                "Solar PV Installer (Suryamitra)",
                4,
                json.dumps([
                    {"name": "Solar Angle Inclinometer & Compass Kit", "category": "Tool", "indicative_cost": "₹1,500 - ₹2,500", "icon": "🧭"},
                    {"name": "DC High-Precision Clamp Meter (600V/1000V)", "category": "Tool", "indicative_cost": "₹3,500 - ₹5,500", "icon": "⚡"},
                    {"name": "MC4 Connector Crimper & Solar Cable Cutters", "category": "Tool", "indicative_cost": "₹2,200 - ₹3,500", "icon": "🔧"},
                    {"name": "Rooftop Fall Protection Harness & Lanyard Kit", "category": "Safety", "indicative_cost": "₹3,000 - ₹5,000", "icon": "🛡️"},
                    {"name": "High-Pressure Telescopic Solar Cleaning Pump", "category": "Machine", "indicative_cost": "₹8,000 - ₹14,000", "icon": "🚿"}
                ]),
                json.dumps({
                    "equipment_cost": "₹20,000 - ₹32,000",
                    "materials_cost": "₹5,000 - ₹9,000",
                    "setup_cost": "₹3,000 - ₹6,000",
                    "total_indicative_cost": "₹28,000 - ₹47,000",
                    "currency": "INR",
                    "disclaimer": "Indicative Estimate. Actual costs may vary by location, supplier, and business scale."
                }),
                json.dumps({
                    "te": {
                        "title": "సోలార్ రూఫ్‌టాప్ ఇన్‌స్టాలేషన్ & మెయింటెనెన్స్ యూనిట్",
                        "desc": "సౌర ప్యానెళ్ల అమరిక, నెట్ మీటరింగ్ సహాయం మరియు క్లీనింగ్ మెయింటెనెన్స్ సేవల వ్యాపారం.",
                        "customers": "ఇళ్ల యజమానులు, వ్యవసాయ పంపులు, వ్యాపార సంస్థలు."
                    },
                    "hi": {
                        "title": "सोलर रूफटॉप इंस्टॉलेशन एवं मेंटेनेंस एजेंसी",
                        "desc": "घरों और दुकानों की छतों पर सोलर पैनल लगाने और नियमित सफाई-रखरखाव की सेवा।",
                        "customers": "घर के मालिक, किसान और व्यावसायिक प्रतिष्ठान।"
                    }
                })
            ),

            # ── PLUMBING PATHWAYS ──
            (
                6,
                "plumbing",
                "Residential Plumbing & Water Purifier Service Agency",
                "mobile_service",
                "Doorstep emergency plumbing repair, CPVC/PPR pipeline laying, sanitary fixtures setup, and RO water purifier servicing.",
                "Residential households, gated communities, restaurants, commercial facilities.",
                "On-call plumbing service, renovation fitting, and filter maintenance contracts.",
                json.dumps(["Pipe Fitting", "Leak Detection", "Tap & Valve Repair"]),
                json.dumps(["PPR Hot Fusion Welding", "Water Pressure Testing", "Customer Booking via WhatsApp"]),
                3,  # Plumber General
                "Plumber General",
                4,
                json.dumps([
                    {"name": "Adjustable Heavy Pipe Wrenches (10\" & 14\") Set", "category": "Tool", "indicative_cost": "₹1,200 - ₹2,000", "icon": "🔧"},
                    {"name": "PPR Socket Fusion Welding Machine", "category": "Machine", "indicative_cost": "₹2,500 - ₹4,500", "icon": "🔥"},
                    {"name": "Rotary Drain Auger Snake for Blockage Clearing", "category": "Tool", "indicative_cost": "₹1,800 - ₹3,000", "icon": "🌀"},
                    {"name": "Hand Pressure Testing Pump & Gauge", "category": "Tool", "indicative_cost": "₹2,200 - ₹3,500", "icon": "💧"},
                    {"name": "Teflon Tapes, Washer O-Rings & Solvent Cements Kit", "category": "Materials", "indicative_cost": "₹1,500 - ₹2,500", "icon": "📦"}
                ]),
                json.dumps({
                    "equipment_cost": "₹10,000 - ₹16,000",
                    "materials_cost": "₹3,000 - ₹5,000",
                    "setup_cost": "₹2,000 - ₹3,500",
                    "total_indicative_cost": "₹15,000 - ₹24,500",
                    "currency": "INR",
                    "disclaimer": "Indicative Estimate. Actual costs may vary by location, supplier, and business scale."
                }),
                json.dumps({
                    "te": {
                        "title": "ప్లంబింగ్ & వాటర్ ఫిల్టర్ సర్వీస్ ఏజెన్సీ",
                        "desc": "పైపులైన్ అమరిక, లీకేజీల నివారణ, శానిటరీ ఫిట్టింగ్స్ మరియు వాటర్ ప్యూరిఫైయర్ల మరమ్మతు సేవలు.",
                        "customers": "నివాస గృహాలు, అపార్ట్‌మెంట్లు, రెస్టారెంట్లు."
                    },
                    "hi": {
                        "title": "प्लंबिंग एवं वाटर प्यूरीफायर सर्विस एजेंसी",
                        "desc": "पाइपलाइन फिटिंग, नल-टंकी मरम्मत, सेनेटरी इंस्टॉलेशन और आरओ फिल्टर सर्विस।",
                        "customers": "घरेलू उपभोक्ता, सोसायटी और व्यावसायिक भवन।"
                    }
                })
            ),

            # ── TWO-WHEELER MECHANIC PATHWAYS ──
            (
                7,
                "mechanic",
                "Doorstep Two-Wheeler Servicing & Quick Repair Hub",
                "mobile_service",
                "Mobile motorcycle/scooter routine maintenance, oil lubrication, brake overhaul, puncture assistance, and battery jumpstart.",
                "Daily office commuters, delivery riders (Zomato/Swiggy/Blinkit), rural vehicle owners.",
                "Doorstep servicing kits + mobile emergency call assistance.",
                json.dumps(["Engine Tuning", "Tyre Changing", "Clutch Overhaul", "Oil Service"]),
                json.dumps(["Electronic Fuel Injection (EFI) Checks", "Digital Billing", "Parts Procurement"]),
                4,  # Two-Wheeler Mechanic
                "Two-Wheeler Mechanic",
                3,
                json.dumps([
                    {"name": "Professional 46-Piece Metric Socket & Ratchet Kit", "category": "Tool", "indicative_cost": "₹2,200 - ₹3,500", "icon": "🔧"},
                    {"name": "Portable 12V High-Pressure Tyre Inflator & Gauge", "category": "Machine", "indicative_cost": "₹2,500 - ₹4,000", "icon": "🛞"},
                    {"name": "Motorcycle Battery Charger & Digital Load Tester", "category": "Tool", "indicative_cost": "₹2,800 - ₹4,500", "icon": "🔋"},
                    {"name": "Engine Oil Draining Pan & Fluid Dispenser", "category": "Tool", "indicative_cost": "₹800 - ₹1,500", "icon": "🛢️"},
                    {"name": "Engine Oils, Spark Plugs & Brake Shoe Stock", "category": "Materials", "indicative_cost": "₹5,000 - ₹8,000", "icon": "📦"}
                ]),
                json.dumps({
                    "equipment_cost": "₹12,000 - ₹18,000",
                    "materials_cost": "₹5,000 - ₹8,000",
                    "setup_cost": "₹2,000 - ₹4,000",
                    "total_indicative_cost": "₹19,000 - ₹30,000",
                    "currency": "INR",
                    "disclaimer": "Indicative Estimate. Actual costs may vary by location, supplier, and business scale."
                }),
                json.dumps({
                    "te": {
                        "title": "టూ-వీలర్ డోర్‌స్టెప్ సర్వీసింగ్ & ఎమర్జెన్సీ క్లినిక్",
                        "desc": "బైకులు, స్కూటర్ల ఆయిల్ మార్పిడి, బ్రేక్ రిపేర్లు మరియు పంచర్లకు వినియోగదారుల ఇంటి వద్దే సేవలు.",
                        "customers": "డెలివరీ రైడర్లు, ఆఫీస్ ప్రయాణికులు, స్థానిక వాహనదారులు."
                    },
                    "hi": {
                        "title": "टू-व्हीलर मोबाइल सर्विसिंग एवं ब्रेकडाउन असिस्ट",
                        "desc": "मोटरसाइकिल और स्कूटर की घर पर सर्विसिंग, ऑयल चेंज और तत्काल मरम्मत की सेवा।",
                        "customers": "दैनिक यात्री, डिलीवरी राइडर्स और ग्रामीण वाहन मालिक।"
                    }
                })
            ),

            # ── CARPENTRY PATHWAYS ──
            (
                8,
                "carpentry",
                "Custom Woodworking & Modular Furniture Finishing Studio",
                "small_unit",
                "Custom wooden furniture crafting, modular kitchen installation, door/window frame fitting, and furniture restoration.",
                "Home owners, interior designers, commercial offices, schools.",
                "Custom order manufacturing and site-based installation.",
                json.dumps(["Wood Measurement", "Cutting & Jointing", "Hand Tool Operation"]),
                json.dumps(["Modular Hardware Fittings", "High-Gloss Laminate Paste", "CAD Drawing Reading"]),
                18,  # Assistant Carpenter
                "Assistant Carpenter",
                3,
                json.dumps([
                    {"name": "Heavy-Duty Hand Circular Saw & Guides", "category": "Machine", "indicative_cost": "₹4,500 - ₹7,000", "icon": "🪚"},
                    {"name": "Electric Hand Planer with Depth Gauge", "category": "Machine", "indicative_cost": "₹3,200 - ₹5,000", "icon": "⚙️"},
                    {"name": "Wood Router & Trimming Machine Kit", "category": "Machine", "indicative_cost": "₹3,500 - ₹5,500", "icon": "🔧"},
                    {"name": "Heavy Steel F-Clamps & Wood Chisel Set", "category": "Tool", "indicative_cost": "₹2,000 - ₹3,500", "icon": "🗜️"},
                    {"name": "Laminates, Adhesives, Hinges & Screws Stock", "category": "Materials", "indicative_cost": "₹8,000 - ₹14,000", "icon": "📦"}
                ]),
                json.dumps({
                    "equipment_cost": "₹16,000 - ₹24,000",
                    "materials_cost": "₹8,000 - ₹14,000",
                    "setup_cost": "₹4,000 - ₹7,000",
                    "total_indicative_cost": "₹28,000 - ₹45,000",
                    "currency": "INR",
                    "disclaimer": "Indicative Estimate. Actual costs may vary by location, supplier, and business scale."
                }),
                json.dumps({
                    "te": {
                        "title": "కార్పెంట్రీ & మాడ్యులర్ ఫర్నిచర్ తయారీ యూనిట్",
                        "desc": "నాణ్యమైన చెక్క ఫర్నిచర్, మాడ్యులర్ కిచెన్ అమరిక మరియు ఇంటీరియర్ వుడ్ వర్క్ సేవల వ్యాపారం.",
                        "customers": "ఇళ్ల యజమానులు, ఇంటీరియర్ డిజైనర్లు, కార్యాలయాలు."
                    },
                    "hi": {
                        "title": "कस्टम वुडवर्किंग एवं मॉड्युलर फर्नीचर यूनिट",
                        "desc": "लकड़ी के आधुनिक फर्नीचर निर्माण, मॉड्युलर किचन फिटिंग और मरम्मत की उद्यम यूनिट।",
                        "customers": "मकान मालिक, इंटीरियर डिज़ाइनर्स और व्यावसायिक प्रतिष्ठान।"
                    }
                })
            ),

            # ── AGRICULTURE & FOOD PROCESSING PATHWAYS ──
            (
                9,
                "food_processing",
                "Oyster Mushroom Cultivation & Value-Added Spice Packing Unit",
                "home_based",
                "Low-cost spawn bags cultivation of oyster mushrooms combined with clean processing, drying, and hygienic local pouch packaging.",
                "Vegetable markets, grocery stores, organic food consumers, hotels.",
                "Cultivation in dark humidity-controlled room + direct retail sale.",
                json.dumps(["Composting", "Temperature Management", "Harvesting"]),
                json.dumps(["Substrate Sterilization", "Moisture Sealing", "FSSAI Basic Registration", "Local Wholesale Distribution"]),
                20,  # Mushroom Cultivation Technician
                "Mushroom Cultivation Technician",
                3,
                json.dumps([
                    {"name": "Digital Room Humidity & Temperature Controller", "category": "Tool", "indicative_cost": "₹1,800 - ₹3,000", "icon": "🌡️"},
                    {"name": "Micro-Mist Spray Humidifier & Piping", "category": "Machine", "indicative_cost": "₹3,500 - ₹6,000", "icon": "🚿"},
                    {"name": "Continuous Heat Impulse Pouch Sealer", "category": "Machine", "indicative_cost": "₹1,500 - ₹2,500", "icon": "📦"},
                    {"name": "Stainless Steel Dehydration Drying Trays", "category": "Workspace", "indicative_cost": "₹2,500 - ₹4,500", "icon": "🍱"},
                    {"name": "Substrate Straw, Mushroom Spawn & Food-Grade Bags", "category": "Materials", "indicative_cost": "₹4,000 - ₹7,000", "icon": "🌱"}
                ]),
                json.dumps({
                    "equipment_cost": "₹11,000 - ₹18,000",
                    "materials_cost": "₹4,000 - ₹7,000",
                    "setup_cost": "₹2,000 - ₹4,000",
                    "total_indicative_cost": "₹17,000 - ₹29,000",
                    "currency": "INR",
                    "disclaimer": "Indicative Estimate. Actual costs may vary by location, supplier, and business scale."
                }),
                json.dumps({
                    "te": {
                        "title": "పుట్టగొడుగుల సాగు & ఆర్గానిక్ ప్యాకింగ్ యూనిట్",
                        "desc": "తక్కువ స్థలంలో ఆయిస్టర్ పుట్టగొడుగుల పెంపకం మరియు శుభ్రమైన ప్యాకింగ్‌తో మంచి లాభదాయక వ్యాపారం.",
                        "customers": "కూరగాయల మార్కెట్లు, సూపర్ మార్కెట్లు, రెస్టారెంట్లు."
                    },
                    "hi": {
                        "title": "मशरूम उत्पादन एवं खाद्य प्रसंस्करण इकाई",
                        "desc": "कम लागत में उच्च गुणवत्ता वाले मशरूम की खेती और स्थानीय बाजार में स्वच्छ पैकेजिंग बिक्री।",
                        "customers": "सब्जी मंडी, किराना स्टोर और होटल।"
                    }
                })
            )
        ]

        conn.executemany("""
            INSERT INTO business_pathways (
                id, trade_category, business_title, business_type,
                description, target_customers, operating_model,
                skills_have, skills_recommended, nsqf_course_id,
                nsqf_course_name, nsqf_level, equipment,
                investment_breakdown, translations
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, pathways)

        # Mapping schemes to business pathways
        # All businesses eligible for PM-AJAY (1) and Mudra (4)
        # Artisans eligible for PM Vishwakarma (2)
        # Small units eligible for PMEGP (3) and Stand-Up India (5)
        mappings = [
            (1, 1), (1, 2), (1, 4),        # Tailoring home: PM-AJAY, Vishwakarma, Mudra
            (2, 1), (2, 2), (2, 3), (2, 4),# Tailoring boutique: PM-AJAY, Vishwakarma, PMEGP, Mudra
            (3, 1), (3, 2), (3, 4),        # Electrical service: PM-AJAY, Vishwakarma, Mudra
            (4, 1), (4, 3), (4, 4), (4, 5),# Electrical shop: PM-AJAY, PMEGP, Mudra, Stand-Up India
            (5, 1), (5, 3), (5, 4),        # Solar rooftop: PM-AJAY, PMEGP, Mudra
            (6, 1), (6, 2), (6, 4),        # Plumbing: PM-AJAY, Vishwakarma, Mudra
            (7, 1), (7, 2), (7, 4),        # Mechanic: PM-AJAY, Vishwakarma, Mudra
            (8, 1), (8, 2), (8, 3), (8, 4),# Carpentry: PM-AJAY, Vishwakarma, PMEGP, Mudra
            (9, 1), (9, 3), (9, 4),        # Mushroom food proc: PM-AJAY, PMEGP, Mudra
        ]
        conn.executemany("INSERT OR IGNORE INTO scheme_business_mapping VALUES (?, ?)", mappings)


def format_pathway_dict(item: dict) -> dict:
    """Format JSON fields and ensure alias property names exist for frontend compatibility."""
    skills_have = json.loads(item["skills_have"]) if isinstance(item.get("skills_have"), str) else (item.get("skills_have") or [])
    skills_rec = json.loads(item["skills_recommended"]) if isinstance(item.get("skills_recommended"), str) else (item.get("skills_recommended") or [])
    equipment = json.loads(item["equipment"]) if isinstance(item.get("equipment"), str) else (item.get("equipment") or [])
    inv_breakdown = json.loads(item["investment_breakdown"]) if isinstance(item.get("investment_breakdown"), str) else (item.get("investment_breakdown") or {})
    translations = json.loads(item["translations"]) if isinstance(item.get("translations"), str) else (item.get("translations") or {})

    item["skills_have"] = skills_have
    item["skills_already_have"] = skills_have
    item["skills_recommended"] = skills_rec
    item["skills_recommended_to_acquire"] = skills_rec
    item["equipment"] = equipment
    item["equipment_checklist"] = equipment
    item["investment_breakdown"] = inv_breakdown
    item["indicative_investment"] = inv_breakdown
    item["title"] = item.get("business_title") or item.get("title") or "Micro-Enterprise"
    item["description"] = item.get("description") or ""
    item["potential_customers"] = item.get("target_customers") or item.get("potential_customers") or ""
    item["delivery_model"] = item.get("operating_model") or item.get("delivery_model") or ""
    item["translations"] = translations
    return item


def get_all_business_pathways() -> list[dict]:
    """Retrieve all verified business pathways from SQLite database."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM business_pathways ORDER BY id ASC").fetchall()
    conn.close()

    results = []
    for r in rows:
        item = format_pathway_dict(dict(r))
        item["applicable_schemes"] = get_schemes_for_business(item["id"])
        results.append(item)
    return results


def get_business_pathways_by_trade(trade_or_skill: str) -> list[dict]:
    """
    Query business pathways filtered by trade category (e.g. tailoring, electrical).
    Falls back gracefully if exact match is not found.
    """
    term = (trade_or_skill or "").lower()
    trade_key = "tailoring"
    if any(w in term for w in ["elec", "wire", "switch", "విద్యుత్", "వైరింగ్", "बिजली", "वायरिंग"]):
        trade_key = "electrical"
    elif any(w in term for w in ["solar", "సౌర", "సోలార్", "सौर"]):
        trade_key = "solar"
    elif any(w in term for w in ["plumb", "pipe", "పైప్", "ప్లంబింగ్", "पाइप", "नल"]):
        trade_key = "plumbing"
    elif any(w in term for w in ["mechanic", "bike", "scooter", "మోటార్", "మెకానిక్", "मैकेनिक", "वाहन"]):
        trade_key = "mechanic"
    elif any(w in term for w in ["carpen", "wood", "వడ్రంగి", "చెక్క", "बढ़ई", "लकड़ी"]):
        trade_key = "carpentry"
    elif any(w in term for w in ["mush", "food", "agri", "వ్యవసాయం", "పుట్టగొడుగు", "कृषि", "मशरूम"]):
        trade_key = "food_processing"
    elif any(w in term for w in ["tailor", "sew", "garment", "కుట్టు", "టైలర్", "दर्जी", "सिलाई"]):
        trade_key = "tailoring"

    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM business_pathways WHERE trade_category = ? ORDER BY id ASC",
        (trade_key,),
    ).fetchall()

    if not rows:
        rows = conn.execute("SELECT * FROM business_pathways LIMIT 2").fetchall()

    conn.close()

    results = []
    for r in rows:
        item = format_pathway_dict(dict(r))
        item["applicable_schemes"] = get_schemes_for_business(item["id"])
        results.append(item)
    return results


def get_all_schemes() -> list[dict]:
    """Retrieve all verified government enterprise schemes."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM government_schemes ORDER BY id ASC").fetchall()
    conn.close()

    results = []
    for r in rows:
        item = dict(r)
        item["eligibility_criteria"] = json.loads(item["eligibility_criteria"])
        item["applicable_business_types"] = json.loads(item["applicable_business_types"])
        item["applicable_trades"] = json.loads(item["applicable_trades"])
        item["translations"] = json.loads(item["translations"])
        results.append(item)
    return results


def get_schemes_for_business(business_id: int, user_category: str = "SC") -> list[dict]:
    """
    Retrieve strictly verified government schemes associated with a specific business pathway.
    Ensures zero hallucinated schemes.
    """
    conn = get_connection()
    rows = conn.execute("""
        SELECT s.* FROM government_schemes s
        JOIN scheme_business_mapping m ON s.id = m.scheme_id
        WHERE m.business_id = ?
        ORDER BY s.id ASC
    """, (business_id,)).fetchall()
    conn.close()

    results = []
    for r in rows:
        item = dict(r)
        item["eligibility_criteria"] = json.loads(item["eligibility_criteria"])
        item["applicable_business_types"] = json.loads(item["applicable_business_types"])
        item["applicable_trades"] = json.loads(item["applicable_trades"])
        item["translations"] = json.loads(item["translations"])
        results.append(item)
    return results


def get_livelihood_comparison(trade: str) -> dict:
    """
    Generate an objective side-by-side comparison between Wage Employment and Self-Employment
    for a given trade without declaring one as automatically better.
    """
    clean_trade = trade.title() if trade else "Vocational Trade"
    return {
        "existing_skill": clean_trade,
        "employment_training": "NSQF Level 3-4 Accredited Job-Role Course",
        "self_employment_training": "NSQF Technical Course + 45-hr Entrepreneurship Module",
        "employment_certification": "Government National Trade Certificate (NCVET)",
        "self_employment_certification": "NCVET Certificate + PM-AJAY Enterprise Enrollment",
        "employment_work_model": "Structured Working Hours with Employer / Organization",
        "self_employment_work_model": "Independent Business, Self-Managed Schedule & Direct Clients",
        "employment_investment": "Minimal / Zero (Employer provides machinery & tools)",
        "self_employment_investment": "Indicative Start-up Capital (Supported by Subsidies & MUDRA)",
        "employment_income": "Regular Monthly Wage / Salary with Increments",
        "self_employment_income": "Direct Service Fee & Profit Margin Revenue",
        "employment_growth": "Promotions, Senior Technician & Supervisory Roles",
        "self_employment_growth": "Client Expansion, Hiring Helpers & Workshop Scaling"
    }


# ═══════════════════════════════════════════════════════════════
# AUTHORITATIVE RESEARCH DATASET SEED & QUERY OPERATIONS
# ═══════════════════════════════════════════════════════════════

def seed_research_dataset(conn: sqlite3.Connection):
    """
    Seed authoritative research data from Pasted markdown(6).md.
    Populates normalized tables:
    skills, occupations, nsqf_qualifications, skill_occupation_mapping,
    training_centres, district_skill_demand, scheme_eligibility,
    ap_district_profiles, multilingual_terms, skill_gap_matrix.
    """
    try:
        from data.research_seed import (
            SKILLS_DATA,
            OCCUPATIONS_DATA,
            NSQF_QUALIFICATIONS_DATA,
            SKILL_OCCUPATION_MAPPING_DATA,
            TRAINING_CENTRES_DATA,
            DISTRICT_SKILL_DEMAND_DATA,
            SCHEME_ELIGIBILITY_DATA,
            AP_DISTRICT_PROFILES_DATA,
            MULTILINGUAL_TERMS_DATA,
            SKILL_GAP_MATRIX_DATA,
        )
    except ImportError as e:
        print(f"⚠️  Notice: research_seed.py import deferred: {e}")
        return

    # 1. Skills
    for s in SKILLS_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO skills (skill_id, canonical_name, domain, description, verification_type, source_reference)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (s["skill_id"], s["canonical_name"], s["domain"], s["description"], s["verification_type"], s["source_reference"]))

    # 2. Occupations
    for o in OCCUPATIONS_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO occupations (occupation_id, occupation_title, nco_code, sector_skill_council, entry_education, employment_opportunities, self_employment_potential, primary_tools, verification_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (o["occupation_id"], o["occupation_title"], o["nco_code"], o["sector_skill_council"], o["entry_education"], o["employment_opportunities"], o["self_employment_potential"], o["primary_tools"], o["verification_status"]))

    # 3. NSQF Qualifications
    for q in NSQF_QUALIFICATIONS_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO nsqf_qualifications (qualification_code, qualification_name, sector, nsqf_level, theory_hours, practical_hours, employability_hours, total_hours, minimum_age, entry_requirement, official_source_url, last_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (q["qualification_code"], q["qualification_name"], q["sector"], q["nsqf_level"], q["theory_hours"], q["practical_hours"], q["employability_hours"], q["total_hours"], q["minimum_age"], q["entry_requirement"], q["official_source_url"], q["last_verified"]))

    # 4. Skill Occupation Mapping
    for m in SKILL_OCCUPATION_MAPPING_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO skill_occupation_mapping (mapping_id, skill_id, occupation_id, relevance_weight)
            VALUES (?, ?, ?, ?)
        """, (m["mapping_id"], m["skill_id"], m["occupation_id"], m["relevance_weight"]))

    # 5. Training Centres
    for tc in TRAINING_CENTRES_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO training_centres (centre_id, centre_name, operating_agency, district, state, pincode, address, facilities, contact_person, contact_phone, is_active, verification_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tc["centre_id"], tc["centre_name"], tc["operating_agency"], tc["district"], tc["state"], tc["pincode"], tc["address"], tc["facilities"], tc["contact_person"], tc["contact_phone"], tc["is_active"], tc["verification_status"]))

    # 6. District Skill Demand
    for d in DISTRICT_SKILL_DEMAND_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO district_skill_demand (demand_id, district, state, economic_focus, occupation_category, demand_indicator, demand_rationale, verification_confidence, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (d["demand_id"], d["district"], d["state"], d["economic_focus"], d["occupation_category"], d["demand_indicator"], d["demand_rationale"], d["verification_confidence"], d["last_updated"]))

    # 7. Scheme Eligibility
    for se in SCHEME_ELIGIBILITY_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO scheme_eligibility (rule_id, scheme_code, evaluated_field, required_condition, logical_operator, failure_message)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (se["rule_id"], se["scheme_code"], se["evaluated_field"], se["required_condition"], se["logical_operator"], se["failure_message"]))

    # 8. AP District Profiles
    for ap in AP_DISTRICT_PROFILES_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO ap_district_profiles (district_name, headquarters, sc_population_percent, dominant_subcastes, leading_industrial_sectors, priority_skilling_sectors, district_nodal_office)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (ap["district_name"], ap["headquarters"], ap["sc_population_percent"], ap["dominant_subcastes"], ap["leading_industrial_sectors"], ap["priority_skilling_sectors"], ap["district_nodal_office"]))

    # 9. Multilingual Terms
    for t in MULTILINGUAL_TERMS_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO multilingual_terms (term_id, canonical_en, term_te, term_hi, functional_definition, translation_category)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (t["term_id"], t["canonical_en"], t["term_te"], t["term_hi"], t["functional_definition"], t["translation_category"]))

    # 10. Skill Gap Matrix
    for g in SKILL_GAP_MATRIX_DATA:
        conn.execute("""
            INSERT OR REPLACE INTO skill_gap_matrix (gap_id, informal_competency, target_job_role, compulsory_nos, competency_deficit, bridge_module, training_mode, classification)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (g["gap_id"], g["informal_competency"], g["target_job_role"], g["compulsory_nos"], g["competency_deficit"], g["bridge_module"], g["training_mode"], g["classification"]))


def get_skills(domain: Optional[str] = None) -> list[dict]:
    """Retrieve normalized skills with official provenance."""
    conn = get_connection()
    if domain:
        rows = conn.execute("SELECT * FROM skills WHERE domain LIKE ? ORDER BY skill_id ASC", (f"%{domain}%",)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM skills ORDER BY skill_id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_occupations() -> list[dict]:
    """Retrieve standard occupations with NCO codes and Sector Skill Councils."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM occupations ORDER BY occupation_id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_nsqf_qualifications(sector: Optional[str] = None) -> list[dict]:
    """Retrieve NCVET-approved NSQF qualification records."""
    conn = get_connection()
    if sector:
        rows = conn.execute("SELECT * FROM nsqf_qualifications WHERE sector LIKE ? ORDER BY qualification_code ASC", (f"%{sector}%",)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM nsqf_qualifications ORDER BY qualification_code ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_training_centres(district: Optional[str] = None) -> list[dict]:
    """Retrieve physical training centres. Can filter by district."""
    conn = get_connection()
    if district:
        clean_dist = district.strip()
        rows = conn.execute("SELECT * FROM training_centres WHERE district LIKE ? ORDER BY centre_id ASC", (f"%{clean_dist}%",)).fetchall()
        if not rows:
            rows = conn.execute("SELECT * FROM training_centres ORDER BY centre_id ASC").fetchall()
    else:
        rows = conn.execute("SELECT * FROM training_centres ORDER BY centre_id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_district_demand(district: Optional[str] = None, occupation_category: Optional[str] = None) -> list[dict]:
    """Retrieve local skill demand indicators and rationale from DSDP / APSSDC reports."""
    conn = get_connection()
    query = "SELECT * FROM district_skill_demand WHERE 1=1"
    params = []
    if district:
        query += " AND district LIKE ?"
        params.append(f"%{district.strip()}%")
    if occupation_category:
        query += " AND occupation_category LIKE ?"
        params.append(f"%{occupation_category.strip()}%")
    query += " ORDER BY demand_id ASC"
    rows = conn.execute(query, tuple(params)).fetchall()
    if not rows and district:
        # Fallback to all if specific district not found
        rows = conn.execute("SELECT * FROM district_skill_demand ORDER BY demand_id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_ap_districts() -> list[dict]:
    """Retrieve Andhra Pradesh district profiles."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM ap_district_profiles ORDER BY district_name ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_scheme_eligibility_rules(scheme_code: Optional[str] = None) -> list[dict]:
    """Retrieve deterministic eligibility rules for government schemes."""
    conn = get_connection()
    if scheme_code:
        rows = conn.execute("SELECT * FROM scheme_eligibility WHERE scheme_code = ? ORDER BY rule_id ASC", (scheme_code,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM scheme_eligibility ORDER BY rule_id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_multilingual_terms() -> list[dict]:
    """Retrieve verified multilingual occupational terminology."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM multilingual_terms ORDER BY term_id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_skill_gaps() -> list[dict]:
    """Retrieve skill-gap differential matrices and bridge modules."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM skill_gap_matrix ORDER BY gap_id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ═══════════════════════════════════════════════════════════════
# DATABASE INITIALIZATION — Called at app startup
# ═══════════════════════════════════════════════════════════════

def init_database():
    """
    Full database setup: create tables, load courses, load demo users.

    Called by: main.py when the FastAPI app starts.

    Steps:
        1. Create all 4 tables (if they don't exist)
        2. Load the course catalog from data/nsqf_courses.json
        3. Load demo users from data/seed_users.json
    """
    create_tables()

    data_dir = os.path.join(os.path.dirname(__file__), "data")
    courses_file = os.path.join(data_dir, "nsqf_courses.json")
    if os.path.exists(courses_file):
        load_courses_from_json(courses_file)
    else:
        print(f"⚠️  Course catalog not found at {courses_file}")

    existing_users = get_all_users()
    if len(existing_users) == 0:
        users_file = os.path.join(data_dir, "seed_users.json")
        if os.path.exists(users_file):
            load_users_from_json(users_file)
        else:
            print(f"⚠️  Seed users not found at {users_file}")
