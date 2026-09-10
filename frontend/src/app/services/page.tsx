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
  Target
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
        ? ["वॉयस इनपुट", "स्पीच-టు-టెక్స్ట్", "एआई विश्लेषण", "संरचित प्रोफ़ाइल"]
        : ["Voice Input", "Speech-to-Text", "AI Processing", "Structured Profile"],
      icon: Mic,
      cta: lang.startsWith("te") 
        ? "వాయిస్ అసెస్‌మెంట్‌ను ప్రారంభించండి" 
        : lang.startsWith("hi") 
        ? "वॉयस मूल्यांकन शुरू करें" 
        : "Start Voice Assessment",
      iconBg: "bg-blue-50 text-blue-600 border-blue-200/80",
      ctaColor: "text-blue-900 hover:text-blue-950",
      microGraphic: (
        <div className="flex items-center gap-0.5 px-2 py-1 bg-blue-50/80 border border-blue-200/60 rounded-md">
          <div className="w-1 h-2 bg-blue-400 rounded-full animate-pulse" />
          <div className="w-1 h-3.5 bg-blue-600 rounded-full" />
          <div className="w-1 h-2 bg-blue-500 rounded-full" />
          <div className="w-1 h-4 bg-blue-600 rounded-full" />
          <div className="w-1 h-2 bg-blue-400 rounded-full" />
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
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
      ctaColor: "text-emerald-900 hover:text-emerald-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50/90 border border-emerald-200/80 rounded-full text-[10px] font-semibold text-emerald-800">
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
        : "Candidate skill set ➔ Course NOS competencies ➔ Gap data score.",
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
      iconBg: "bg-amber-50 text-amber-700 border-amber-200/80",
      ctaColor: "text-amber-900 hover:text-amber-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50/90 border border-amber-200/80 rounded-full text-[10px] font-semibold text-amber-800">
          <BarChart3 className="w-3 h-3 text-amber-600" />
          <span>Matrix</span>
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
        ? "గుర్తించిన నైపుణ్య అంతరాలను NSQF స్థాయిలు మరియు సర్టిఫికేషన్లతో మ్యాప్ చేస్తుంది."
        : lang.startsWith("hi")
        ? "पहचाने गए कौशल अंतरालों को एनएसक्यूएफ स्तरों और प्रमाणित योग्यताओं में मैप करता है।"
        : "Maps identified skill gaps to NSQF levels and certified qualifications.",
      why: lang.startsWith("te")
        ? "జాతీయంగా గుర్తింపు పొందిన పరిశ్రమ సంబంధిత నైపుణ్యాలను నిర్ధారిస్తుంది."
        : lang.startsWith("hi")
        ? "राष्ट्रीय स्तर पर मान्यता प्राप्त और उद्योग-प्रासंगिक कौशल सुनिश्चित करता है।"
        : "Ensures nationally recognized and industry-relevant skilling.",
      how: lang.startsWith("te")
        ? "స్కిల్ గ్యాప్ ➔ NSQF లెవెల్ మ్యాపింగ్ ➔ ట్రైనింగ్ భాగస్వామి మ్యాచ్."
        : lang.startsWith("hi")
        ? "कौशल अंतराल ➔ एनएसक्यूएफ स्तर मिलान ➔ प्रशिक्षण भागीदार मिलान।"
        : "Skill gap ➔ NSQF level mapping ➔ Training partner match.",
      flowSteps: lang.startsWith("te")
        ? ["అభ్యర్థి ప్రొఫైల్", "NSQF స్థాయి", "శిక్షణా కోర్సు", "సర్టిఫికేషన్"]
        : lang.startsWith("hi")
        ? ["उम्मीदवार प्रोफ़ाइल", "एनएसक्यूएफ स्तर", "प्रशिक्षण कोर्स", "प्रमाणपत्र"]
        : ["User Profile", "NSQF Level", "Relevant Course", "Certification"],
      icon: Award,
      cta: lang.startsWith("te") 
        ? "NSQF కోర్సులను చూడండి" 
        : lang.startsWith("hi") 
        ? "एनएसक्यूएफ पाठ्यक्रम देखें" 
        : "View NSQF Courses",
      iconBg: "bg-purple-50 text-purple-600 border-purple-200/80",
      ctaColor: "text-purple-900 hover:text-purple-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50/90 border border-purple-200/80 rounded-full text-[10px] font-bold text-purple-800">
          <ShieldCheck className="w-3 h-3 text-purple-600" />
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
        ? "నైపుణ్య మార్గాలను నిజమైన జిల్లా స్థాయి వేతన మరియు స్వయం ఉపాధి డిమాండ్‌తో అనుసంధానిస్తుంది."
        : lang.startsWith("hi")
        ? "कौशल मार्गों को वास्तविक जिला-स्तरीय वेतन और स्वरोजगार मांग से जोड़ता है।"
        : "Connects skilling pathways to actual district level wage and self-employment demand.",
      what: lang.startsWith("te")
        ? "ధృవీకరించబడిన మూలాల నుండి స్థానిక ఉద్యోగ మరియు వ్యాపార అవకాశాలను సేకరిస్తుంది."
        : lang.startsWith("hi")
        ? "सत्यापित स्रोतों से स्थानीय नौकरी और उद्यम अवसरों को सामने लाता है।"
        : "Pulls local job and enterprise opportunities from verified sources.",
      why: lang.startsWith("te")
        ? "ఉపాధి అవకాశాలను పెంచుతుంది మరియు స్థానిక జీవనోపాధికి మద్దతు ఇస్తుంది."
        : lang.startsWith("hi")
        ? "रोजगार क्षमता बढ़ाता है और स्थानीय आजीविका का समर्थन करता है।"
        : "Increases employability and supports local livelihoods.",
      how: lang.startsWith("te")
        ? "ప్రాంత ఫిల్టర్ ➔ అవకాశాల డేటాబేస్ ➔ ఉత్తమ సరిపోలిక ర్యాంకింగ్."
        : lang.startsWith("hi")
        ? "स्थान फ़िल्टर ➔ अवसर डेटाबेस ➔ सर्वश्रेष्ठ मिलान रैंकिंग।"
        : "Location filter ➔ Opportunity database ➔ Best match ranking.",
      flowSteps: lang.startsWith("te")
        ? ["నైపుణ్యాలు", "జిల్లా డిమాండ్", "ఉపాధి అవకాశాలు", "మార్కెట్ లింకేజ్"]
        : lang.startsWith("hi")
        ? ["कौशल", "जिला मांग", "अवसर", "मार्केट लिंकेज"]
        : ["Skills", "District Demand", "Jobs / Self-Emp", "Market Linkage"],
      icon: TrendingUp,
      cta: lang.startsWith("te") 
        ? "అవకాశాలను అన్వేషించండి" 
        : lang.startsWith("hi") 
        ? "अवसर खोजें" 
        : "Explore Opportunities",
      iconBg: "bg-sky-50 text-sky-600 border-sky-200/80",
      ctaColor: "text-sky-900 hover:text-sky-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-sky-50/90 border border-sky-200/80 rounded-full text-[10px] font-semibold text-sky-800">
          <Target className="w-3 h-3 text-sky-600" />
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
        ? "मूल्यांकन, प्रशिक्षण नामांकन और प्लेसमेंट फीडबैक का एक ऑडिट योग्य रिकॉर्ड बनाए रखता है।"
        : "Maintains an auditable record of assessments, training enrollments, and placement feedback.",
      what: lang.startsWith("te")
        ? "శిక్షణ పూర్తి, ఉపాధి మరియు జీవనోపాధి పురోగతిని ట్రాక్ చేస్తుంది."
        : lang.startsWith("hi")
        ? "प्रशिक्षण पूरा होने, प्लेसमेंट और आजीविका की प्रगति को ट्रैक करता है।"
        : "Tracks training completion, placement and livelihood progress.",
      why: lang.startsWith("te")
        ? "డేటా ఆధారిత నిర్ణయాలు మరియు జవాబుదారీతనాన్ని సాధ్యం చేస్తుంది."
        : lang.startsWith("hi")
        ? "डेटा-संचालित निर्णय और जवाबदेही सक्षम बनाता है।"
        : "Enables data-driven decisions and accountability.",
      how: lang.startsWith("te")
        ? "స్థితి అప్‌డేట్ ➔ మైలురాళ్ల ట్రాకింగ్ ➔ నివేదికలు రూపొందించడం."
        : lang.startsWith("hi")
        ? "स्थिति अपडेट ➔ मील के पत्थर ट्रैक ➔ रिपोर्ट तैयार करना।"
        : "Update status ➔ Track milestones ➔ Generate reports.",
      flowSteps: lang.startsWith("te")
        ? ["వాయిస్ అంచనా", "శిక్షణ నమోదు", "ఉపాధి ఫలితం", "ఆడిట్ ఫీడ్‌బ్యాక్"]
        : lang.startsWith("hi")
        ? ["मूल्यांकन", "प्रशिक्षण नामांकन", "प्लेसमेंट", "फीडबैक"]
        : ["Assessment", "Training", "Placement", "Feedback"],
      icon: CheckCircle2,
      cta: lang.startsWith("te") 
        ? "ట్రాకింగ్ డ్యాష్‌బోర్డ్ చూడండి" 
        : lang.startsWith("hi") 
        ? "ट्रैकिंग डैशबोर्ड देखें" 
        : "View Tracking Dashboard",
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
      ctaColor: "text-emerald-900 hover:text-emerald-950",
      microGraphic: (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50/90 border border-emerald-200/80 rounded-full text-[10px] font-semibold text-emerald-800">
          <GitBranch className="w-3 h-3 text-emerald-600" />
          <span>Audited</span>
        </div>
      ),
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full flex flex-col justify-between overflow-x-hidden bg-sky-100">
      {/* 
        Scenic Background Image:
        Rural landscape with prominent mountains in depth, morning sun on the horizon, 
        green rolling hills, small houses, and rural workers.
      */}
      <div 
        className="absolute inset-0 bg-cover bg-bottom pointer-events-none fixed-layer"
        style={{ 
          backgroundImage: "url('/images/rural_hero_bg.jpg')",
          backgroundAttachment: "scroll"
        }}
      />

      {/* Atmospheric depth overlays for soft mountain haze & sun rays */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-100/60 via-white/30 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 w-[550px] h-[550px] bg-amber-200/25 blur-3xl rounded-full pointer-events-none" />

      {/* Main Container hosting ONLY the 6 Services Cards */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-36">
        {/* 6 Services Grid - 3 columns x 2 rows, matching screenshot exactly */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-white/92 backdrop-blur-md border border-slate-200/85 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Icon circle + Title + Micro-badge graphic */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center border shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <h2 className="text-[15px] font-bold text-slate-900 leading-snug tracking-tight">
                        {s.title}
                      </h2>
                    </div>
                    {/* Micro badge (Cluster, Matrix, L1-L7, DSDP, Audited, Voice wave) */}
                    <div className="shrink-0 mt-0.5">
                      {s.microGraphic}
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="text-[11.5px] text-slate-600 leading-relaxed mb-3.5">
                    {s.desc}
                  </p>

                  {/* Structured Internal Architecture Box (WHAT IT DOES / WHY IT MATTERS / HOW IT WORKS) */}
                  <div className="space-y-2.5 text-xs bg-slate-50/75 p-3 rounded-xl border border-slate-200/70 mb-4">
                    <div>
                      <span className="font-bold text-[9.5px] text-slate-700 tracking-wider uppercase block mb-0.5">
                        {t("services.what", "WHAT IT DOES")}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {s.what}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-[9.5px] text-slate-700 tracking-wider uppercase block mb-0.5">
                        {t("services.why", "WHY IT MATTERS")}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {s.why}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-[9.5px] text-slate-700 tracking-wider uppercase block mb-0.5">
                        {t("services.how", "HOW IT WORKS")}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                        {s.how}
                      </p>

                      {/* Visual Pipeline Pills */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {s.flowSteps.map((step, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span className="text-[9.5px] font-medium bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                              {step}
                            </span>
                            {sIdx < s.flowSteps.length - 1 && (
                              <span className="text-slate-400 text-[8.5px] font-bold">➔</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: CTA Link + PM-AJAY */}
                <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
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
      </main>
    </div>
  );
}
