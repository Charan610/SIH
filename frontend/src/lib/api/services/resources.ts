export interface ResourceItem {
  id: string;
  title: string;
  shortDescription: string;
  category: "NSQF" | "PM-AJAY" | "GIA" | "Skills" | "Training" | "Government Schemes" | "User Guides" | "FAQs";
  source: string;
  lastUpdated: string;
  fileType?: "PDF" | "Document" | "Portal Link" | "FAQ";
  downloadUrl?: string;
  content?: string;
  display_title?: string;
  display_shortDescription?: string;
  display_source?: string;
  display_category?: string;
}

const resources_i18n: Record<string, { te: { title: string; desc: string; source: string; cat: string }; hi: { title: string; desc: string; source: string; cat: string } }> = {
  "res-1": {
    te: {
      title: "PM-AJAY చట్టబద్ధమైన కార్యాచరణ మార్గదర్శకాలు (GIA విభాగం)",
      desc: "PM-AJAY కింద గ్రాంట్-ఇన్-ఎయిడ్ (GIA) విభాగం సమగ్ర నిబంధనలు, అర్హత ప్రమాణాలు మరియు ఆర్థిక కేటాయింపులు.",
      source: "సామాజిక న్యాయం మరియు సాధికారత మంత్రిత్వ శాఖ (MoSJE)",
      cat: "PM-AJAY"
    },
    hi: {
      title: "PM-AJAY वैधानिक परिचालन दिशानिर्देश (GIA घटक)",
      desc: "PM-AJAY के तहत सहायता अनुदान (GIA) घटक के व्यापक नियम, पात्रता मानदंड और वित्तीय आवंटन।",
      source: "सामाजिक न्याय और अधिकारिता मंत्रालय (MoSJE)",
      cat: "PM-AJAY"
    }
  },
  "res-2": {
    te: {
      title: "GIA గ్రాంట్-ఇన్-ఎయిడ్ ఆర్థిక నిబంధనలు మరియు ఉపకార వేతన (స్టైపెండ్) వివరాలు",
      desc: "అర్హత కలిగిన SC లబ్ధిదారులకు స్టైపెండ్‌లు, బోర్డింగ్ రాయితీలు మరియు శిక్షణ ఖర్చుల రీయింబర్స్‌మెంట్ పట్టిక.",
      source: "MoSJE పథక విభాగం",
      cat: "GIA"
    },
    hi: {
      title: "GIA सहायता अनुदान वित्तीय मानदंड एवं वजीफा (Stipend) विवरण",
      desc: "पात्र SC लाभार्थियों के लिए वजीफा, आवास सब्सिडी और प्रशिक्षण लागत प्रतिपूर्ति की अनुसूची।",
      source: "MoSJE योजना प्रकोष्ठ",
      cat: "GIA"
    }
  },
  "res-3": {
    te: {
      title: "నేషనల్ స్కిల్స్ క్వాలిఫికేషన్ ఫ్రేమ్‌వర్క్ (NSQF) గెజిట్ నోటిఫికేషన్",
      desc: "సామర్థ్య స్థాయిలు 1 నుండి 10 వరకు, పరిజ్ఞానం, నైపుణ్యాలు మరియు బాధ్యతలకు సంబంధించిన గెజిట్ ప్రమాణాలు.",
      source: "నేషనల్ కౌన్సిల్ ఫర్ వొకేషనల్ ఎడ్యుకేషన్ అండ్ ట్రైనింగ్ (NCVET)",
      cat: "NSQF"
    },
    hi: {
      title: "राष्ट्रीय कौशल योग्यता फ्रेमवर्क (NSQF) राजपत्र अधिसूचना",
      desc: "योग्यता स्तर 1 से 10, ज्ञान, कौशल और जिम्मेदारी के लिए वर्णक विवरण देने वाले राजपत्र मानक।",
      source: "व्यावसायिक शिक्षा और प्रशिक्षण के लिए राष्ट्रीय परिषद (NCVET)",
      cat: "NSQF"
    }
  },
  "res-4": {
    te: {
      title: "ఆటోమోటివ్ & ఎలక్ట్రిక్ వెహికల్ QP-NOS అర్హత సమాహారం",
      desc: "టూ-వీలర్/త్రీ-వీలర్ EV మరమ్మతు మరియు డయాగ్నోస్టిక్ టెక్నీషియన్ల కోసం అర్హత ప్యాక్‌లు మరియు జాతీయ వృత్తిపరమైన ప్రమాణాలు (NOS).",
      source: "ఆటోమోటివ్ స్కిల్స్ డెవలప్‌మెంట్ కౌన్సిల్ (ASDC)",
      cat: "నైపుణ్యాలు"
    },
    hi: {
      title: "ऑटोमोटिव एवं इलेक्ट्रिक वाहन QP-NOS योग्यता संग्रह",
      desc: "दोपहिया/तिपहिया ईवी मरम्मत और नैदानिक तकनीशियनों के लिए योग्यता पैक और राष्ट्रीय व्यावसायिक मानक।",
      source: "ऑटोमोटिव कौशल विकास परिषद (ASDC)",
      cat: "कौशल"
    }
  },
  "res-5": {
    te: {
      title: "గుర్తింపు పొందిన ప్రభుత్వ ITI శిక్షణా కేంద్రాల డైరెక్టరీ (ఆంధ్రప్రదేశ్ & తెలంగాణ)",
      desc: "అనుబంధ శిక్షణా భాగస్వాములు, కేంద్ర కోడ్‌లు, అందుబాటులో ఉన్న వర్క్‌షాప్ సాధనాలు మరియు బ్యాచ్ కోటాల జాబితా.",
      source: "డైరెక్టరేట్ జనరల్ ఆఫ్ ట్రైనింగ్ (DGT)",
      cat: "శిక్షణ"
    },
    hi: {
      title: "मान्यता प्राप्त सरकारी ITI प्रशिक्षण केंद्र निर्देशिका (आंध्र प्रदेश एवं तेलंगाना)",
      desc: "संबद्ध प्रशिक्षण भागीदारों, केंद्र कोड, उपलब्ध कार्यशाला उपकरणों और बैच कोटा की सूची।",
      source: "प्रशिक्षण महानिदेशालय (DGT)",
      cat: "प्रशिक्षण"
    }
  },
  "res-6": {
    te: {
      title: "ప్రధాన మంత్రి కౌశల్ వికాస్ యోజన (PMKVY 4.0) అనుసంధాన మార్గదర్శకాలు",
      desc: "PM-AJAY లబ్ధిదారులు మరియు PMKVY స్వల్పకాలిక శిక్షణా కేంద్రాల మధ్య క్రెడిట్ సమన్వయ విధానాలు.",
      source: "నైపుణ్యాభివృద్ధి మరియు వ్యవస్థాపకత మంత్రిత్వ శాఖ (MSDE)",
      cat: "ప్రభుత్వ పథకాలు"
    },
    hi: {
      title: "प्रधानमंत्री कौशल विकास योजना (PMKVY 4.0) समन्वय दिशानिर्देश",
      desc: "PM-AJAY लाभार्थियों और PMKVY अल्पकालिक प्रशिक्षण सुविधाओं के बीच क्रेडिट संरेखण प्रक्रियाएं।",
      source: "कौशल विकास और उद्यमिता मंत्रालय (MSDE)",
      cat: "सरकारी योजनाएं"
    }
  },
  "res-7": {
    te: {
      title: "SC చేతివృత్తుల వారి కోసం స్టాండ్ అప్ ఇండియా & NSFDC మైక్రో క్రెడిట్ రాయితీలు",
      desc: "స్వతంత్ర ఎలక్ట్రికల్ మరియు మెకానికల్ మరమ్మతు వర్క్‌షాప్‌లను ఏర్పాటు చేయడానికి రాయితీతో కూడిన రుణ మరియు వర్కింగ్ క్యాపిటల్ సాయం.",
      source: "నేషనల్ షెడ్యూల్డ్ క్యాస్ట్స్ ఫైనాన్స్ అండ్ డెవలప్‌మెంట్ కార్పొరేషన్ (NSFDC)",
      cat: "ప్రభుత్వ పథకాలు"
    },
    hi: {
      title: "SC कारीगरों के लिए स्टैंड अप इंडिया एवं NSFDC सूक्ष्म-ऋण रियायतें",
      desc: "स्वतंत्र विद्युत और यांत्रिक मरम्मत कार्यशालाएं स्थापित करने के लिए रियायती सावधि ऋण और कार्यशील पूंजी सहायता।",
      source: "राष्ट्रीय अनुसूचित जाति वित्त एवं विकास निगम (NSFDC)",
      cat: "सरकारी योजनाएं"
    }
  },
  "res-8": {
    te: {
      title: "లబ్ధిదారుల గైడ్: ప్రాంతీయ వాయిస్ అసిస్టెంట్‌ను ఎలా ఉపయోగించాలి",
      desc: "తెలుగు లేదా హిందీలో మాట్లాడటం, ప్రొఫైల్‌ను సమీక్షించడం మరియు NSQF కోర్సులను ఎంచుకోవడం గురించిన వివరణ.",
      source: "మంత్రిత్వ శాఖ ప్రజా సుగమ్యత విభాగం",
      cat: "వినియోగదారు గైడ్లు"
    },
    hi: {
      title: "लाभार्थी मार्गदर्शिका: क्षेत्रीय वॉइस सहायक का उपयोग कैसे करें",
      desc: "तेलुगु या हिंदी में वॉइस सहायक से बात करने, निकाली गई प्रोफ़ाइल की समीक्षा करने और पाठ्यक्रमों को नेविगेट करने के चरण-दर-चरण निर्देश।",
      source: "मंत्रालय सार्वजनिक सुगमता प्रभाग",
      cat: "उपयोगकर्ता गाइड"
    }
  },
  "res-9": {
    te: {
      title: "తరచుగా అడిగే ప్రశ్నలు (FAQ): అర్హత, ఆదాయ రుజువు & సర్టిఫికేషన్ చెల్లుబాటు",
      desc: "కులం ధృవీకరణ, ఆదాయ ధృవీకరణ పత్రం నిబంధనలు, హాజరు పరిమితులు మరియు NCVET సర్టిఫికెట్ పంపిణీకి సంబంధించిన సమాధానాలు.",
      source: "PM-AJAY రాష్ట్ర అమలు మిషన్",
      cat: "ప్రశ్నోత్తరాలు"
    },
    hi: {
      title: "अक्सर पूछे जाने वाले प्रश्न (FAQ): पात्रता, आय प्रमाण एवं प्रमाणन वैधता",
      desc: "जाति सत्यापन, आय प्रमाण पत्र मानदंड, उपस्थिति सीमा और NCVET प्रमाणपत्र वितरण से संबंधित सामान्य प्रश्नों के उत्तर।",
      source: "PM-AJAY राज्य कार्यान्वयन मिशन",
      cat: "अक्सर पूछे जाने वाले प्रश्न"
    }
  }
};

export const resourcesCatalog: ResourceItem[] = [
  {
    id: "res-1",
    title: "PM-AJAY Statutory Operational Guidelines (GIA Component)",
    shortDescription: "Comprehensive rules, eligibility criteria, and financial allocations for the Grant-in-Aid component under PM-AJAY.",
    category: "PM-AJAY",
    source: "Ministry of Social Justice and Empowerment (MoSJE)",
    lastUpdated: "2024-08-01",
    fileType: "PDF",
    downloadUrl: "#"
  },
  {
    id: "res-2",
    title: "GIA Grant-in-Aid Financial Norms & Stipend Details",
    shortDescription: "Schedule of stipends, boarding subsidies, and training cost reimbursements for eligible SC beneficiaries.",
    category: "GIA",
    source: "MoSJE Scheme Cell",
    lastUpdated: "2024-05-12",
    fileType: "PDF",
    downloadUrl: "#"
  },
  {
    id: "res-3",
    title: "National Skills Qualification Framework (NSQF) Gazette Notification",
    shortDescription: "Gazette standards detailing competency levels 1 to 10, descriptors for knowledge, skills, and responsibility.",
    category: "NSQF",
    source: "National Council for Vocational Education and Training (NCVET)",
    lastUpdated: "2023-11-20",
    fileType: "PDF",
    downloadUrl: "#"
  },
  {
    id: "res-4",
    title: "Automotive & Electric Vehicle QP-NOS Qualification Compendium",
    shortDescription: "Qualification packs and National Occupational Standards for two-wheeler/three-wheeler EV repair and diagnostic technicians.",
    category: "Skills",
    source: "Automotive Skills Development Council (ASDC)",
    lastUpdated: "2024-09-15",
    fileType: "PDF",
    downloadUrl: "#"
  },
  {
    id: "res-5",
    title: "Accredited Government ITI Training Centers Directory (AP & Telangana)",
    shortDescription: "List of affiliated training partners, center codes, available workshop tools, and batch intake quotas.",
    category: "Training",
    source: "Directorate General of Training (DGT)",
    lastUpdated: "2025-01-10",
    fileType: "PDF",
    downloadUrl: "#"
  },
  {
    id: "res-6",
    title: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0) Convergence Guidelines",
    shortDescription: "Procedures for credit alignment between PM-AJAY beneficiaries and PMKVY short-term training facilities.",
    category: "Government Schemes",
    source: "Ministry of Skill Development and Entrepreneurship (MSDE)",
    lastUpdated: "2024-06-30",
    fileType: "PDF",
    downloadUrl: "#"
  },
  {
    id: "res-7",
    title: "Stand Up India & NSFDC Micro-Credit Concessions for SC Artisans",
    shortDescription: "Subsidized term loans and working capital assistance for setting up independent electrical and mechanical repair workshops.",
    category: "Government Schemes",
    source: "National Scheduled Castes Finance and Development Corporation (NSFDC)",
    lastUpdated: "2024-10-18",
    fileType: "PDF",
    downloadUrl: "#"
  },
  {
    id: "res-8",
    title: "Beneficiary Guide: How to Use the Vernacular Voice Assistant",
    shortDescription: "Step-by-step instructions on speaking to the voice assistant in Telugu or Hindi, reviewing extracted profiles, and navigating courses.",
    category: "User Guides",
    source: "Ministry Public Accessibility Division",
    lastUpdated: "2025-02-01",
    fileType: "Document",
    downloadUrl: "#"
  },
  {
    id: "res-9",
    title: "Frequently Asked Questions: Eligibility, Income Proof & Certification Validity",
    shortDescription: "Answers to common questions regarding caste verification, income certificate norms, attendance thresholds, and NCVET certificate delivery.",
    category: "FAQs",
    source: "PM-AJAY State Implementation Mission",
    lastUpdated: "2025-01-20",
    fileType: "FAQ",
    downloadUrl: "#"
  }
];

export function getLocalizedResources(lang: string = "en"): ResourceItem[] {
  const l = (lang || "en").toLowerCase();
  return resourcesCatalog.map((item) => {
    const loc = resources_i18n[item.id];
    if (loc) {
      if (l.startsWith("te")) {
        return {
          ...item,
          display_title: loc.te.title,
          display_shortDescription: loc.te.desc,
          display_source: loc.te.source,
          display_category: loc.te.cat
        };
      } else if (l.startsWith("hi")) {
        return {
          ...item,
          display_title: loc.hi.title,
          display_shortDescription: loc.hi.desc,
          display_source: loc.hi.source,
          display_category: loc.hi.cat
        };
      }
    }
    return {
      ...item,
      display_title: item.title,
      display_shortDescription: item.shortDescription,
      display_source: item.source,
      display_category: item.category
    };
  });
}

export const resourcesService = {
  async getResources(category?: string, lang: string = "en"): Promise<ResourceItem[]> {
    const localized = getLocalizedResources(lang);
    if (!category || category === "All") return localized;
    return localized.filter(r => r.category.toLowerCase() === category.toLowerCase() || (r.display_category && r.display_category.toLowerCase() === category.toLowerCase()));
  },

  getCategories(): string[] {
    return ["All", "NSQF", "PM-AJAY", "GIA", "Skills", "Training", "Government Schemes", "User Guides", "FAQs"];
  }
};
