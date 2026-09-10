"use client";

import React from "react";
import { 
  Mic, 
  Compass, 
  Layers, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  GitBranch,
  ShieldCheck,
  BarChart3,
  Target,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

export default function ServicesPage() {
  const { t, language } = useApp();
  const lang = (language || "en").toLowerCase();

  const services = [
    {
      number: "01",
      title: lang.startsWith("te") 
        ? "1. వాయిస్ ఆజీవిక అంచనా" 
        : lang.startsWith("hi") 
        ? "1. वॉयस आजीविका मूल्यांकन" 
        : "1. Voice Livelihood Assessment",
      slug: "/services/voice-assessment",
      desc: lang.startsWith("te")
        ? "తెలుగు, హిందీ లేదా ఇంగ్లీషులో సహజంగా మాట్లాడండి. పెద్ద ఫారాలు నింపే అవసరం లేకుండా మీ నైపుణ్యాలను మరియు అనుభవాన్ని విశ్లేషిస్తుంది."
        : lang.startsWith("hi")
        ? "तेलुगु, हिन्दी या अंग्रेजी में स्वाभाविक रूप से बोलें। बिना लंबे फॉर्म भरे आपके अनौपचारिक कार्य अनुभव और लक्ष्यों का मूल्यांकन करता है।"
        : "Converse naturally in Telugu, Hindi, or English. Evaluates your informal trade experience and goals without tedious form-filling.",
      what: lang.startsWith("te")
        ? "ప్రాంతీయ AI వాయిస్ మోడల్స్ ద్వారా అభ్యర్థి మాటలను క్రమబద్ధమైన ప్రొఫైల్ డేటాగా మారుస్తుంది."
        : lang.startsWith("hi")
        ? "क्षेत्रीय एआई वॉयस मॉडल का उपयोग करके उम्मीदवार के भाषण को संरचित डेटा में परिवर्तित करता है।"
        : "Converts candidate speech to structured profile data using regional AI voice models.",
      why: lang.startsWith("te")
        ? "గ్రామీణ మరియు మొదటి తరం అభ్యాసకులకు డిజిటల్ మరియు అక్షరాస్యత అడ్డంకులను తొలగిస్తుంది."
        : lang.startsWith("hi")
        ? "ग्रामीण और पहली पीढ़ी के शिक्षार्थियों के लिए डिजिटल और साक्षरता संबंधी बाधाओं को समाप्त करता है।"
        : "Eliminates literacy and digital barriers for first-generation rural learners.",
      how: lang.startsWith("te")
        ? "మైక్రోఫోన్‌లో మాట్లాడటం ➔ స్పీచ్-టు-టెక్స్ట్ (STT) ➔ LLM సమాచార సంగ్రహణ."
        : lang.startsWith("hi")
        ? "माइक्रोफ़ोन में बोलना ➔ स्पीच-टू-टेक्स्ट (STT) ➔ एलएलएम द्वारा डेटा निष्कर्षण।"
        : "Speak into phone microphone ➔ Speech-to-Text (STT) ➔ LLM attribute extraction.",
      flowSteps: lang.startsWith("te")
        ? ["వాయిస్ ఇన్‌పుట్", "స్పీచ్-టు-టెక్స్ట్", "AI విశ్లేషణ", "ప్రొఫైల్ డేటా"]
        : lang.startsWith("hi")
        ? ["वॉयस इनपुट", "स्पीच-टू-टेक्स्ट", "एआई विश्लेषण", "संरचित प्रोफ़ाइल"]
        : ["Voice Input", "Speech-to-Text", "AI Processing", "Structured Profile"],
      icon: Mic,
      cta: lang.startsWith("te") 
        ? "వాయిస్ అసెస్‌మెంట్‌ను ప్రారంభించండి" 
        : lang.startsWith("hi") 
        ? "वॉयस मूल्यांकन शुरू करें" 
        : "Start Voice Assessment",
      // Very subtle lavender/blue tint
      cardBg: "bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/20",
      borderColor: "border-indigo-100 hover:border-indigo-300/80",
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
      ctaColor: "text-indigo-900 hover:text-indigo-950",
      microGraphic: (
        <div className="flex items-center gap-0.5 px-2 py-1 bg-indigo-50/70 border border-indigo-200/50 rounded-md">
          <div className="w-1 h-2 bg-indigo-400 rounded-full animate-pulse" />
          <div className="w-1 h-3.5 bg-indigo-600 rounded-full" />
          <div className="w-1 h-2.5 bg-indigo-500 rounded-full" />
          <div className="w-1 h-4 bg-indigo-600 rounded-full" />
          <div className="w-1 h-2 bg-indigo-400 rounded-full" />
        </div>
      ),
    },
    {
      number: "02",
      title: lang.startsWith("te")
        ? "2. ఆజీవిక మ్యాపింగ్"
        : lang.startsWith("hi")
        ? "2. आजीविका मैपिंग"
        : "2. Livelihood Mapping",
      slug: "/services/livelihood-mapping",
      desc: lang.startsWith("te")
        ? "ప్రస్తుత వ్యాపార అనుభవాన్ని పరిశ్రమల క్లస్టర్లలో ధృవీకరించబడిన వృత్తి పురోగతి మార్గాలకు మ్యాప్ చేస్తుంది."
        : lang.startsWith("hi")
        ? "वर्तमान कार्य पृष्ठभूमि को विभिन्न औद्योगिक समूहों में प्रमाणित करियर प्रगति मार्गों से जोड़ता है।"
        : "Traces current trade backgrounds to viable career progression routes across industry clusters.",
      what: lang.startsWith("te")
        ? "సాంప్రదాయ వృత్తులను అధిక వృద్ధి ఆర్థిక రంగాలతో అనుసంధానిస్తుంది."
        : lang.startsWith("hi")
        ? "पारंपरिक शिल्पों और अनौपचारिक कार्यों का उच्च-विकास वाले आर्थिक क्षेत्रों के सापेक्ष विश्लेषण करता है।"
        : "Analyzes traditional crafts and informal trades against high-growth economic sectors.",
      why: lang.startsWith("te")
        ? "తక్కువ వేతన కూలీ పని నుండి గుర్తింపు పొందిన వృత్తిపరమైన ఉద్యోగాలకు మారేందుకు వీలు కల్పిస్తుంది."
        : lang.startsWith("hi")
        ? "उम्मीदवारों को कम वेतन वाले श्रम से प्रमाणित व्यावसायिक भूमिकाओं में जाने में सक्षम बनाता है।"
        : "Enables candidates to transition from low-wage labor to certified vocational roles.",
      how: lang.startsWith("te")
        ? "నైపుణ్య ట్యాగ్‌లు ➔ ఆర్థిక క్లస్టర్ గ్రాఫ్ ➔ సమీప వృత్తి మార్గాలు."
        : lang.startsWith("hi")
        ? "कौशल टैग ➔ आर्थिक क्लस्टर ग्राफ ➔ निकटवर्ती व्यवसाय मार्ग।"
        : "Profile skill tags ➔ Economic cluster graph ➔ Adjacent occupation pathways.",
      flowSteps: lang.startsWith("te")
        ? ["నైపుణ్యాలు", "ప్రాంతం", "పరిశ్రమ క్లస్టర్", "కెరీర్ మార్గం"]
        : lang.startsWith("hi")
        ? ["कौशल", "स्थान", "उद्योग क्लस्टर", "करियर मार्ग"]
        : ["User Skills", "Location", "Industry Cluster", "Career Path"],
      icon: Compass,
      cta: lang.startsWith("te") 
        ? "ఆజీవిక మ్యాప్‌ను పరిశీలించండి" 
        : lang.startsWith("hi") 
        ? "आजीविका मानचित्र देखें" 
        : "Explore Livelihood Map",
      // Very subtle mint/green tint
      cardBg: "bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/20",
      borderColor: "border-emerald-100 hover:border-emerald-300/80",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      ctaColor: "text-emerald-900 hover:text-emerald-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50/70 border border-emerald-200/50 rounded-md text-[10px] font-semibold text-emerald-800">
          <MapPin className="w-3 h-3 text-emerald-600" />
          <span>Cluster</span>
        </div>
      ),
    },
    {
      number: "03",
      title: lang.startsWith("te")
        ? "3. స్కిల్-గ్యాప్ విశ్లేషణ"
        : lang.startsWith("hi")
        ? "3. कौशल अंतराल विश्लेषण"
        : "3. Skill-Gap Analysis",
      slug: "/services/skill-gap",
      desc: lang.startsWith("te")
        ? "మీ నైపుణ్యాలను ప్రామాణిక జాతీయ వృత్తిపరమైన ప్రమాణాలతో (NOS) సరిపోల్చుతుంది."
        : lang.startsWith("hi")
        ? "आपकी सत्यापित क्षमताओं की तुलना मानकीकृत राष्ट्रीय व्यावसायिक मानकों (NOS) से करता है।"
        : "Compares your verified abilities against standardized National Occupational Standards (NOS).",
      what: lang.startsWith("te")
        ? "మీకు ఇప్పటికే ఏ నైపుణ్యాలు ఉన్నాయో మరియు ఏవి నేర్చుకోవాలో ఖచ్చితంగా గుర్తిస్తుంది."
        : lang.startsWith("hi")
        ? "सटीक रूप से पहचान करता है कि आपके पास कौन सी दक्षताएं हैं और कौन से कौशल सीखने बाकी हैं।"
        : "Pinpoints exactly which competencies you possess and which skills are missing.",
      why: lang.startsWith("te")
        ? "అనవసరమైన పునఃశిక్షణను నివారిస్తుంది మరియు లక్ష్యిత కోర్సులను మాత్రమే సూచిస్తుంది."
        : lang.startsWith("hi")
        ? "अनावश्यक पुनः प्रशिक्षण को रोकता है और लक्षित पाठ्यक्रम सिफारिशें सुनिश्चित करता है।"
        : "Prevents redundant re-training and guarantees targeted course recommendations.",
      how: lang.startsWith("te")
        ? "అభ్యర్థి నైపుణ్యాలు ∩ కోర్సు NOS నైపుణ్యాలు ➔ గ్యాప్ డెల్టా స్కోరు."
        : lang.startsWith("hi")
        ? "उम्मीदवार कौशल ∩ पाठ्यक्रम NOS दक्षताएं ➔ अंतराल स्कोर।"
        : "Candidate skill set ∩ Course NOS competencies ➔ Gap delta score.",
      flowSteps: lang.startsWith("te")
        ? ["ప్రస్తుత నైపుణ్యాలు", "NOS ప్రమాణాలు", "స్కిల్ గ్యాప్", "కోర్సు సరిపోలిక"]
        : lang.startsWith("hi")
        ? ["वर्तमान कौशल", "एनओएस मानक", "कौशल अंतराल", "कोर्स मिलान"]
        : ["Current Skills", "NOS Standards", "Skill Gap", "Recommended Path"],
      icon: Layers,
      cta: lang.startsWith("te") 
        ? "NOS స్కిల్ గ్యాప్ మ్యాట్రిక్స్ చూడండి" 
        : lang.startsWith("hi") 
        ? "NOS कौशल अंतराल मैट्रिक्स देखें" 
        : "View NOS Skill Gap Matrix",
      // Very subtle peach/amber tint
      cardBg: "bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20",
      borderColor: "border-amber-100 hover:border-amber-300/80",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200/60",
      ctaColor: "text-amber-900 hover:text-amber-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-1 bg-amber-50/70 border border-amber-200/50 rounded-md text-[10px] font-semibold text-amber-800">
          <BarChart3 className="w-3 h-3 text-amber-600" />
          <span>Δ Matrix</span>
        </div>
      ),
    },
    {
      number: "04",
      title: lang.startsWith("te")
        ? "4. NSQF-సంబంధిత నైపుణ్యాభివృద్ధి"
        : lang.startsWith("hi")
        ? "4. एनएसक्यूएफ संरेखित कौशल प्रशिक्षण"
        : "4. NSQF-Aligned Skilling",
      slug: "/services/nsqf",
      desc: lang.startsWith("te")
        ? "నేషనల్ కౌన్సిల్ ఫర్ వొకేషనల్ ఎడ్యుకేషన్ (NCVET) ప్రమాణాలకు అనుగుణంగా గుర్తింపు పొందిన శిక్షణా కార్యక్రమాలు."
        : lang.startsWith("hi")
        ? "राष्ट्रीय व्यावसायिक शिक्षा परिषद (NCVET) मानकों के अनुरूप मान्यता प्राप्त प्रशिक्षण कार्यक्रम।"
        : "Accredited training programs conforming to National Council for Vocational Education (NCVET) standards.",
      what: lang.startsWith("te")
        ? "NSQF లెవెల్ 1 నుండి లెవెల్ 7 వరకు ఉన్న పాఠ్యప్రణాళికను అందిస్తుంది."
        : lang.startsWith("hi")
        ? "NSQF स्तर 1 से स्तर 7 तक संरेखित पाठ्यक्रम प्रदान करता है।"
        : "Curriculum aligned from NSQF Level 1 up to Level 7 qualifications.",
      why: lang.startsWith("te")
        ? "దేశవ్యాప్తంగా యజమానులు గుర్తించే ప్రభుత్వ సర్టిఫికేషన్లను అందజేస్తుంది."
        : lang.startsWith("hi")
        ? "अखिल भारतीय नियोक्ताओं द्वारा स्वीकृत सरकार-मान्यता प्राप्त प्रमाणपत्र प्रदान करता है।"
        : "Delivers government-recognized certifications accepted by pan-India employers.",
      how: lang.startsWith("te")
        ? "అభ్యర్థి విద్య & వయస్సు ➔ QP కోడ్‌ల ధృవీకరణ ➔ GIA గ్రాంట్ మద్దతు నిర్ధారణ."
        : lang.startsWith("hi")
        ? "उम्मीदवार शिक्षा एवं आयु ➔ QP कोड सत्यापन ➔ GIA अनुदान समर्थन पुष्टि।"
        : "Filters candidate education & age ➔ Validates QP codes ➔ Confirms GIA grant support.",
      flowSteps: lang.startsWith("te")
        ? ["అభ్యర్థి ప్రొఫైల్", "NSQF స్థాయి", "శిక్షణా కోర్సు", "సర్టిఫికేషన్"]
        : lang.startsWith("hi")
        ? ["उम्मीदवार प्रोफ़ाइल", "एनएसक्यूएफ स्तर", "प्रशिक्षण कोर्स", "प्रमाणपत्र"]
        : ["User Profile", "NSQF Level", "Relevant Course", "Certification"],
      icon: Award,
      cta: lang.startsWith("te") 
        ? "శిక్షణా కార్యక్రమాలను చూడండి" 
        : lang.startsWith("hi") 
        ? "प्रशिक्षण कार्यक्रम देखें" 
        : "Explore Training Programs",
      // Very subtle blue/lavender tint
      cardBg: "bg-gradient-to-br from-sky-50/40 via-white to-blue-50/20",
      borderColor: "border-sky-100 hover:border-sky-300/80",
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200/60",
      ctaColor: "text-sky-900 hover:text-sky-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-1 bg-sky-50/70 border border-sky-200/50 rounded-md text-[10px] font-bold text-sky-800">
          <ShieldCheck className="w-3 h-3 text-sky-600" />
          <span>L1–L7</span>
        </div>
      ),
    },
    {
      number: "05",
      title: lang.startsWith("te")
        ? "5. ప్రాంతీయ అవకాశాల గుర్తింపు"
        : lang.startsWith("hi")
        ? "5. क्षेत्रीय अवसर खोज"
        : "5. Opportunity Discovery",
      slug: "/services/opportunities",
      desc: lang.startsWith("te")
        ? "నైపుణ్య కోర్సులను జిల్లా స్థాయి ఉద్యోగ మరియు స్వయం ఉపాధి డిమాండ్‌తో అనుసంధానిస్తుంది."
        : lang.startsWith("hi")
        ? "कौशल मार्गों को वास्तविक जिला-स्तरीय रोजगार और स्वरोजगार की मांग से जोड़ता है।"
        : "Connects skilling pathways to actual district-level wage and self-employment demand.",
      what: lang.startsWith("te")
        ? "జిల్లా నైపుణ్యాభివృద్ధి ప్రణాళికలు (DSDP) మరియు PLFS డిమాండ్ డేటాను అనుసంధానిస్తుంది."
        : lang.startsWith("hi")
        ? "आवधिक श्रम बल सर्वेक्षण (PLFS) और जिला कौशल विकास योजनाओं (DSDP) को एकीकृत करता है।"
        : "Integrates Periodic Labour Force Survey (PLFS) and District Skill Development Plans (DSDP).",
      why: lang.startsWith("te")
        ? "శిక్షణ పూర్తి చేసిన వెంటనే స్థానికంగా నిజమైన ఉపాధి లభించేలా చూస్తుంది."
        : lang.startsWith("hi")
        ? "यह सुनिश्चित करता है कि प्रशिक्षण स्थानीय भूगोल में वास्तविक आय के अवसरों में परिवर्तित हो।"
        : "Ensures training translates into real income opportunities in the local geography.",
      how: lang.startsWith("te")
        ? "అభ్యర్థి జిల్లా ➔ పరిశ్రమ డిమాండ్ సంకేతాలు ➔ సమగ్ర ర్యాంకింగ్."
        : lang.startsWith("hi")
        ? "उम्मीदवार जिला ➔ उद्योग मांग संकेत ➔ समग्र मार्ग रैंकिंग।"
        : "Candidate district ➔ Industry demand signals ➔ Composite pathway ranking.",
      flowSteps: lang.startsWith("te")
        ? ["నైపుణ్యాలు", "జిల్లా డిమాండ్", "ఉపాధి / స్వయం ఉపాధి", "మార్కెట్ లింకేజ్"]
        : lang.startsWith("hi")
        ? ["कौशल", "जिला मांग", "रोजगार / स्वरोजगार", "मार्केट लिंकेज"]
        : ["Skills", "District Demand", "Jobs / Self-Emp", "Market Linkage"],
      icon: TrendingUp,
      cta: lang.startsWith("te") 
        ? "అవకాశాలను అన్వేషించండి" 
        : lang.startsWith("hi") 
        ? "अवसर खोजें" 
        : "Explore Opportunities",
      // Very subtle lavender tint
      cardBg: "bg-gradient-to-br from-purple-50/40 via-white to-fuchsia-50/20",
      borderColor: "border-purple-100 hover:border-purple-300/80",
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200/60",
      ctaColor: "text-purple-900 hover:text-purple-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-1 bg-purple-50/70 border border-purple-200/50 rounded-md text-[10px] font-semibold text-purple-800">
          <Target className="w-3 h-3 text-purple-600" />
          <span>DSDP</span>
        </div>
      ),
    },
    {
      number: "06",
      title: lang.startsWith("te")
        ? "6. పురోగతి మరియు ఫలితాల ట్రాకింగ్"
        : lang.startsWith("hi")
        ? "6. प्रगति एवं परिणाम ट्रैकिंग"
        : "6. Progress & Outcome Tracking",
      slug: "/services/progress",
      desc: lang.startsWith("te")
        ? "అంచనాలు, శిక్షణ ప్రవేశాలు మరియు ఉపాధి ఫలితాల యొక్క పారదర్శక రికార్డును నిర్వహిస్తుంది."
        : lang.startsWith("hi")
        ? "मूल्यांकन, प्रशिक्षण नामांकन और रोजगार परिणामों का एक ऑडिट-योग्य रिकॉर्ड बनाए रखता है।"
        : "Maintains an auditable record of assessments, training enrollments, and placement feedback.",
      what: lang.startsWith("te")
        ? "మొదటి వాయిస్ సంభాషణ నుండి కోర్సు పూర్తి వరకు అభ్యర్థి ప్రయాణాన్ని పర్యవేక్షిస్తుంది."
        : lang.startsWith("hi")
        ? "पहली वॉइस बातचीत से लेकर पाठ्यक्रम पूरा होने तक उम्मीदवार की यात्रा की निगरानी करता है।"
        : "Monitors candidate journey from first voice inquiry to course completion.",
      why: lang.startsWith("te")
        ? "PM-AJAY GIA భాగం కింద చట్టబద్ధమైన నివేదిక నిబంధనలను పూర్తి చేస్తుంది."
        : lang.startsWith("hi")
        ? "PM-AJAY GIA घटक के तहत वैधानिक रिपोर्टिंग आवश्यकताओं को पूरा करता है।"
        : "Fulfills statutory reporting requirements under the PM-AJAY GIA component.",
      how: lang.startsWith("te")
        ? "SQLite ఆడిట్ లెడ్జర్ ➔ మైలురాళ్ల స్థితి ట్రాకింగ్ ➔ ప్రోగ్రామ్ అధికారి డ్యాష్‌బోర్డులు."
        : lang.startsWith("hi")
        ? "SQLite ऑडिट लेज़र ➔ मील का पत्थर ट्रैकिंग ➔ कार्यक्रम अधिकारी डैशबोर्ड।"
        : "SQLite audit ledger ➔ Milestone status tracking ➔ Program officer dashboards.",
      flowSteps: lang.startsWith("te")
        ? ["వాయిస్ అంచనా", "శిక్షణ నమోదు", "ఉపాధి ఫలితం", "ఆడిట్ ఫీడ్‌బ్యాక్"]
        : lang.startsWith("hi")
        ? ["मूल्यांकन", "प्रशिक्षण नामांकन", "रोजगार परिणाम", "ऑडिट फीडबैक"]
        : ["Assessment", "Training", "Placement", "Feedback"],
      icon: CheckCircle2,
      cta: lang.startsWith("te") 
        ? "పురోగతిని ట్రాక్ చేయండి" 
        : lang.startsWith("hi") 
        ? "प्रगति ट्रैक करें" 
        : "Track Progress",
      // Very subtle teal/cyan tint
      cardBg: "bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/20",
      borderColor: "border-teal-100 hover:border-teal-300/80",
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200/60",
      ctaColor: "text-teal-900 hover:text-teal-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-1 bg-teal-50/70 border border-teal-200/50 rounded-md text-[10px] font-semibold text-teal-800">
          <GitBranch className="w-3 h-3 text-teal-600" />
          <span>Audited</span>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header - Identical clean government header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-blue-900 transition-colors">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t("nav.services", "Public Services")}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {t("services.title", "Government Public Service Architecture")}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {t("services.subtitle", "Six integrated public-service components designed to transition rural candidates from informal work into certified livelihood opportunities.")}
          </p>
        </div>

        {/* 6 Services Grid - 3x2 exactly matching order & layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className={`${s.cardBg} border ${s.borderColor} rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group`}
              >
                <div>
                  {/* Top Bar: Icon badge + Title + Micro illustration */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${s.badgeBg} flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {s.title}
                        </h3>
                      </div>
                    </div>
                    {/* Small professional illustration/badge */}
                    <div className="shrink-0 mt-0.5">
                      {s.microGraphic}
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {s.desc}
                  </p>

                  {/* Structured Internal Architecture Box */}
                  <div className="space-y-3 text-xs bg-white/85 p-3.5 rounded-xl border border-slate-200/70 shadow-2xs mb-4">
                    <div>
                      <span className="font-bold text-[10px] text-blue-900 tracking-wider uppercase block mb-0.5">
                        {t("services.what", "WHAT IT DOES")}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{s.what}</p>
                    </div>

                    <div>
                      <span className="font-bold text-[10px] text-emerald-800 tracking-wider uppercase block mb-0.5">
                        {t("services.why", "WHY IT MATTERS")}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{s.why}</p>
                    </div>

                    <div>
                      <span className="font-bold text-[10px] text-slate-600 tracking-wider uppercase block mb-1">
                        {t("services.how", "HOW IT WORKS")}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{s.how}</p>

                      {/* Visual Flow Mini-Pills */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {s.flowSteps.map((step, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span className="text-[10px] font-medium bg-slate-50 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs">
                              {step}
                            </span>
                            {sIdx < s.flowSteps.length - 1 && (
                              <span className="text-slate-400 text-[9px] font-bold">➔</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <Link
                    href={s.slug}
                    className={`text-xs font-bold ${s.ctaColor} inline-flex items-center gap-1.5 transition-colors group/link`}
                  >
                    <span>{s.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    PM-AJAY
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
