/**
 * frontend/src/lib/voice/guidedVoiceEngine.ts
 * 
 * Modular Guided Question-by-Question Voice Interaction Engine.
 * 
 * Architecture:
 * - Strictly discrete turns: ASK -> LISTEN -> AUTO STOP -> PROCESS -> ACKNOWLEDGE -> NEXT QUESTION.
 * - Dynamic context-aware branching (Student, Farmer, Senior Citizen, Healthcare, Artisan/Worker).
 * - Multi-piece entity extraction from natural speech.
 * - Multilingual native question definitions, localized suggestions, and audio utterances.
 */

import { LanguageCode } from "@/types/api";

export type GuidedAssistantState =
  | "INTRO"
  | "QUESTION_DISPLAYED"
  | "LISTENING"
  | "ANSWER_CAPTURED"
  | "PROCESSING"
  | "UNCLEAR"
  | "COMPLETED";

export type LivelihoodPathCategory =
  | "student"
  | "farmer"
  | "senior"
  | "healthcare"
  | "artisan_worker"
  | "general";

export interface TurnHistoryItem {
  questionId: string;
  questionText: string;
  answerText: string;
  category?: LivelihoodPathCategory;
}

export interface SessionProfileContext {
  name?: string;
  location?: string;
  occupation?: string;
  category: LivelihoodPathCategory;
  specificNeed?: string;
  history: TurnHistoryItem[];
}

export interface QuestionPrompt {
  id: string;
  stepNumber: number;
  totalSteps: number;
  acknowledgment?: Record<LanguageCode, string>;
  question: Record<LanguageCode, string>;
  suggestionsHeader: Record<LanguageCode, string>;
  suggestions: Record<LanguageCode, string[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-lingual Guided Questions Definition
// ─────────────────────────────────────────────────────────────────────────────

export const GUIDED_QUESTIONS_CATALOG: {
  INTRO: {
    title: Record<LanguageCode, string>;
    subtitle: Record<LanguageCode, string>;
    startBtn: Record<LanguageCode, string>;
  };
  NAME_STEP: QuestionPrompt;
  LOCATION_STEP: QuestionPrompt;
  OCCUPATION_STEP: QuestionPrompt;
  BRANCH_STEPS: Record<LivelihoodPathCategory, QuestionPrompt>;
  CONFIRM_STEP: QuestionPrompt;
} = {
  INTRO: {
    title: {
      en: "Guided Public Voice Assistant",
      te: "మార్గదర్శక పబ్లిక్ వాయిస్ అసిస్టెంట్",
      hi: "मार्गदर्शित सार्वजनिक वॉयस सहायक",
    },
    subtitle: {
      en: "Let's get started. I'll ask you a few simple questions one by one.",
      te: "ప్రారంభిద్దాం. నేను మిమ్మల్ని ఒకదాని తర్వాత ఒకటి కొన్ని సులభమైన ప్రశ్నలు అడుగుతాను.",
      hi: "आइए शुरू करते हैं। मैं आपसे एक-एक करके कुछ सरल प्रश्न पूछूँगा।",
    },
    startBtn: {
      en: "Start Question-by-Question Voice Session",
      te: "ప్రశ్న-సమాధానాల వాయిస్ సెషన్ ప్రారంభించండి",
      hi: "प्रश्न-उत्तर वॉयस सत्र शुरू करें",
    },
  },

  // Q1: Name
  NAME_STEP: {
    id: "name",
    stepNumber: 1,
    totalSteps: 5,
    question: {
      en: "What is your name?",
      te: "మీ పేరు ఏమిటి?",
      hi: "आपका नाम क्या है?",
    },
    suggestionsHeader: {
      en: "You can say:",
      te: "మీరు ఇలా చెప్పవచ్చు:",
      hi: "आप ऐसा कह सकते हैं:",
    },
    suggestions: {
      en: ["My name is Ravi", "I'm Priya", "My name is Arun Kumar"],
      te: ["నా పేరు రవి.", "నా పేరు ప్రియ.", "నా పేరు అరుణ్ కుమార్."],
      hi: ["मेरा नाम रवि है।", "मेरा नाम प्रिया है।", "मेरा नाम अरुण कुमार है।"],
    },
  },

  // Q2: Location
  LOCATION_STEP: {
    id: "location",
    stepNumber: 2,
    totalSteps: 5,
    acknowledgment: {
      en: "Nice to meet you, {name}.",
      te: "నమస్కారం {name} గారూ.",
      hi: "नमस्ते {name} जी।",
    },
    question: {
      en: "Where do you currently live?",
      te: "మీరు ప్రస్తుతం ఎక్కడ నివసిస్తున్నారు?",
      hi: "आप वर्तमान में कहाँ रहते हैं?",
    },
    suggestionsHeader: {
      en: "You can say:",
      te: "మీరు ఇలా చెప్పవచ్చు:",
      hi: "आप ऐसा कह सकते हैं:",
    },
    suggestions: {
      en: ["I live in Bhimavaram", "I live in Vijayawada", "I live in Hyderabad"],
      te: ["నేను భీమవరంలో ఉంటాను.", "నేను విజయవాడలో ఉంటాను.", "నేను హైదరాబాదులో ఉంటాను."],
      hi: ["मैं भीमावरम में रहता हूँ।", "मैं विजयवाड़ा में रहता हूँ।", "मैं हैदराबाद में रहता हूँ।"],
    },
  },

  // Q3: Occupation & Role (Branching trigger)
  OCCUPATION_STEP: {
    id: "occupation",
    stepNumber: 3,
    totalSteps: 5,
    acknowledgment: {
      en: "Thank you, {name}. I've noted that you are in {location}.",
      te: "ధన్యవాదాలు {name} గారూ. మీరు {location} లో ఉన్నట్లు గుర్తించాను.",
      hi: "धन्यवाद {name} जी। मैंने दर्ज कर लिया है कि आप {location} में रहते हैं।",
    },
    question: {
      en: "What do you do or what is your current role?",
      te: "మీరు ఏమి చేస్తుంటారు లేదా మీ ప్రస్తుత వృత్తి ఏమిటి?",
      hi: "आप क्या काम करते हैं या आपकी वर्तमान भूमिका क्या है?",
    },
    suggestionsHeader: {
      en: "You can say:",
      te: "మీరు ఇలా చెప్పవచ్చు:",
      hi: "आप ऐसा कह सकते हैं:",
    },
    suggestions: {
      en: [
        "I am a student.",
        "I am a farmer.",
        "I am a senior citizen.",
        "I work in a private company.",
        "I am an artisan / self-employed.",
      ],
      te: [
        "నేను విద్యార్థిని.",
        "నేను రైతును.",
        "నేను వయోవృద్ధుడిని (సీనియర్ సిటిజన్).",
        "నేను ప్రైవేట్ కంపెనీలో పనిచేస్తున్నాను.",
        "నేను చేతివృత్తిదారుడిని / స్వయం ఉపాధి.",
      ],
      hi: [
        "मैं एक छात्र हूँ।",
        "मैं एक किसान हूँ।",
        "मैं एक वरिष्ठ नागरिक हूँ।",
        "मैं एक निजी कंपनी में काम करता हूँ।",
        "मैं एक कारीगर / स्वरोज़गार हूँ।",
      ],
    },
  },

  // Branch Specific Q4
  BRANCH_STEPS: {
    // Path A: Student
    student: {
      id: "student_path",
      stepNumber: 4,
      totalSteps: 5,
      acknowledgment: {
        en: "Great! Education and skill building open valuable opportunities.",
        te: "చాలా బాగుంది! విద్య మరియు నైపుణ్య శిక్షణ ద్వారా మంచి అవకాశాలు లభిస్తాయి.",
        hi: "बहुत बढ़िया! शिक्षा और कौशल प्रशिक्षण से कई नए अवसर खुलते हैं।",
      },
      question: {
        en: "Since you are a student, what type of education or career assistance are you looking for?",
        te: "మీరు విద్యార్థి కాబట్టి, మీకు ఎలాంటి విద్యా లేదా ఉద్యోగ నైపుణ్యాల సహాయం కావాలి?",
        hi: "चूंकि आप एक छात्र हैं, आप किस प्रकार की शिक्षा या करियर सहायता चाहते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I need scholarship support.",
          "I want IT and computer software training.",
          "I want free apprenticeship with stipend.",
          "I want degree / higher education counseling.",
        ],
        te: [
          "నాకు స్కాలర్‌షిప్ సహాయం కావాలి.",
          "నాకు ఐటీ & కంప్యూటర్ సాఫ్ట్‌వేర్ శిక్షణ కావాలి.",
          "నాకు స్టైపెండ్‌తో కూడిన ఉచిత అప్రెంటిస్‌షిప్ కావాలి.",
          "నాకు ఉన్నత విద్యా / డిగ్రీ మార్గదర్శకత్వం కావాలి.",
        ],
        hi: [
          "मुझे छात्रवृत्ति सहायता की आवश्यकता है।",
          "मुझे आईटी और कंप्यूटर सॉफ्टवेयर प्रशिक्षण चाहिए।",
          "मुझे स्टाइपेंड के साथ मुफ्त अप्रेंटिसशिप चाहिए।",
          "मुझे उच्च शिक्षा / डिग्री मार्गदर्शन चाहिए।",
        ],
      },
    },

    // Path B: Farmer / Agriculture
    farmer: {
      id: "farmer_path",
      stepNumber: 4,
      totalSteps: 5,
      acknowledgment: {
        en: "Thank you. Farmers are the foundation of our community.",
        te: "ధన్యవాదాలు. వ్యవసాయదారులు మన దేశానికి అన్నదాతలు.",
        hi: "धन्यवाद। किसान हमारे समाज की आधारशिला हैं।",
      },
      question: {
        en: "Since you are a farmer in {location}, which agricultural assistance or training do you need?",
        te: "మీరు {location} లో వ్యవసాయం చేస్తున్నారు కాబట్టి, మీకు ఏ పథకం లేదా శిక్షణ అవసరం?",
        hi: "चूंकि आप {location} में एक किसान हैं, आपको किस कृषि सहायता या प्रशिक्षण की आवश्यकता है?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I want PM-KISAN and fertilizer subsidy.",
          "I want crop insurance and drone training.",
          "I want organic farming certification.",
          "I want dairy and animal husbandry support.",
        ],
        te: [
          "నాకు పీఎం-కిసాన్ మరియు ఎరువుల రాయితీ కావాలి.",
          "నాకు పంట బీమా మరియు డ్రోన్ శిక్షణ కావాలి.",
          "నాకు సేంద్రీయ వ్యవసాయ సర్టిఫికేషన్ కావాలి.",
          "నాకు పాడి పరిశ్రమ మరియు పశుసంవర్ధక సహాయం కావాలి.",
        ],
        hi: [
          "मुझे पीएम-किसान और उर्वरक सब्सिडी चाहिए।",
          "मुझे फसल बीमा और कृषि ड्रोन प्रशिक्षण चाहिए।",
          "मुझे जैविक खेती प्रमाणन चाहिए।",
          "मुझे डेयरी और पशुपालन सहायता चाहिए।",
        ],
      },
    },

    // Path C: Senior Citizen
    senior: {
      id: "senior_path",
      stepNumber: 4,
      totalSteps: 5,
      acknowledgment: {
        en: "Respectful greetings. We prioritize senior citizen welfare and security.",
        te: "నమస్కారాలు. వయోవృద్ధుల సంక్షేమం మరియు సామాజిక భద్రతకు అత్యధిక ప్రాధాన్యత ఉంది.",
        hi: "सादर प्रणाम। वरिष्ठ नागरिकों के कल्याण और सुरक्षा को सर्वोच्च प्राथमिकता दी जाती है।",
      },
      question: {
        en: "Which specific pension or senior welfare service would you like to access?",
        te: "మీరు ఏ నిర్దిష్ట పింఛను లేదా వయోవృద్ధుల సంక్షేమ సేవను పొందాలనుకుంటున్నారు?",
        hi: "आप किस विशिष्ट पेंशन या वरिष्ठ कल्याण सेवा का लाभ लेना चाहते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I want to apply for old age pension.",
          "I need digital life certificate (Jeevan Pramaan).",
          "I want to check my pension disbursement status.",
          "I need free senior healthcare assistance.",
        ],
        te: [
          "నేను వృద్ధాప్య పింఛను కోసం దరఖాస్తు చేసుకోవాలనుకుంటున్నాను.",
          "నాకు జీవన్ ప్రమాణ్ డిజిటల్ లైఫ్ సర్టిఫికెట్ కావాలి.",
          "నా పింఛను విడుదల స్థితిని తనిఖీ చేయాలనుకుంటున్నాను.",
          "నాకు ఉచిత వయోవృద్ధుల వైద్య సహాయం కావాలి.",
        ],
        hi: [
          "मैं वृद्धावस्था पेंशन के लिए आवेदन करना चाहता हूँ।",
          "मुझे डिजिटल जीवन प्रमाण पत्र (जीवन प्रमाण) चाहिए।",
          "मैं अपनी पेंशन वितरण स्थिति की जांच करना चाहता हूँ।",
          "मुझे मुफ्त वरिष्ठ स्वास्थ्य सहायता चाहिए।",
        ],
      },
    },

    // Path D: Healthcare
    healthcare: {
      id: "healthcare_path",
      stepNumber: 4,
      totalSteps: 5,
      acknowledgment: {
        en: "Understood. Access to health coverage is essential for every family.",
        te: "అర్థమైంది. ప్రతి కుటుంబానికి సరసమైన ఆరోగ్య సంరక్షణ అత్యంత ఆవశ్యకం.",
        hi: "समझ गया। हर परिवार के लिए सुलभ स्वास्थ्य सेवा अत्यंत आवश्यक है।",
      },
      question: {
        en: "What kind of healthcare coverage or treatment assistance are you seeking?",
        te: "మీరు ఎలాంటి ఆరోగ్య బీమా లేదా చికిత్సా సహాయం కోసం చూస్తున్నారు?",
        hi: "आप किस प्रकार की स्वास्थ्य बीमा या उपचार सहायता चाहते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I want Ayushman Bharat card (5 Lakh cover).",
          "I need free hospital surgery and treatment.",
          "I need low-cost generic medicines (Jan Aushadhi).",
          "I need maternal and child health support.",
        ],
        te: [
          "నాకు ఆయుష్మాన్ భారత్ కార్డు (₹5 లక్షల కవర్) కావాలి.",
          "నాకు ఉచిత ఆసుపత్రి శస్త్రచికిత్స & వైద్యం కావాలి.",
          "నాకు జన్ ఔషధి తక్కువ ధర మందులు కావాలి.",
          "నాకు తల్లీబిడ్డల ఆరోగ్య పథకం సహాయం కావాలి.",
        ],
        hi: [
          "मुझे आयुष्मान भारत कार्ड (₹5 लाख कवर) चाहिए।",
          "मुझे मुफ्त अस्पताल सर्जरी और उपचार चाहिए।",
          "मुझे सस्ती जेनेरिक दवाइयां (जन औषधि) चाहिए।",
          "मुझे मातृ एवं शिशु स्वास्थ्य सहायता चाहिए।",
        ],
      },
    },

    // Path E: Artisan / Self-Employed / Skilled Worker
    artisan_worker: {
      id: "artisan_path",
      stepNumber: 4,
      totalSteps: 5,
      acknowledgment: {
        en: "Excellent. Skilled craftspeople and self-employed workers power the local economy.",
        te: "చాలా సంతోషం. చేతివృత్తులు మరియు నైపుణ్య కార్మికులు స్థానిక ఆర్థికాభివృద్ధికి చోదకశక్తి.",
        hi: "बहुत अच्छा। कुशल कारीगर और स्वरोज़गार कामगार स्थानीय अर्थव्यवस्था की रीढ़ हैं।",
      },
      question: {
        en: "What support or certified skilling would help your trade or enterprise grow?",
        te: "మీ వృత్తి లేదా వ్యాపారాన్ని అభివృద్ధి చేయడానికి ఏ నైపుణ్య శిక్షణ లేదా సహాయం అవసరం?",
        hi: "आपके हुनर या व्यवसाय को बढ़ाने के लिए किस प्रकार के प्रशिक्षण या सहायता की आवश्यकता है?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I want PM Vishwakarma tool toolkit grant and loan.",
          "I want government NSQF trade certificate.",
          "I want solar & electrical repair training.",
          "I want micro-enterprise credit under Mudra.",
        ],
        te: [
          "నాకు పీఎం విశ్వకర్మ టూల్‌కిట్ గ్రాంట్ & రుణం కావాలి.",
          "నాకు ప్రభుత్వ NSQF సర్టిఫైడ్ వృత్తి కోర్సు కావాలి.",
          "నాకు సోలార్ & ఎలక్ట్రికల్ మరమ్మతు శిక్షణ కావాలి.",
          "నాకు ముద్రా పథకం క్రింద చిరు వ్యాపార రుణం కావాలి.",
        ],
        hi: [
          "मुझे पीएम विश्वकर्मा टूलकिट अनुदान और ऋण चाहिए।",
          "मुझे सरकारी NSQF ट्रेड प्रमाण पत्र चाहिए।",
          "मुझे सोलर और इलेक्ट्रिकल मरम्मत प्रशिक्षण चाहिए।",
          "मुझे मुद्रा योजना के तहत लघु उद्योग ऋण चाहिए।",
        ],
      },
    },

    // General Fallback
    general: {
      id: "general_path",
      stepNumber: 4,
      totalSteps: 5,
      acknowledgment: {
        en: "Thank you for sharing your background.",
        te: "మీ నేపథ్యాన్ని పంచుకున్నందుకు ధన్యవాదాలు.",
        hi: "अपनी पृष्ठभूमि साझा करने के लिए धन्यवाद।",
      },
      question: {
        en: "What service or government skilling program are you looking for today?",
        te: "ఈ రోజు మీరు ఏ ప్రభుత్వ పథకం లేదా నైపుణ్య శిక్షణ కోసం చూస్తున్నారు?",
        hi: "आज आप किस सरकारी योजना या कौशल कार्यक्रम की तलाश कर रहे हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I want to apply for a government skilling scheme.",
          "I need information about NSQF trade certification.",
          "I want to check my scheme application status.",
          "I want livelihood opportunities in my district.",
        ],
        te: [
          "నేను ప్రభుత్వ నైపుణ్య పథకానికి దరఖాస్తు చేయాలనుకుంటున్నాను.",
          "నాకు NSQF వృత్తి ధృవీకరణ వివరాలు కావాలి.",
          "నా దరఖాస్తు స్థితిని తెలుసుకోవాలనుకుంటున్నాను.",
          "నా జిల్లాలో జీవనోపాధి అవకాశాలు తెలుసుకోవాలనుకుంటున్నాను.",
        ],
        hi: [
          "मैं सरकारी कौशल योजना के लिए आवेदन करना चाहता हूँ।",
          "मुझे NSQF ट्रेड प्रमाणन के बारे में जानकारी चाहिए।",
          "मैं अपनी योजना आवेदन स्थिति देखना चाहता हूँ।",
          "मुझे अपने जिले में आजीविका के अवसर चाहिए।",
        ],
      },
    },
  },

  // Q5: Confirmation / Process Trigger
  CONFIRM_STEP: {
    id: "confirmation",
    stepNumber: 5,
    totalSteps: 5,
    acknowledgment: {
      en: "All details captured accurately.",
      te: "అన్ని వివరాలు స్పష్టంగా నమోదు చేయబడ్డాయి.",
      hi: "सभी विवरण स्पष्ट रूप से दर्ज कर लिए गए हैं।",
    },
    question: {
      en: "Would you like me to process your profile and generate verified recommendations?",
      te: "మీ వివరాలను ప్రాసెస్ చేసి, అర్హత గల పథకాలు & శిక్షణా కోర్సులను రూపొందించమంటారా?",
      hi: "क्या आप चाहते हैं कि मैं आपकी प्रोफ़ाइल प्रोसेस करके उपयुक्त योजनाएं व कोर्स दिखाऊं?",
    },
    suggestionsHeader: {
      en: "You can say:",
      te: "మీరు ఇలా చెప్పవచ్చు:",
      hi: "आप ऐसा कह सकते हैं:",
    },
    suggestions: {
      en: [
        "Yes, generate my recommendations.",
        "Yes, proceed with PM-AJAY skilling.",
        "Review my answers first.",
      ],
      te: [
        "అవును, నా సిఫార్సులను చూపించండి.",
        "అవును, పీఎం-అజయ్ నైపుణ్యాలతో కొనసాగించండి.",
        "నా సమాధానాలను సరిచూసుకోండి.",
      ],
      hi: [
        "हाँ, मेरी सिफारिशें दिखाएं।",
        "हाँ, पीएम-अजय कौशल के साथ आगे बढ़ें।",
        "पहले मेरे उत्तरों की समीक्षा करें।",
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Natural Language Entity & Intent Analyzer
// ─────────────────────────────────────────────────────────────────────────────

export function analyzeTurnResponse(
  rawText: string,
  currentStepId: string,
  currentContext: SessionProfileContext
): {
  extractedName?: string;
  extractedLocation?: string;
  detectedCategory?: LivelihoodPathCategory;
  specificNeed?: string;
  acknowledgedGreeting: string;
} {
  const textLower = rawText.toLowerCase().trim();
  const res: {
    extractedName?: string;
    extractedLocation?: string;
    detectedCategory?: LivelihoodPathCategory;
    specificNeed?: string;
    acknowledgedGreeting: string;
  } = {
    acknowledgedGreeting: "",
  };

  // 1. Name extraction
  if (currentStepId === "name" || !currentContext.name) {
    const namePatterns = [
      /(?:my name is|i am|i'm|this is|call me)\s+([a-zA-Z\u0C00-\u0C7F\u0900-\u097F]+(?:\s+[a-zA-Z\u0C00-\u0C7F\u0900-\u097F]+)?)/i,
      /(?:నా పేరు|నేను)\s+([a-zA-Z\u0C00-\u0C7F]+(?:\s+[a-zA-Z\u0C00-\u0C7F]+)?)/i,
      /(?:मेरा नाम|मैं हूँ|मैं)\s+([a-zA-Z\u0900-\u097F]+(?:\s+[a-zA-Z\u0900-\u097F]+)?)/i,
    ];

    for (const pat of namePatterns) {
      const match = rawText.match(pat);
      if (match && match[1]) {
        res.extractedName = match[1].trim().replace(/[.,!]/g, "");
        break;
      }
    }

    if (!res.extractedName && currentStepId === "name") {
      // Direct single/double word fallback
      const words = rawText.replace(/[.,!]/g, "").trim().split(/\s+/);
      if (words.length <= 3 && words.length > 0) {
        res.extractedName = words.join(" ");
      }
    }
  }

  // 2. Multi-piece Location extraction
  const locKeywords = [
    "bhimavaram", "vijayawada", "hyderabad", "guntur", "visakhapatnam", 
    "tirupati", "kurnool", "nellore", "delhi", "mumbai", "warangal", "andhra", 
    "telangana", "భీమవరం", "విజయవాడ", "హైదరాబాద్", "గుంటూరు", "విశాఖపట్నం", 
    "भीमावरम", "विजयवाड़ा", "हैदराबाद", "गुंटूर"
  ];
  for (const loc of locKeywords) {
    if (textLower.includes(loc.toLowerCase())) {
      res.extractedLocation = loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }

  // 3. Category / Intent Detection
  if (
    textLower.includes("student") ||
    textLower.includes("study") ||
    textLower.includes("college") ||
    textLower.includes("school") ||
    textLower.includes("degree") ||
    textLower.includes("విద్యార్థి") ||
    textLower.includes("చదువు") ||
    textLower.includes("छात्र") ||
    textLower.includes("पढ़ाई")
  ) {
    res.detectedCategory = "student";
  } else if (
    textLower.includes("farmer") ||
    textLower.includes("farming") ||
    textLower.includes("agriculture") ||
    textLower.includes("crop") ||
    textLower.includes("cultivat") ||
    textLower.includes("రైతు") ||
    textLower.includes("వ్యవసాయం") ||
    textLower.includes("పంట") ||
    textLower.includes("किसान") ||
    textLower.includes("खेती")
  ) {
    res.detectedCategory = "farmer";
  } else if (
    textLower.includes("senior") ||
    textLower.includes("pension") ||
    textLower.includes("old age") ||
    textLower.includes("elder") ||
    textLower.includes("రిటైర్") ||
    textLower.includes("పింఛను") ||
    textLower.includes("వృద్ధ") ||
    textLower.includes("वृद्ध") ||
    textLower.includes("पेंशन")
  ) {
    res.detectedCategory = "senior";
  } else if (
    textLower.includes("health") ||
    textLower.includes("hospital") ||
    textLower.includes("ayushman") ||
    textLower.includes("doctor") ||
    textLower.includes("treatment") ||
    textLower.includes("ఆరోగ్య") ||
    textLower.includes("ఆసుపత్రి") ||
    textLower.includes("చికిత్స") ||
    textLower.includes("स्वास्थ्य") ||
    textLower.includes("अस्पताल")
  ) {
    res.detectedCategory = "healthcare";
  } else if (
    textLower.includes("artisan") ||
    textLower.includes("electrician") ||
    textLower.includes("plumber") ||
    textLower.includes("mechanic") ||
    textLower.includes("carpenter") ||
    textLower.includes("tailor") ||
    textLower.includes("trade") ||
    textLower.includes("vishwakarma") ||
    textLower.includes("చేతివృత్తి") ||
    textLower.includes("ఎలక్ట్రీషియన్") ||
    textLower.includes("कारीगर") ||
    textLower.includes("मैकेनिक") ||
    textLower.includes("स्वरोज़गार")
  ) {
    res.detectedCategory = "artisan_worker";
  }

  // 4. Specific Need extraction
  if (currentStepId.includes("path") || currentStepId === "occupation") {
    res.specificNeed = rawText.trim();
  }

  return res;
}

/**
 * Generates an empathetic, natural conversational acknowledgment
 * referencing prior facts (e.g. "Nice to meet you, Ravi", "Since you're a farmer in Bhimavaram...")
 */
export function formatAcknowledgment(
  template: string,
  context: SessionProfileContext,
  lang: LanguageCode
): string {
  let str = template;
  str = str.replace(/\{name\}/g, context.name || (lang === "te" ? "మిత్రమా" : lang === "hi" ? "साथी" : "friend"));
  str = str.replace(/\{location\}/g, context.location || (lang === "te" ? "మీ ప్రాంతం" : lang === "hi" ? "आपके क्षेत्र" : "your area"));
  return str;
}
