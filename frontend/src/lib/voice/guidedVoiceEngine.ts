/**
 * frontend/src/lib/voice/guidedVoiceEngine.ts
 * 
 * Modular Guided NSQF Voice Assessment Engine (10-Step Discrete Turn Interaction).
 * 
 * Architecture:
 * - 10 discrete, focused questions evaluating the 5 NSQF capability dimensions:
 *   1. Occupational Domain & Process (Q1 & Q2)
 *   2. Professional Tasks & Tools (Q3 & Q4)
 *   3. Professional Knowledge & Problem Solving (Q5 & Q6)
 *   4. Autonomy & Quality / Safety Standards (Q7 & Q8)
 *   5. Teamwork & Livelihood Aspiration (Q9 & Q10)
 * - Friendly, respectful government service tone in Telugu, Hindi, and English.
 * - 100% verbal-visual fidelity: The screen text is identical to what TTS speaks.
 * - Integrates with profile tab data (Name, District, Education are preserved and not re-asked).
 * - Real-time SQLite answer persistence on every turn.
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

export interface TurnHistoryItem {
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface NSQFAssessmentAnswer {
  stepNumber: number;
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface SessionProfileContext {
  sessionId: string;
  name?: string;
  location?: string;
  education?: string;
  currentRole?: string;
  experienceYears?: number;
  workTasks?: string[];
  toolsUsed?: string[];
  knowledgeRequired?: string[];
  problemSolving?: string;
  autonomyLevel?: string;
  safetyQuality?: string;
  teamwork?: string;
  pathwayPreference?: string;
  history: TurnHistoryItem[];
  answers: NSQFAssessmentAnswer[];
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
// 10-Question NSQF Guided Assessment Catalog
// ─────────────────────────────────────────────────────────────────────────────

export const GUIDED_QUESTIONS_CATALOG: {
  INTRO: {
    title: Record<LanguageCode, string>;
    subtitle: Record<LanguageCode, string>;
    startBtn: Record<LanguageCode, string>;
  };
  QUESTIONS: QuestionPrompt[];
} = {
  INTRO: {
    title: {
      en: "NSQF Voice Skill Assessment",
      te: "ప్రభుత్వ NSQF వాయిస్ నైపుణ్య అంచనా",
      hi: "सरकारी NSQF वॉयस कौशल मूल्यांकन",
    },
    subtitle: {
      en: "Answer 10 simple questions about your work experience to receive official NSQF alignment and tailored course or job opportunities.",
      te: "మీ పని అనుభవం గురించి 10 సులభమైన ప్రశ్నలకు సమాధానమిచ్చి, తగిన NSQF స్థాయి మరియు ప్రభుత్వ పథక అవకాశాలను పొందండి.",
      hi: "अपने कार्य अनुभव के बारे में 10 सरल प्रश्नों के उत्तर दें और उपयुक्त NSQF स्तर व सरकारी योजना के अवसर प्राप्त करें।",
    },
    startBtn: {
      en: "Start Voice Assessment",
      te: "వాయిస్ అసెస్‌మెంట్ ప్రారంభించండి",
      hi: "वॉयस मूल्यांकन शुरू करें",
    },
  },

  QUESTIONS: [
    // Q1: Current Work
    {
      id: "q1_work",
      stepNumber: 1,
      totalSteps: 10,
      question: {
        en: "What work do you currently do?",
        te: "మీరు ప్రస్తుతం ఏ పని చేస్తున్నారు?",
        hi: "आप वर्तमान में क्या काम करते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I work as an electrician.",
          "I do agriculture and farming.",
          "I work in tailoring and garment making.",
          "I do plumbing and pipe fitting.",
          "I work as a carpenter.",
        ],
        te: [
          "నేను ఎలక్ట్రీషియన్ పని చేస్తున్నాను.",
          "నేను వ్యవసాయం చేస్తున్నాను.",
          "నేను కుట్టు పని (టైలరింగ్) చేస్తున్నాను.",
          "నేను ప్లంబింగ్ పని చేస్తున్నాను.",
          "నేను వడ్రంగి (కార్పెంటర్) పని చేస్తున్నాను.",
        ],
        hi: [
          "मैं इलेक्ट्रीशियन का काम करता हूँ।",
          "मैं खेती और कृषि का काम करता हूँ।",
          "मैं सिलाई और दर्जी का काम करता हूँ।",
          "मैं प्लंबिंग का काम करता हूँ।",
          "मैं बढ़ई का काम करता हूँ।",
        ],
      },
    },

    // Q2: Duration / Experience
    {
      id: "q2_duration",
      stepNumber: 2,
      totalSteps: 10,
      acknowledgment: {
        en: "Work details noted.",
        te: "మీ పని వివరాలు నమోదయ్యాయి.",
        hi: "आपके काम का विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "How long have you been doing this work?",
        te: "మీరు ఈ పనిని ఎంత కాలంగా చేస్తున్నారు?",
        hi: "आप यह काम कितने समय से कर रहे हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "For about 2 years.",
          "More than 5 years.",
          "Around 1 year.",
          "About 6 months.",
        ],
        te: [
          "దాదాపు 2 సంవత్సరాల నుండి.",
          "5 సంవత్సరాలకు పైగా.",
          "సుమారు 1 సంవత్సరం నుండి.",
          "దాదాపు 6 నెలలుగా.",
        ],
        hi: [
          "लगभग 2 साल से।",
          "5 साल से अधिक समय से।",
          "लगभग 1 साल से।",
          "लगभग 6 महीने से।",
        ],
      },
    },

    // Q3: Main Tasks
    {
      id: "q3_tasks",
      stepNumber: 3,
      totalSteps: 10,
      acknowledgment: {
        en: "Experience recorded.",
        te: "మీ అనుభవం నమోదైంది.",
        hi: "आपका अनुभव दर्ज कर लिया गया है।",
      },
      question: {
        en: "What are the main tasks you do in your work?",
        te: "మీ పనిలో మీరు చేసే ముఖ్యమైన పనులు ఏమిటి?",
        hi: "आपके काम में आप मुख्य रूप से क्या कार्य करते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "House wiring, switch board fitting, and repairs.",
          "Crop planting, irrigation, and harvesting.",
          "Garment cutting, stitching, and alterations.",
          "Pipe fitting, leakage fixing, and pump repair.",
        ],
        te: [
          "వైరింగ్, స్విచ్ బోర్డులు అమర్చడం మరియు రిపేర్లు.",
          "విత్తనాలు వేయడం, నీటిపారుదల మరియు పంట కోత.",
          "బట్టలు కత్తిరించడం, కుట్టడం మరియు ఆల్టరేషన్స్.",
          "పైపులు ఫిట్టింగ్, లీకేజీలు సరిచేయడం మరియు పంప్ రిపేర్.",
        ],
        hi: [
          "हाउस वायरिंग, स्विच बोर्ड लगाना और मरम्मत करना।",
          "फसल बोना, सिंचाई करना और कटाई करना।",
          "कपड़ों की कटिंग, सिलाई और मरम्मत करना।",
          "पाइप फिटिंग, लीकेज ठीक करना और मोटर रिपेयर।",
        ],
      },
    },

    // Q4: Tools & Equipment
    {
      id: "q4_tools",
      stepNumber: 4,
      totalSteps: 10,
      acknowledgment: {
        en: "Tasks recorded.",
        te: "మీ పనుల వివరాలు నమోదయ్యాయి.",
        hi: "आपके कार्यों का विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "What tools or equipment do you use for your work?",
        te: "మీ పని కోసం మీరు ఏ పనిముట్లు లేదా పరికరాలను ఉపయోగిస్తారు?",
        hi: "आप अपने काम के लिए कौन-से औजार या उपकरण इस्तेमाल करते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "Tester, wire stripper, pliers, and drill machine.",
          "Tractor, sprayer, and hand farming tools.",
          "Sewing machine, measuring tape, and cutting shears.",
          "Pipe wrench, cutter, and soldering kit.",
        ],
        te: [
          "టెస్టర్, వైర్ స్ట్రిప్పర్, ప్లయర్స్ మరియు డ్రిల్లింగ్ మెషిన్.",
          "ట్రాక్టర్, స్ప్రేయర్ మరియు వ్యవసాయ పనిముట్లు.",
          "కుట్టు మిషన్, కొలత టేప్ మరియు కత్తెర.",
          "పైప్ రెంచ్, కట్టర్ మరియు టూల్‌కిట్.",
        ],
        hi: [
          "टेस्टर, वायर स्ट्रिपर, प्लायर और ड्रिल मशीन।",
          "ट्रैक्टर, स्प्रेयर और कृषि उपकरण।",
          "सिलाई मशीन, नापने का फीता और कैंची।",
          "पाइप रिंच, कटर और सोल्डरिंग किट।",
        ],
      },
    },

    // Q5: Professional Knowledge
    {
      id: "q5_knowledge",
      stepNumber: 5,
      totalSteps: 10,
      acknowledgment: {
        en: "Tools noted.",
        te: "పనిముట్ల వివరాలు నమోదయ్యాయి.",
        hi: "उपकरणों का विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "What do you need to know to do this work?",
        te: "ఈ పని చేయడానికి మీరు ఏ విషయాలు లేదా నైపుణ్యాలు తెలుసుకోవాలి?",
        hi: "यह काम करने के लिए आपको क्या जानकारी या कौशल होना चाहिए?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "Voltage safety, circuit diagrams, and phase connections.",
          "Soil types, fertilizers, and weather conditions.",
          "Fabric measurement, pattern drafting, and stitch styles.",
          "Water pressure, pipe dimensions, and joint sealing.",
        ],
        te: [
          "వోల్టేజ్ భద్రత, సర్క్యూట్ పటాలు మరియు ఫేస్ కనెక్షన్లు.",
          "నేల రకాలు, ఎరువులు మరియు వాతావరణ పరిస్థితులు.",
          "కొలతలు, నమూనా డిజైన్ మరియు కుట్టు రకాలు.",
          "నీటి పీడనం, పైప్ కొలతలు మరియు జాయింట్ సీలింగ్.",
        ],
        hi: [
          "वोल्टेज सुरक्षा, सर्किट आरेख और फेज कनेक्शन।",
          "मिट्टी के प्रकार, खाद और मौसम की जानकारी।",
          "कपड़ों की नाप, पैटर्न डिजाइन और सिलाई के तरीके।",
          "पानी का दबाव, पाइप का माप और जॉइंट सीलिंग।",
        ],
      },
    },

    // Q6: Problem Solving
    {
      id: "q6_problem_solving",
      stepNumber: 6,
      totalSteps: 10,
      acknowledgment: {
        en: "Technical knowledge noted.",
        te: "నైపుణ్యాల వివరాలు నమోదయ్యాయి.",
        hi: "तकनीकी ज्ञान दर्ज कर लिया गया है।",
      },
      question: {
        en: "What do you do when you face a problem or difficulty at work?",
        te: "పనిలో ఏదైనా సమస్య లేదా ఇబ్బంది ఎదురైనప్పుడు మీరు ఏమి చేస్తారు?",
        hi: "काम में कोई समस्या या कठिनाई आने पर आप क्या करते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I diagnose the fault carefully step by step.",
          "I consult a senior master or refer to guidelines.",
          "I test alternative components to solve it.",
          "I safely isolate the issue and fix it.",
        ],
        te: [
          "నేను దశలవారీగా సమస్యను పరీక్షించి సరిచేస్తాను.",
          "నేను అనుభవజ్ఞులైన గురువు లేదా మార్గదర్శకుడిని అడుగుతాను.",
          "నేను ప్రత్యామ్నాయ పద్ధతులతో సమస్యను పరిష్కరిస్తాను.",
          "నేను జాగ్రత్తగా లోపాన్ని గుర్తించి సరిచేస్తాను.",
        ],
        hi: [
          "मैं चरण-दर-चरण समस्या की जांच करके ठीक करता हूँ।",
          "मैं वरिष्ठ मिस्त्री या मार्गदर्शक से सलाह लेता हूँ।",
          "मैं वैकल्पिक तरीकों से समस्या का हल निकालता हूँ।",
          "मैं सावधानीपूर्वक समस्या की पहचान कर समाधान करता हूँ।",
        ],
      },
    },

    // Q7: Autonomy Level
    {
      id: "q7_autonomy",
      stepNumber: 7,
      totalSteps: 10,
      acknowledgment: {
        en: "Problem solving approach noted.",
        te: "సమస్య పరిష్కార విధానం నమోదైంది.",
        hi: "समस्या निवारण का तरीका दर्ज कर लिया गया है।",
      },
      question: {
        en: "Can you do this work independently on your own?",
        te: "మీరు ఈ పనిని స్వతంత్రంగా మీరే సొంతంగా చేయగలరా?",
        hi: "क्या आप यह काम स्वतंत्र रूप से स्वयं कर सकते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "Yes, I can do all routine work completely on my own.",
          "Yes, I work independently with minimal supervision.",
          "I can do most tasks alone, but consult on complex jobs.",
          "I work under instructions of a supervisor.",
        ],
        te: [
          "అవును, నేను సొంతంగా పూర్తి పనిని చేసుకోగలను.",
          "అవును, నేను స్వతంత్రంగా ఎవరి సహాయం లేకుండా పని చేస్తాను.",
          "చాలా పనులు నేనే చేస్తాను, పెద్ద పనులకు మార్గదర్శకత్వం తీసుకుంటాను.",
          "నేను సూపర్‌వైజర్ సూచనలతో పని చేస్తాను.",
        ],
        hi: [
          "हाँ, मैं पूरा काम पूरी तरह से खुद कर सकता हूँ।",
          "हाँ, मैं बिना किसी मदद के स्वतंत्र रूप से काम करता हूँ।",
          "ज्यादातर काम खुद करता हूँ, बड़े काम में सलाह लेता हूँ।",
          "मैं सुपरवाइजर के निर्देशों पर काम करता हूँ।",
        ],
      },
    },

    // Q8: Safety & Quality Control
    {
      id: "q8_safety_quality",
      stepNumber: 8,
      totalSteps: 10,
      acknowledgment: {
        en: "Autonomy level noted.",
        te: "మీ పని స్వతంత్రత నమోదైంది.",
        hi: "आपकी कार्य स्वतंत्रता दर्ज कर ली गई है।",
      },
      question: {
        en: "How do you make sure your work is safe and of good quality?",
        te: "మీ పని సురక్షితంగా మరియు నాణ్యతతో ఉండేలా మీరు ఎలా చూసుకుంటారు?",
        hi: "आप कैसे सुनिश्चित करते हैं कि आपका काम सुरक्षित और अच्छी गुणवत्ता का हो?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I wear safety gloves, turn off power, and test thoroughly.",
          "I follow standard procedures and double-check finish.",
          "I use genuine certified materials and safe tools.",
          "I check customer satisfaction before completion.",
        ],
        te: [
          "నేను భద్రతా గ్లౌవ్స్ ధరిస్తాను, పవర్ ఆఫ్ చేసి టెస్ట్ చేస్తాను.",
          "నేను నాణ్యమైన సామాన్లు వాడుతాను, ఫినిషింగ్ సరిచూసుకుంటాను.",
          "నేను భద్రతా నిబంధనలను పాటిస్తూ నాణ్యతను తనిఖీ చేస్తాను.",
          "పని పూర్తయ్యాక ఫలితాన్ని స్వయంగా పరిశీలిస్తాను.",
        ],
        hi: [
          "मैं सुरक्षा दस्ताने पहनता हूँ, बिजली बंद करके जांचता हूँ।",
          "मैं मानक नियमों का पालन करता हूँ और फिनिशिंग चेक करता हूँ।",
          "मैं अच्छी गुणवत्ता की सामग्री और सुरक्षित औजार इस्तेमाल करता हूँ।",
          "काम पूरा होने के बाद दोबारा अच्छी तरह जांच करता हूँ।",
        ],
      },
    },

    // Q9: Teamwork & Supervision
    {
      id: "q9_teamwork",
      stepNumber: 9,
      totalSteps: 10,
      acknowledgment: {
        en: "Safety and quality standards noted.",
        te: "భద్రత మరియు నాణ్యతా ప్రమాణాలు నమోదయ్యాయి.",
        hi: "सुरक्षा और गुणवत्ता मानक दर्ज कर लिए गए हैं।",
      },
      question: {
        en: "Do you work with other people or as part of a team?",
        te: "మీరు ఇతరులతో కలిసి లేదా బృందంతో కలిసి పని చేస్తారా?",
        hi: "क्या आप अन्य लोगों या टीम के साथ मिलकर काम करते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "Yes, I work closely with co-workers and helpers.",
          "I work as part of a field team.",
          "I usually work independently, but coordinate with clients.",
          "I guide apprentices and helpers on site.",
        ],
        te: [
          "అవును, నేను ఇతర కార్మికులు మరియు సహాయకులతో కలిసి పనిచేస్తాను.",
          "నేను ఫీల్డ్ టీమ్‌తో కలిసి పని చేస్తాను.",
          "సాధారణంగా ఒక్కడినే చేస్తాను, అవసరమైనప్పుడు ఇతరులతో సమన్వయం చేసుకుంటాను.",
          "నేను సైట్ వద్ద సహాయకులకు మార్గదర్శకత్వం ఇస్తాను.",
        ],
        hi: [
          "हाँ, मैं अन्य साथियों और सहायकों के साथ मिलकर काम करता हूँ।",
          "मैं फील्ड टीम के साथ काम करता हूँ।",
          "आमतौर पर अकेले करता हूँ, जरूरत पड़ने पर ग्राहकों से समन्वय करता हूँ।",
          "मैं काम के दौरान नए सहायकों का मार्गदर्शन करता हूँ।",
        ],
      },
    },

    // Q10: Aspiration / Livelihood Goal
    {
      id: "q10_aspiration",
      stepNumber: 10,
      totalSteps: 10,
      acknowledgment: {
        en: "Collaboration details noted.",
        te: "బృంద సమన్వయ వివరాలు నమోదయ్యాయి.",
        hi: "टीम समन्वय विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "Would you like to improve your current work, start a course, or find a direct job?",
        te: "మీరు మీ ప్రస్తుత పనిని మెరుగుపరుచుకోవాలనుకుంటున్నారా, ఏదైనా కోర్సు ప్రారంభించాలనుకుంటున్నారా, లేక నేరుగా ఉద్యోగం పొందాలనుకుంటున్నారా?",
        hi: "क्या आप अपने वर्तमान काम को बेहतर बनाना चाहते हैं, कोई कोर्स शुरू करना चाहते हैं, या सीधी नौकरी पाना चाहते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I want to start a government NSQF certificate course.",
          "I want to find a direct job with steady wage.",
          "I want to improve my current work and business.",
          "I want free training with a government stipend.",
        ],
        te: [
          "నేను ప్రభుత్వ NSQF సర్టిఫికేట్ కోర్సు ప్రారంభించాలనుకుంటున్నాను.",
          "నాకు నేరుగా మంచి జీతంతో కూడిన ఉద్యోగం కావాలి.",
          "నేను నా ప్రస్తుత పని నైపుణ్యాలను మెరుగుపరుచుకోవాలనుకుంటున్నాను.",
          "నాకు స్టైపెండ్‌తో కూడిన ఉచిత ప్రభుత్వ శిక్షణ కావాలి.",
        ],
        hi: [
          "मैं सरकारी NSQF प्रमाण पत्र कोर्स शुरू करना चाहता हूँ।",
          "मुझे सीधे अच्छी नौकरी चाहिए।",
          "मैं अपने वर्तमान काम को और बेहतर बनाना चाहता हूँ।",
          "मुझे स्टाइपेंड के साथ मुफ्त सरकारी प्रशिक्षण चाहिए।",
        ],
      },
    },
  ],
};

/**
 * Returns prompt definition for a specific step index (1-based).
 */
export function getPromptForStep(stepIndex: number): QuestionPrompt {
  const clamped = Math.max(1, Math.min(10, stepIndex));
  return GUIDED_QUESTIONS_CATALOG.QUESTIONS[clamped - 1];
}

/**
 * Formats polite greeting or acknowledgment string for verbal TTS.
 */
export function formatAcknowledgment(
  template: string,
  context?: Partial<SessionProfileContext>,
  lang: LanguageCode = "en"
): string {
  if (!template) return "";
  let str = template;
  const fallbackName = lang === "te" ? "మిత్రమా" : lang === "hi" ? "साथీ" : "friend";
  str = str.replace(/\{name\}/g, context?.name || fallbackName);
  return str;
}
