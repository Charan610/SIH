import { NextResponse } from "next/server";

const SAMPLE_COURSES = [
  {
    course_id: 101,
    course_name: "Domestic Electrician & House Wiring Specialist",
    sector: "Construction & Electrical",
    job_role: "Electrician",
    nsqf_level: "Level 3",
    minimum_education: "8th Pass",
    estimated_salary: "₹18,000 - ₹22,000/month",
    duration_hours: 400,
    match_score: 95,
    match_reasons: ["Matches electrical & maintenance skills", "Fits Level 3 capability"],
  },
  {
    course_id: 102,
    course_name: "Automotive Service Technician (Two-Wheeler & Light Motor)",
    sector: "Automotive",
    job_role: "Auto Technician",
    nsqf_level: "Level 4",
    minimum_education: "10th Pass",
    estimated_salary: "₹22,000 - ₹28,000/month",
    duration_hours: 500,
    match_score: 92,
    match_reasons: ["Matches mechanical tool experience", "Fits Level 4 independent work"],
  },
  {
    course_id: 103,
    course_name: "Solar PV Installer & Maintenance Technician",
    sector: "Green Jobs & Energy",
    job_role: "Solar Technician",
    nsqf_level: "Level 4",
    minimum_education: "10th Pass",
    estimated_salary: "₹20,000 - ₹26,000/month",
    duration_hours: 450,
    match_score: 89,
    match_reasons: ["High growth green energy sector", "PM-AJAY GIA subsidized"],
  },
  {
    course_id: 104,
    course_name: "Plumbing Operations & Sanitation Systems",
    sector: "Plumbing & Infrastructure",
    job_role: "General Plumber",
    nsqf_level: "Level 3",
    minimum_education: "8th Pass",
    estimated_salary: "₹16,000 - ₹22,000/month",
    duration_hours: 350,
    match_score: 86,
    match_reasons: ["Hands-on practical trade", "Fits independent work style"],
  },
];

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const sessionId = payload.session_id || `session_${Date.now()}`;
    const lang = (payload.language || "te").toLowerCase();
    const userProf = payload.user_profile || {};
    const answers = payload.answers || [];

    // Extract answers map
    const ansMap: Record<string | number, string> = {};
    for (const a of answers) {
      if (a.stepNumber) ansMap[a.stepNumber] = a.answerText;
      if (a.questionId) ansMap[a.questionId] = a.answerText;
    }

    const q1Work = ansMap[1] || ansMap["work_current"] || userProf.current_role || "Skilled Work";
    const q2Time = ansMap[2] || ansMap["work_duration"] || "2 years";
    const q7Indep = ansMap[7] || ansMap["work_autonomy"] || "Yes";

    const isIndep = /yes|అవును|హా|हाँ|خود|independently|alone/i.test(q7Indep);
    const estimatedLevel = isIndep ? "Level 4" : "Level 3";

    const profile = {
      name: userProf.name || "Beneficiary",
      age: userProf.age || 24,
      district: userProf.location_district || "West Godavari",
      education_level: userProf.education_level || "10th Pass",
      caste_category: userProf.caste_category || "SC",
      annual_income: userProf.annual_income || 120000,
      current_role: q1Work,
      experience_duration: q2Time,
      estimated_nsqf_level: estimatedLevel,
      autonomy_level: isIndep ? "Independent" : "Supervised",
    };

    const nsqfAlignment = {
      estimated_alignment: {
        level_range: estimatedLevel,
        confidence_score: 0.92,
        primary_fit_reason: `Demonstrated ${profile.experience_duration} experience with ${profile.autonomy_level} execution.`,
      },
      dimension_evaluations: [
        { dimension: "Process & Domain", level: estimatedLevel, matched: true },
        { dimension: "Professional Tasks & Tools", level: estimatedLevel, matched: true },
        { dimension: "Professional Knowledge", level: estimatedLevel, matched: true },
        { dimension: "Autonomy & Responsibility", level: estimatedLevel, matched: true },
        { dimension: "Quality & Safety", level: estimatedLevel, matched: true },
      ],
    };

    let explanation = "";
    if (lang.startsWith("te")) {
      explanation = `మీ సంభాషణ సమాధానాల ప్రకారం, మీ వృత్తి నైపుణ్యం NSQF ${estimatedLevel} కింద సమలేఖనం చేయబడింది. PM-AJAY GIA పథకం కింద ఉచిత శిక్షణ మరియు జీవనోపాధి అవకాశాలు ఇక్కడ అందుబాటులో ఉన్నాయి.`;
    } else if (lang.startsWith("hi")) {
      explanation = `आपके मौखिक उत्तरों के आधार पर, आपकी दक्षता NSQF ${estimatedLevel} के अंतर्गत आती है। PM-AJAY GIA योजना के तहत आपको मुफ्त प्रशिक्षण और आजीविका सहायता प्रदान की जाती है।`;
    } else {
      explanation = `Based on your responses, your practical skill experience aligns with NSQF ${estimatedLevel}. Under the PM-AJAY GIA scheme, you are eligible for 100% subsidized skill development and direct job placement assistance.`;
    }

    return NextResponse.json({
      session_id: sessionId,
      profile,
      nsqf_alignment: nsqfAlignment,
      recommendations: SAMPLE_COURSES,
      explanation,
      audio_base64: null,
      audio_provider: "Sarvam AI / System TTS",
      decision_trace: {
        evaluated_at: new Date().toISOString(),
        nsqf_level: estimatedLevel,
      },
    });
  } catch (err: any) {
    console.error("Error in assessment complete route:", err);
    return NextResponse.json({ error: err.message || "Failed to complete assessment" }, { status: 500 });
  }
}
