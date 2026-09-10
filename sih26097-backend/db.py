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
    limit: int = 10,
) -> list[dict]:
    """
    Directly queries the SQLite 'courses' table filtered by the candidate's
    estimated NSQF level and matching sector/skills.

    Returns exactly 9 to 10 real course/job entries from the database,
    preserving real fields:
      - id
      - name (course name)
      - sector
      - job_role
      - nsqf_level
      - min_education
      - description
      - skills
      - estimated_salary (real sourced figure)

    CRITICAL ARCHITECTURAL BOUNDARY:
      Zero items are fabricated or invented by an LLM. Everything originates
      directly from the SQLite 'courses' table.
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
    # Fetch all real courses from SQLite table
    rows = conn.execute("SELECT * FROM courses").fetchall()
    conn.close()

    if not rows:
        return []

    # Clean candidate skills
    clean_skills = [s.lower().strip() for s in skills if s and s.strip()]
    role_lower = (role_or_sector or "").lower()

    scored_courses = []
    for r in rows:
        c = dict(r)
        c["skills"] = json.loads(c["skills"]) if isinstance(c["skills"], str) else c["skills"]
        course_lvl = c.get("nsqf_level", 3)
        course_skills = [s.lower() for s in c.get("skills", [])]
        course_name = c.get("name", "").lower()
        course_role = c.get("job_role", "").lower()
        course_sector = c.get("sector", "").lower()

        score = 0.0

        # Level proximity scoring
        if course_lvl == primary_level:
            score += 10.0
        elif course_lvl in target_levels:
            score += 6.0
        else:
            diff = abs(course_lvl - primary_level)
            score += max(0.0, 4.0 - diff)

        # Sector / Role keyword matching
        if role_lower:
            for word in role_lower.replace("/", " ").replace("-", " ").split():
                if len(word) >= 3:
                    if word in course_name or word in course_role:
                        score += 8.0
                    elif word in course_sector:
                        score += 5.0

        # Skill overlap scoring
        for user_sk in clean_skills:
            for sk_word in user_sk.replace("/", " ").split():
                if len(sk_word) >= 3:
                    if any(sk_word in c_sk for c_sk in course_skills):
                        score += 3.0
                    if sk_word in course_name or sk_word in course_role:
                        score += 4.0

        c["fit_score"] = round(score, 2)
        scored_courses.append(c)

    # Sort descending by score, then by NSQF level proximity
    scored_courses.sort(key=lambda x: (x["fit_score"], -abs(x.get("nsqf_level", 3) - primary_level)), reverse=True)

    # Return exactly 9 or 10 real items (capped at limit, min 9 if available)
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
