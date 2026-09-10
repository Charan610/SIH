"use client";

import React, { useEffect, useState } from "react";
import { 
  nsqfService, 
  NSQFDescriptorRecord, 
  NSQFEntryNormRecord, 
  CapabilityComparisonResponse 
} from "@/lib/api/services/nsqf";
import { useApp } from "@/lib/AppContext";
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  FileText, 
  HelpCircle, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  UserCheck 
} from "lucide-react";

export default function NSQFServicePage() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<"alignment" | "descriptors" | "norms">("alignment");
  const [descriptors, setDescriptors] = useState<NSQFDescriptorRecord[]>([]);
  const [entryNorms, setEntryNorms] = useState<NSQFEntryNormRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Alignment test form state
  const [statedSkills, setStatedSkills] = useState<string>("pipe laying, pump installation, leak repair");
  const [educationLevel, setEducationLevel] = useState<string>("10th Pass");
  const [experienceYears, setExperienceYears] = useState<number>(3.0);
  const [currentRole, setCurrentRole] = useState<string>("Plumber / Field Technician");
  const [autonomyLevel, setAutonomyLevel] = useState<string>("limited_supervision");
  const [workTasks, setWorkTasks] = useState<string>("Installing PVC pipes, repairing water pumps, customer service");

  const [comparisonResult, setComparisonResult] = useState<CapabilityComparisonResponse | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [descs, norms] = await Promise.all([
          nsqfService.getOfficialDescriptors(),
          nsqfService.getEntryNorms()
        ]);
        setDescriptors(descs);
        setEntryNorms(norms);

        // Run initial default alignment
        if (descs.length > 0) {
          const initialRes = await nsqfService.compareCapabilities({
            stated_skills: ["pipe laying", "pump installation", "leak repair"],
            education_level: "10th Pass",
            experience_years: 3.0,
            current_role: "Plumber / Field Technician",
            autonomy_level: "limited_supervision",
            work_tasks: ["Installing PVC pipes", "repairing water pumps", "customer service"]
          });
          setComparisonResult(initialRes);
        }
      } catch (err) {
        console.error("Failed loading NSQF data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRunComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    try {
      const skillsArray = statedSkills.split(",").map(s => s.trim()).filter(Boolean);
      const tasksArray = workTasks.split(",").map(s => s.trim()).filter(Boolean);
      const res = await nsqfService.compareCapabilities({
        stated_skills: skillsArray,
        education_level: educationLevel,
        experience_years: Number(experienceYears) || 0,
        current_role: currentRole,
        autonomy_level: autonomyLevel,
        work_tasks: tasksArray
      });
      setComparisonResult(res);
    } catch (err) {
      console.error("Comparison evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mb-2">
                <Award className="w-3.5 h-3.5" />
                {t("nsqf.badge", "Government Standard • level_description.pdf")}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t("nsqf.title", "NSQF Level Descriptors & Capability Alignment")}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-3xl text-sm sm:text-base">
                {t(
                  "nsqf.subtitle",
                  "Authoritative 5-dimensional skill descriptors across Levels 1 to 8 and standard entry norms from the official Gazette specification."
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono">
                Source: 17 Pages Verified
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mt-6 gap-2 sm:gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("alignment")}
              className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "alignment"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              {t("nsqf.tabs.alignment", "Capability Alignment Checker")}
            </button>
            <button
              onClick={() => setActiveTab("descriptors")}
              className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "descriptors"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              {t("nsqf.tabs.descriptors", "Official Level Descriptors (Pages 1–11)")}
            </button>
            <button
              onClick={() => setActiveTab("norms")}
              className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "norms"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              {t("nsqf.tabs.norms", "Standard Entry Norms & Hours (Pages 12–17)")}
            </button>
          </div>
        </div>

        {/* ── TAB 1: CAPABILITY ALIGNMENT CHECKER ───────────────────────────────── */}
        {activeTab === "alignment" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Form Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Candidate Evidence Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter self-reported or system-extracted parameters to compare against the 5 official descriptor dimensions.
                </p>

                <form onSubmit={handleRunComparison} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Stated Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={statedSkills}
                      onChange={(e) => setStatedSkills(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Education
                      </label>
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="No formal education">No formal education</option>
                        <option value="5th Pass">5th Grade Pass</option>
                        <option value="8th Pass">8th Grade Pass</option>
                        <option value="10th Pass">10th Grade / ITI</option>
                        <option value="12th Pass">12th Grade / Intermediate</option>
                        <option value="Diploma">Polytechnic Diploma</option>
                        <option value="UG Degree">UG Degree / Graduate</option>
                        <option value="PG Degree">PG Degree / Master</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Current / Past Role
                    </label>
                    <input
                      type="text"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Autonomy & Supervision Level
                    </label>
                    <select
                      value={autonomyLevel}
                      onChange={(e) => setAutonomyLevel(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="continuous_supervision">Under Continuous Instruction & Close Supervision (Level 1)</option>
                      <option value="under_instructions">Works mostly under instructions & supervision (Level 2)</option>
                      <option value="limited_supervision">Works with own initiative / limited supervision (Level 2.5–3)</option>
                      <option value="independent">Executes complex tasks without instructions (Level 3.5–4)</option>
                      <option value="supervises_others">Supervises workforce / team building (Level 4.5–5)</option>
                      <option value="delegation_manager">Business unit management / delegation (Level 5.5–6)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Key Routine Tasks
                    </label>
                    <textarea
                      rows={2}
                      value={workTasks}
                      onChange={(e) => setWorkTasks(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={evaluating}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {evaluating ? (
                      <span>Evaluating Against NSQF Descriptors...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Evaluate Descriptor Alignment
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Source Document Citation Card */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Government Governance Mandate
                </div>
                <p>
                  This system calculates <strong>Estimated Capability Alignment</strong> based on official parameters in <code>level_description.pdf</code>. It strictly does not claim official accredited certification.
                </p>
              </div>
            </div>

            {/* Alignment Result Column */}
            <div className="lg:col-span-7 space-y-6">
              {comparisonResult ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Estimated Capability Alignment
                        </span>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                          {comparisonResult.estimated_alignment.level_range}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          Archetype: {comparisonResult.estimated_alignment.target_role_archetype}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Confidence: {comparisonResult.estimated_alignment.qualitative_confidence}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">Official Certification: False</p>
                      </div>
                    </div>

                    {/* 5 Dimensions Grid */}
                    <div className="mt-6 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Evaluated NSQF Descriptor Dimensions
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(comparisonResult.dimensions).map(([key, dim]) => (
                          <div 
                            key={key} 
                            className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {dim.dimension_name}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono text-[11px]">
                                Source: p. {dim.source_page}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Benchmark: </span>
                              {dim.descriptor_benchmark}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium">Evidence:</span>
                              {dim.user_evidence.map((ev, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                  {ev}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Skill Development Areas (Gaps) */}
                  {comparisonResult.skill_development_gaps.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Skill Development Areas & Competency Gaps
                      </h3>
                      <div className="space-y-3">
                        {comparisonResult.skill_development_gaps.map((gap, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {gap.dimension}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Target: {gap.target_level} (Ref: {gap.source_page})
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {gap.gap_description}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Recommended Progression Steps */}
                      {comparisonResult.recommended_progression_steps.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                            Recommended Skilling Roadmap
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                            {comparisonResult.recommended_progression_steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Why this alignment? & Source Info */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Why this alignment?
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Alignment is deterministically derived from candidate education, years of trade experience, self-reported task autonomy, and matched competencies against official criteria published across Pages 1–11 of <code>level_description.pdf</code>.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Source Traceability
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {comparisonResult.source_citations.map((c, i) => (
                          <div key={i} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {c.document} (Pages {c.pages})
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {c.section}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  Loading or evaluating capability parameters...
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── TAB 2: OFFICIAL LEVEL DESCRIPTORS (PAGES 1–11) ────────────────────── */}
        {activeTab === "descriptors" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {descriptors.map((desc) => (
                <div 
                  key={desc.level_code} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                          Level {desc.level_code}
                        </span>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {desc.level_range}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Occupational Archetype: {desc.typical_role}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Source: {desc.source.document} (Pages {desc.source.pages})
                    </span>
                  </div>

                  {/* 5 Columns / Dimension Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    
                    {/* Dimension 1 */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        1. Theoretical Knowledge
                      </h4>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        {desc.brief_outline.knowledge}
                      </p>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                        {desc.detailed_descriptor.knowledge.slice(0, 2).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Dimension 2 */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        2. Technical Skills
                      </h4>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        {desc.brief_outline.technical_skills}
                      </p>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                        {desc.detailed_descriptor.technical_skills.slice(0, 2).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Dimension 3 */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        3. Soft Skills & Enterprise
                      </h4>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        {desc.brief_outline.employability_and_entrepreneurship}
                      </p>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                        {desc.detailed_descriptor.employability_and_entrepreneurship.slice(0, 2).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Dimension 4 */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        4. Learning Outcomes
                      </h4>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        {desc.brief_outline.learning_outcomes}
                      </p>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                        {desc.detailed_descriptor.learning_outcomes.slice(0, 2).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Dimension 5 */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        5. Responsibility Level
                      </h4>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        {desc.brief_outline.responsibility}
                      </p>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                        {desc.detailed_descriptor.responsibility.slice(0, 2).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: STANDARD ENTRY NORMS & HOURS (PAGES 12–17) ───────────────── */}
        {activeTab === "norms" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-x-auto">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Standard Norms for Minimum Entry Criteria & Notional Hours
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Preserved from the authoritative tables on Pages 12 to 17 of <code>level_description.pdf</code>.
              </p>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300">
                    <th className="py-2.5 px-3 font-semibold">NSQF Level</th>
                    <th className="py-2.5 px-3 font-semibold">STT Min Education</th>
                    <th className="py-2.5 px-3 font-semibold">STT Experience</th>
                    <th className="py-2.5 px-3 font-semibold">STT Hours</th>
                    <th className="py-2.5 px-3 font-semibold">STT ES Hours</th>
                    <th className="py-2.5 px-3 font-semibold">LTT Criteria & Hours</th>
                    <th className="py-2.5 px-3 font-semibold">Source Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  {entryNorms.map((norm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white font-mono">
                        Level {norm.level_code}
                      </td>
                      <td className="py-2.5 px-3">
                        {norm.stt_norms[0]?.min_education || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {norm.stt_norms[0]?.min_experience || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-blue-600 dark:text-blue-400">
                        {norm.stt_norms[0]?.notional_hours || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {norm.stt_norms[0]?.employability_skills_hours || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {norm.ltt_norms ? (
                          <span>
                            {norm.ltt_norms.min_entry_criteria} ({norm.ltt_norms.notional_hours})
                          </span>
                        ) : (
                          <span className="text-slate-400">No LTT course</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        p. {norm.source_page}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
