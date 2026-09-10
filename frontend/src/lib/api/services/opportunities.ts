export interface OpportunityItem {
  id: string;
  occupation: string;
  sector: string;
  location: {
    district: string;
    state: string;
  };
  opportunitySignal: "High Regional Demand" | "Moderate Demand" | "Emerging Demand" | "Self-Employment Potential";
  skillFit: number; // percentage e.g. 85
  requiredSkills: string[];
  trainingRequirement: string;
  opportunityType: "Wage Employment" | "Apprenticeship" | "Self-Employment / Micro-Enterprise";
  source: string;
  lastUpdated: string;
  isSaved?: boolean;
  display_occupation?: string;
  display_sector?: string;
  display_opportunitySignal?: string;
  display_requiredSkills?: string[];
  display_trainingRequirement?: string;
  display_opportunityType?: string;
  display_source?: string;
  display_district?: string;
  display_state?: string;
}

const opportunities_i18n: Record<string, {
  te: { occupation: string; sector: string; signal: string; skills: string[]; training: string; type: string; source: string; district: string; state: string };
  hi: { occupation: string; sector: string; signal: string; skills: string[]; training: string; type: string; source: string; district: string; state: string };
}> = {
  "opp-1": {
    te: {
      occupation: "ఎలక్ట్రిక్ వెహికల్ మెయింటెనెన్స్ టెక్నీషియన్",
      sector: "ఆటోమోటివ్ & స్వచ్ఛమైన ఇంధనం",
      signal: "అధిక ప్రాంతీయ డిమాండ్",
      skills: ["బ్యాటరీ డయాగ్నోస్టిక్స్", "హై-వోల్టేజ్ వైరింగ్", "మోటార్ ట్రబుల్‌షూటింగ్", "డిజిటల్ మల్టీమీటర్లు"],
      training: "ప్రభుత్వ ITI / గుర్తింపు పొందిన కేంద్రంలో NSQF స్థాయి 4 (450 గంటలు)",
      type: "వేతన ఉపాధి (ఉద్యోగం)",
      source: "APSSDC జిల్లా నైపుణ్య ప్రణాళిక 2025 & ప్రాంతీయ ఆటోమోటివ్ హబ్",
      district: "గుంటూరు",
      state: "ఆంధ్రప్రదేశ్"
    },
    hi: {
      occupation: "इलेक्ट्रिक वाहन रखरखाव तकनीशियन",
      sector: "ऑटोमोटिव एवं स्वच्छ ऊर्जा",
      signal: "उच्च क्षेत्रीय मांग",
      skills: ["बैटरी डायग्नोस्टिक्स", "उच्च-वोल्टेज वायरिंग", "मोटर समस्या निवारण", "डिजिटल मल्टीमीटर"],
      training: "सरकारी ITI / मान्यता प्राप्त केंद्र में NSQF स्तर 4 (450 घंटे)",
      type: "वेतनभोगी रोजगार",
      source: "APSSDC जिला कौशल योजना 2025 एवं क्षेत्रीय ऑटोमोटिव हब",
      district: "गुंटूर",
      state: "आंध्र प्रदेश"
    }
  },
  "opp-2": {
    te: {
      occupation: "సోలార్ PV రూఫ్‌టాప్ ఇన్‌స్టాలేషన్ సూపర్‌వైజర్",
      sector: "గ్రీన్ జాబ్స్ & పునరుత్పాదక ఇంధనం",
      signal: "అధిక ప్రాంతీయ డిమాండ్",
      skills: ["ఇన్వర్టర్ ఇన్‌స్టాలేషన్", "స్ట్రక్చరల్ మౌంటింగ్", "ఎర్తింగ్ & మెరుపు రక్షణ", "గ్రిడ్ సింక్రొనైజేషన్"],
      training: "NSQF స్థాయి 4 (సూర్యమిత్ర సర్టిఫైడ్ కోర్సు)",
      type: "వేతన ఉపాధి (ఉద్యోగం)",
      source: "నూతన మరియు పునరుత్పాదక ఇంధన మంత్రిత్వ శాఖ (MNRE) / గుంటూరు DIC",
      district: "గుంటూరు",
      state: "ఆంధ్రప్రదేశ్"
    },
    hi: {
      occupation: "सोलर पीवी रूफटॉप इंस्टॉलेशन सुपरवाइजर",
      sector: "हरित नौकरियां एवं नवीकरणीय ऊर्जा",
      signal: "उच्च क्षेत्रीय मांग",
      skills: ["इन्वर्टर स्थापना", "संरचनात्मक माउंटिंग", "अर्थिंग और तड़ित सुरक्षा", "ग्रिड सिंक्रोनाइज़ेशन"],
      training: "NSQF स्तर 4 (सूर्यमित्र प्रमाणित पाठ्यक्रम)",
      type: "वेतनभोगी रोजगार",
      source: "नवीन और नवीकरणीय ऊर्जा मंत्रालय (MNRE) / गुंटूर DIC",
      district: "गुंटूर",
      state: "आंध्र प्रदेश"
    }
  },
  "opp-3": {
    te: {
      occupation: "గృహ విద్యుత్ వైరింగ్ & సబ్‌స్టేషన్ హెల్పర్",
      sector: "విద్యుత్ & నిర్మాణం",
      signal: "మితమైన డిమాండ్",
      skills: ["సింగిల్-ఫేజ్ వైరింగ్", "కండ్యూట్ పైపింగ్", "సర్క్యూట్ బ్రేకర్ పరీక్ష", "భద్రతా ఎర్తింగ్"],
      training: "NSQF స్థాయి 3 (300 గంటలు) లేదా RPL సర్టిఫికేషన్",
      type: "వేతన ఉపాధి (ఉద్యోగం)",
      source: "APCPDCL స్థానిక కాంట్రాక్టర్ల రోస్టర్",
      district: "కృష్ణా",
      state: "ఆంధ్రప్రదేశ్"
    },
    hi: {
      occupation: "घरेलू विद्युत वायरिंग एवं सबस्टेशन सहायक",
      sector: "विद्युत एवं निर्माण",
      signal: "मध्यम मांग",
      skills: ["सिंगल-फेज वायरिंग", "कंड्यूट पाइपिंग", "सर्किट ब्रेकर परीक्षण", "सुरक्षा अर्थिंग"],
      training: "NSQF स्तर 3 (300 घंटे) या RPL प्रमाणन",
      type: "वेतनभोगी रोजगार",
      source: "APCPDCL स्थानीय ठेकेदार रोस्टर",
      district: "कृष्णा",
      state: "आंध्र प्रदेश"
    }
  },
  "opp-4": {
    te: {
      occupation: "స్వతంత్ర ఎలక్ట్రికల్ & ఉపకరణాల మరమ్మతు సంస్థ",
      sector: "ఎలక్ట్రానిక్స్ & మరమ్మతు సేవలు",
      signal: "స్వయం ఉపాధి సామర్థ్యం",
      skills: ["ఉపకరణాల PCB డయాగ్నోస్టిక్స్", "మోటార్ రీవైండింగ్", "కస్టమర్ బిల్లింగ్", "టూల్ ఇన్వెంటరీ"],
      training: "NSQF స్థాయి 4 + PM-AJAY EDP మాడ్యూల్",
      type: "స్వయం ఉపాధి / సూక్ష్మ సంస్థ",
      source: "జిల్లా పరిశ్రమల కేంద్రం (DIC) MSME రిజిస్ట్రీ",
      district: "గుంటూరు",
      state: "ఆంధ్రప్రదేశ్"
    },
    hi: {
      occupation: "स्वतंत्र विद्युत एवं उपकरण मरम्मत उद्यम",
      sector: "इलेक्ट्रॉनिक्स एवं मरम्मत सेवाएं",
      signal: "स्वरोजगार क्षमता",
      skills: ["उपकरण पीसीबी डायग्नोस्टिक्स", "मोटर रिवाइंडिंग", "ग्राहक बिलिंग", "टूल इन्वेंटरी"],
      training: "NSQF स्तर 4 + PM-AJAY EDP मॉड्यूल",
      type: "स्वरोजगार / सूक्ष्म उद्यम",
      source: "जिला उद्योग केंद्र (DIC) MSME रजिस्ट्री",
      district: "गुंटूर",
      state: "आंध्र प्रदेश"
    }
  },
  "opp-5": {
    te: {
      occupation: "పారిశ్రామిక ఆటోమేషన్ నిర్వహణ సహాయకుడు",
      sector: "క్యాపిటల్ గూడ్స్ & తయారీ",
      signal: "అభివృద్ధి చెందుతున్న డిమాండ్",
      skills: ["PLC లాడర్ ప్రాథమిక అంశాలు", "సెన్సార్ క్రమాంకనం", "న్యూమాటిక్ వ్యవస్థలు", "పారిశ్రామిక భద్రత (PPE)"],
      training: "NSQF స్థాయి 5 (600 గంటలు)",
      type: "అప్రెంటిస్‌షిప్",
      source: "నేషనల్ అప్రెంటిస్‌షిప్ ప్రమోషన్ స్కీమ్ (NAPS) పోర్టల్",
      district: "విశాఖపట్నం",
      state: "ఆంధ్రప్రదేశ్"
    },
    hi: {
      occupation: "औद्योगिक स्वचालन रखरखाव सहायक",
      sector: "पूंजीगत सामान एवं विनिर्माण",
      signal: "उभरती हुई मांग",
      skills: ["पीएलसी लैडर मूल बातें", "सेंसर अंशांकन", "वायवीय प्रणाली", "औद्योगिक सुरक्षा (PPE)"],
      training: "NSQF स्तर 5 (600 घंटे)",
      type: "शिक्षुता (Apprenticeship)",
      source: "राष्ट्रीय शिक्षुता संवर्धन योजना (NAPS) पोर्टल",
      district: "विशाखापत्तनम",
      state: "आंध्र प्रदेश"
    }
  }
};

export const sampleOpportunities: OpportunityItem[] = [
  {
    id: "opp-1",
    occupation: "Electric Vehicle Maintenance Technician",
    sector: "Automotive & Clean Energy",
    location: { district: "Guntur", state: "Andhra Pradesh" },
    opportunitySignal: "High Regional Demand",
    skillFit: 82,
    requiredSkills: ["Battery diagnostics", "High-voltage wiring", "Motor troubleshooting", "Digital multimeters"],
    trainingRequirement: "NSQF Level 4 (450 Hours) at Government ITI / Accredited Center",
    opportunityType: "Wage Employment",
    source: "APSSDC District Skill Plan 2025 & Regional Automotive Hub",
    lastUpdated: "2025-02-15"
  },
  {
    id: "opp-2",
    occupation: "Solar PV Rooftop Installation Supervisor",
    sector: "Green Jobs & Renewable Energy",
    location: { district: "Guntur", state: "Andhra Pradesh" },
    opportunitySignal: "High Regional Demand",
    skillFit: 78,
    requiredSkills: ["Inverter installation", "Structural mounting", "Earthing & lightning protection", "Grid synchronization"],
    trainingRequirement: "NSQF Level 4 (Suryamitra Certified Course)",
    opportunityType: "Wage Employment",
    source: "Ministry of New and Renewable Energy (MNRE) / Guntur DIC",
    lastUpdated: "2025-02-10"
  },
  {
    id: "opp-3",
    occupation: "Domestic Electrical Wiring & Substation Helper",
    sector: "Power & Construction",
    location: { district: "Krishna", state: "Andhra Pradesh" },
    opportunitySignal: "Moderate Demand",
    skillFit: 90,
    requiredSkills: ["Single-phase wiring", "Conduit piping", "Circuit breaker testing", "Safety earthing"],
    trainingRequirement: "NSQF Level 3 (300 Hours) or RPL Certification",
    opportunityType: "Wage Employment",
    source: "APCPDCL Local Contractor Roster",
    lastUpdated: "2025-01-28"
  },
  {
    id: "opp-4",
    occupation: "Independent Electrical & Appliance Repair Enterprise",
    sector: "Electronics & Repair Services",
    location: { district: "Guntur", state: "Andhra Pradesh" },
    opportunitySignal: "Self-Employment Potential",
    skillFit: 85,
    requiredSkills: ["Appliance PCB diagnostics", "Motor rewinding", "Customer billing", "Tool inventory"],
    trainingRequirement: "NSQF Level 4 + PM-AJAY EDP Module",
    opportunityType: "Self-Employment / Micro-Enterprise",
    source: "District Industries Centre (DIC) MSME Registry",
    lastUpdated: "2025-02-01"
  },
  {
    id: "opp-5",
    occupation: "Industrial Automation Maintenance Assistant",
    sector: "Capital Goods & Manufacturing",
    location: { district: "Visakhapatnam", state: "Andhra Pradesh" },
    opportunitySignal: "Emerging Demand",
    skillFit: 68,
    requiredSkills: ["PLC ladder basics", "Sensor calibration", "Pneumatic systems", "Industrial safety (PPE)"],
    trainingRequirement: "NSQF Level 5 (600 Hours)",
    opportunityType: "Apprenticeship",
    source: "National Apprenticeship Promotion Scheme (NAPS) Portal",
    lastUpdated: "2025-02-18"
  }
];

export function getLocalizedOpportunities(lang: string = "en"): OpportunityItem[] {
  const l = (lang || "en").toLowerCase();
  return sampleOpportunities.map((opp) => {
    const loc = opportunities_i18n[opp.id];
    if (loc) {
      if (l.startsWith("te")) {
        return {
          ...opp,
          display_occupation: loc.te.occupation,
          display_sector: loc.te.sector,
          display_opportunitySignal: loc.te.signal,
          display_requiredSkills: loc.te.skills,
          display_trainingRequirement: loc.te.training,
          display_opportunityType: loc.te.type,
          display_source: loc.te.source,
          display_district: loc.te.district,
          display_state: loc.te.state
        };
      } else if (l.startsWith("hi")) {
        return {
          ...opp,
          display_occupation: loc.hi.occupation,
          display_sector: loc.hi.sector,
          display_opportunitySignal: loc.hi.signal,
          display_requiredSkills: loc.hi.skills,
          display_trainingRequirement: loc.hi.training,
          display_opportunityType: loc.hi.type,
          display_source: loc.hi.source,
          display_district: loc.hi.district,
          display_state: loc.hi.state
        };
      }
    }
    return {
      ...opp,
      display_occupation: opp.occupation,
      display_sector: opp.sector,
      display_opportunitySignal: opp.opportunitySignal,
      display_requiredSkills: opp.requiredSkills,
      display_trainingRequirement: opp.trainingRequirement,
      display_opportunityType: opp.opportunityType,
      display_source: opp.source,
      display_district: opp.location.district,
      display_state: opp.location.state
    };
  });
}

export const opportunitiesService = {
  async getOpportunities(filter?: {
    state?: string;
    district?: string;
    sector?: string;
    type?: string;
  }, lang: string = "en"): Promise<OpportunityItem[]> {
    let result = getLocalizedOpportunities(lang);
    if (filter?.sector && filter.sector !== "All") {
      result = result.filter(o => o.sector.toLowerCase().includes(filter.sector!.toLowerCase()) || (o.display_sector && o.display_sector.toLowerCase().includes(filter.sector!.toLowerCase())));
    }
    if (filter?.district && filter.district !== "All") {
      result = result.filter(o => o.location.district.toLowerCase() === filter.district!.toLowerCase() || (o.display_district && o.display_district.toLowerCase() === filter.district!.toLowerCase()));
    }
    if (filter?.type && filter.type !== "All") {
      result = result.filter(o => o.opportunityType.toLowerCase() === filter.type!.toLowerCase() || (o.display_opportunityType && o.display_opportunityType.toLowerCase() === filter.type!.toLowerCase()));
    }
    return result;
  },

  saveOpportunity(id: string): void {
    if (typeof window === "undefined") return;
    const saved = JSON.parse(localStorage.getItem("sih_saved_opps") || "[]");
    if (!saved.includes(id)) {
      saved.push(id);
      localStorage.setItem("sih_saved_opps", JSON.stringify(saved));
    }
  },

  getSavedOpportunityIds(): string[] {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("sih_saved_opps") || "[]");
  }
};
