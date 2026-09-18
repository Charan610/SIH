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
    // Q1: Current Livelihood Activity
    {
      id: "q1_work",
      stepNumber: 1,
      totalSteps: 10,
      question: {
        en: "What work or livelihood activity do you currently do?",
        te: "మీరు ప్రస్తుతం ఏ పని లేదా జీవనోపాధి కార్యకలాపం చేస్తున్నారు?",
        hi: "आप वर्तमान में क्या काम या आजीविका गतिविधि करते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I work as an electrician and do domestic wiring.",
          "I do farming and agricultural labor.",
          "I work in tailoring and garment making.",
          "I do plumbing and sanitary pipe work.",
          "I work in mobile and electronics repair.",
        ],
        te: [
          "నేను ఎలక్ట్రీషియన్ పని మరియు వైరింగ్ చేస్తున్నాను.",
          "నేను వ్యవసాయం మరియు కూలీ పనులు చేస్తున్నాను.",
          "నేను కుట్టు పని (టైలరింగ్) చేస్తున్నాను.",
          "నేను ప్లంబింగ్ మరియు పైపుల పని చేస్తున్నాను.",
          "నేను మొబైల్ రిపేర్ పని చేస్తున్నాను.",
        ],
        hi: [
          "मैं इलेक्ट्रीशियन और घरेलू वायरिंग का काम करता हूँ।",
          "मैं खेती और कृषि मजदूरी का काम करता हूँ।",
          "मैं सिलाई और कपड़े बनाने का काम करता हूँ।",
          "मैं प्लंबिंग और पाइप फिटिंग का काम करता हूँ।",
          "मैं मोबाइल और इलेक्ट्रॉनिक्स रिपेयर करता हूँ।",
        ],
      },
    },

    // Q2: Experience & Duration
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
        en: "How many years or months have you been doing this work?",
        te: "మీరు ఈ పనిని ఎన్ని సంవత్సరాలు లేదా నెలలుగా చేస్తున్నారు?",
        hi: "आप यह काम कितने साल या महीनों से कर रहे हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "For about 2 years.",
          "More than 5 years of practical experience.",
          "Around 1 year.",
          "Just started recently, about 6 months.",
        ],
        te: [
          "దాదాపు 2 సంవత్సరాల నుండి చేస్తున్నాను.",
          "5 సంవత్సరాలకు పైగా అనుభవం ఉంది.",
          "సుమారు 1 సంవత్సరం నుండి.",
          "ఇటీవలే 6 నెలల క్రితం ప్రారంభించాను.",
        ],
        hi: [
          "लगभग 2 साल से कर रहा हूँ।",
          "5 साल से अधिक का व्यावहारिक अनुभव है।",
          "लगभग 1 साल से।",
          "अभी 6 महीने पहले ही शुरू किया है।",
        ],
      },
    },

    // Q3: Traditional / Family Occupation (Mandated for SC Artisan Mapping)
    {
      id: "q3_traditional_occ",
      stepNumber: 3,
      totalSteps: 10,
      acknowledgment: {
        en: "Experience duration recorded.",
        te: "మీ అనుభవం నమోదైంది.",
        hi: "आपका अनुभव दर्ज कर लिया गया है।",
      },
      question: {
        en: "Does your family have a traditional occupation or craft, like weaving, pottery, leather work, metalwork, or farming?",
        te: "మీ కుటుంబానికి ఏదైనా సంప్రదాయ వృత్తి లేదా హస్తకళ (చేనేత, కుమ్మరి, తోలు పని, కమ్మరి లేదా వ్యవసాయం వంటివి) ఉందా?",
        hi: "क्या आपके परिवार का कोई पारंपरिक व्यवसाय या शिल्प है, जैसे बुनाई, मिट्टी के बर्तन, चमड़े का काम, लोहारी या खेती?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "Yes, our family has traditionally done leather craft and footwear making.",
          "Yes, we have traditional handloom weaving and garment crafts.",
          "Our traditional family occupation is agriculture and animal husbandry.",
          "No traditional craft, we do daily wage and modern trades.",
        ],
        te: [
          "అవును, మా కుటుంబం తరతరాలుగా తోలు మరియు పాదరక్షల పని చేస్తోంది.",
          "అవును, మాది చేనేత మరియు బట్టల తయారీ సంప్రదాయ వృత్తి.",
          "మా కుటుంబ సంప్రదాయ వృత్తి వ్యవసాయం మరియు పశుపోషణ.",
          "ప్రత్యేక సంప్రదాయ వృత్తి లేదు, సాధారణ ఆధునిక పనులు చేస్తాము.",
        ],
        hi: [
          "हाँ, हमारा परिवार पारंपरिक रूप से चमड़े और जूते-चप्पल का काम करता है।",
          "हाँ, हमारे यहाँ हथकरघा बुनाई और वस्त्र निर्माण का पारंपरिक काम है।",
          "हमारा पारिवारिक व्यवसाय खेती और पशुपालन है।",
          "कोई पारंपरिक शिल्प नहीं है, हम सामान्य मजदूरी और नए काम करते हैं।",
        ],
      },
    },

    // Q4: Educational Background (Mandated)
    {
      id: "q4_education",
      stepNumber: 4,
      totalSteps: 10,
      acknowledgment: {
        en: "Family craft background noted.",
        te: "సంప్రదాయ వృత్తి వివరాలు నమోదయ్యాయి.",
        hi: "पारंपरिक व्यवसाय का विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "What is your educational background? (e.g. 5th pass, 8th pass, 10th pass, 12th, ITI, or practical learning)",
        te: "మీ విద్యాభ్యాసం ఎంతవరకు చదివారు? (ఉదా. 5వ తరగతి, 8వ తరగతి, 10వ పాస్, ఇంటర్, ఐటిఐ లేదా నేరుగా నేర్చుకున్నారా)",
        hi: "आपकी पढ़ाई कहाँ तक हुई है? (जैसे 5वीं, 8वीं, 10वीं पास, 12वीं, आईटीआई या सीधे काम सीखा है)",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I have passed 10th standard (SSC).",
          "I have completed 8th standard.",
          "I passed 12th / Intermediate.",
          "I completed ITI vocational certification.",
          "Informal schooling / practical on-the-job learner.",
        ],
        te: [
          "నేను 10వ తరగతి (SSC) ఉత్తీర్ణత సాధించాను.",
          "నేను 8వ తరగతి వరకు చదువుకున్నాను.",
          "నేను ఇంటర్మీడియట్ / 12వ తరగతి పూర్తి చేశాను.",
          "నేను ఐటీఐ (ITI) టెక్నికల్ కోర్సు చేశాను.",
          "నేను బడికి వెళ్లలేదు, నేరుగా పని చేస్తూ నేర్చుకున్నాను.",
        ],
        hi: [
          "मैंने 10वीं कक्षा (मैट्रिक) पास की है।",
          "मैंने 8वीं कक्षा तक पढ़ाई की है।",
          "मैंने 12वीं / इंटरमीडिएट पूरा किया है।",
          "मैंने आईटीआई (ITI) सर्टिफिकेट कोर्स किया है।",
          "मैंने औपचारिक स्कूल नहीं गया, सीधे काम देखकर सीखा है।",
        ],
      },
    },

    // Q5: Tools, Equipment & Practical Skills (Mandated)
    {
      id: "q5_tasks_tools",
      stepNumber: 5,
      totalSteps: 10,
      acknowledgment: {
        en: "Education background recorded.",
        te: "మీ చదువు వివరాలు నమోదయ్యాయి.",
        hi: "आपकी शिक्षा का विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "What specific tools, equipment, or machinery do you know how to use?",
        te: "మీ పనిలో ఏ పనిముట్లు, పరికరాలు లేదా యంత్రాలను ఉపయోగించడంలో మీకు అనుభవం ఉంది?",
        hi: "आप अपने काम में कौन-से औजार, उपकरण या मशीनें चलाना जानते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "Multimeter, wire stripper, drill machine, and electrical safety testers.",
          "Power sewing machine, cutting scissors, and embroidery frames.",
          "Tractor, motor pump, sprayer, and harvester.",
          "Pipe wrench, thread cutter, and PVC solvent joints.",
          "Soldering iron, SMD rework station, and digital multimeters.",
        ],
        te: [
          "మల్టీమీటర్, వైర్ స్ట్రిప్పర్, డ్రిల్లింగ్ మెషిన్ మరియు టెస్టర్.",
          "మోటార్ కుట్టు మిషన్, కత్తెర మరియు కొలత టేపులు.",
          "ట్రాక్టర్, మోటారు పంపు, స్ప్రేయర్ మరియు వ్యవసాయ పనిముట్లు.",
          "పైప్ రెంచ్, త్రెడ్ కట్టర్ మరియు పివిసి పైపు సామాగ్రి.",
          "సోల్డరింగ్ ఐరన్, హాట్ ఎయిర్ గన్ మరియు మొబైల్ టూల్ కిట్.",
        ],
        hi: [
          "मल्टीमीटर, वायर स्ट्रिपर, ड्रिल मशीन और टेस्टर।",
          "इलेक्ट्रिक सिलाई मशीन, कटिंग कैंची और नापने का फीता।",
          "ट्रैक्टर, वाटर पंप, स्प्रेयर और कृषि उपकरण।",
          "पाइप रिंच, थ्रेड कटर और पीवीसी फिटिंग उपकरण।",
          "सोल्डरिंग आयरन, हॉट एयर गन और मोबाइल रिपेयर टूलकिट।",
        ],
      },
    },

    // Q6: Mobility & Physical Constraints (Mandated)
    {
      id: "q6_mobility",
      stepNumber: 6,
      totalSteps: 10,
      acknowledgment: {
        en: "Tools and skills noted.",
        te: "పనిముట్ల వివరాలు నమోదయ్యాయి.",
        hi: "उपकरणों और कौशलों का विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "Can you travel outside your village or district for work or training, or do you have any physical/family constraints?",
        te: "పని లేదా శిక్షణ కోసం మీ గ్రామం లేదా జిల్లా దాటి వెళ్లగలరా, లేదా ఏవైనా ప్రయాణ/కుటుంబ పరిమితులు ఉన్నాయా?",
        hi: "क्या आप काम या प्रशिक्षण के लिए अपने गाँव या जिले से बाहर जा सकते हैं, या कोई यात्रा/शारीरिक सीमा है?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I can travel anywhere within the district or state for training and jobs.",
          "I can only travel up to nearby mandal headquarters (10-15 km).",
          "I need work within my village or home due to family responsibilities.",
          "I prefer local residential training with hostel facilities.",
        ],
        te: [
          "నేను జిల్లా కేంద్రం లేదా రాష్ట్రంలో ఎక్కడికైనా వెళ్లి పని చేయగలను.",
          "నేను దగ్గరలోని మండలం లేదా పట్టణం (10-15 కిమీ) వరకు మాత్రమే వెళ్లగలను.",
          "కుటుంబ బాధ్యతల వల్ల గ్రామంలోనే లేదా ఇంటి వద్దనే పని చేయాలి.",
          "హాస్టల్ వసతి ఉంటే జిల్లా కేంద్రంలో శిక్షణ తీసుకోగలను.",
        ],
        hi: [
          "मैं जिले या राज्य में कहीं भी जाकर काम या प्रशिक्षण ले सकता हूँ।",
          "मैं केवल नजदीकी ब्लॉक/तहसील (10-15 किमी) तक ही जा सकता हूँ।",
          "पारिवारिक जिम्मेदारियों के कारण मुझे गाँव या घर के पास ही काम चाहिए।",
          "हॉस्टल सुविधा होने पर मैं जिला मुख्यालय में प्रशिक्षण ले सकता हूँ।",
        ],
      },
    },

    // Q7: Local Economic Realities & District (Mandated)
    {
      id: "q7_location",
      stepNumber: 7,
      totalSteps: 10,
      acknowledgment: {
        en: "Mobility preference noted.",
        te: "ప్రయాణ పరిమితుల వివరాలు నమోదయ్యాయి.",
        hi: "यात्रा प्राथमिकताओं का विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "Which district and village do you live in, and what trades or services have high demand in your area?",
        te: "మీరు ఏ జిల్లా మరియు గ్రామంలో నివసిస్తున్నారు, మీ ప్రాంతంలో ఏ పనులకు లేదా సేవలకి ఎక్కువ డిమాండ్ ఉంది?",
        hi: "आप किस जिले और गाँव में रहते हैं, और आपके क्षेत्र में किन कामों या सेवाओं की सबसे अधिक माँग है?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "I live in West Godavari district; solar wiring and farm motor repair have huge demand.",
          "I live in Guntur; garment stitching and retail have good demand.",
          "I live in Krishna district; aquaculture, electricals, and logistics are growing.",
          "I live in Visakhapatnam; industrial maintenance and construction are in demand.",
        ],
        te: [
          "నేను పశ్చిమ గోదావరి జిల్లాలో ఉంటున్నాను; సోలార్ మరియు మోటార్ రిపేర్లకు ఎక్కువ డిమాండ్ ఉంది.",
          "నేను గుంటూరు జిల్లాలో ఉన్నాను; రెడీమేడ్ దుస్తులు మరియు టైలరింగ్ పనులకు డిమాండ్ ఉంది.",
          "నేను కృష్ణా జిల్లాలో ఉన్నాను; ఆక్వాకల్చర్, ఎలక్ట్రికల్ పనులకు డిమాండ్ ఉంది.",
          "నేను విశాఖపట్నం జిల్లాలో ఉన్నాను; పరిశ్రమలు మరియు నిర్మాణ పనులకు డిమాండ్ ఉంది.",
        ],
        hi: [
          "मैं पश्चिम गोदावरी जिले में रहता हूँ; यहाँ सोलर और मोटर रिपेयर की भारी माँग है।",
          "मैं गुंटूर जिले में रहता हूँ; यहाँ सिलाई और खुदरा व्यापार की माँग है।",
          "मैं कृष्णा जिले में रहता हूँ; यहाँ बिजली के काम और लॉजिस्टिक्स की माँग है।",
          "मैं विशाखापत्तनम में रहता हूँ; यहाँ औद्योगिक और निर्माण कार्यों की माँग है।",
        ],
      },
    },

    // Q8: Autonomy & Problem Solving
    {
      id: "q8_autonomy",
      stepNumber: 8,
      totalSteps: 10,
      acknowledgment: {
        en: "Local economic demand noted.",
        te: "ప్రాంతీయ డిమాండ్ వివరాలు నమోదయ్యాయి.",
        hi: "स्थानीय माँग का विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "Can you do your work independently without supervision, and what do you do when you face a difficult problem?",
        te: "మీరు మీ పనిని ఎవరి సహాయం లేకుండా సొంతంగా చేసుకోగలరా, ఏదైనా పెద్ద సమస్య ఎదురైనప్పుడు ఎలా పరిష్కరిస్తారు?",
        hi: "क्या आप बिना किसी देखरेख के स्वतंत्र रूप से काम कर सकते हैं, और कोई कठिन समस्या आने पर क्या करते हैं?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "Yes, I do all routine work independently and diagnose faults step-by-step.",
          "I work on my own, and consult a senior master if a complex issue arises.",
          "I manage standard tasks, but prefer working with an experienced team.",
          "I follow safety manuals and guidelines to fix issues safely.",
        ],
        te: [
          "అవును, నేను పూర్తి పనిని సొంతంగా చేస్తాను, సమస్యను దశలవారీగా పరీక్షిస్తాను.",
          "నేను ఒంటరిగానే పని చేస్తాను, కష్టమైన సమస్య వస్తే సీనియర్ ఉస్తాద్ సలహా తీసుకుంటాను.",
          "సాధారణ పనులు నేనే చేస్తాను, పెద్ద పనులకు తోటివారి సహాయం తీసుకుంటాను.",
          "భద్రతా నిబంధనలు పాటిస్తూ నాణ్యంగా పని పూర్తి చేస్తాను.",
        ],
        hi: [
          "हाँ, मैं पूरा काम खुद करता हूँ और समस्याओं की चरणबद्ध जाँच करता हूँ।",
          "मैं स्वतंत्र रूप से काम करता हूँ, और बड़ी समस्या आने पर वरिष्ठ कारीगर से सलाह लेता हूँ।",
          "मैं सामान्य काम खुद कर लेता हूँ, लेकिन बड़े काम में टीम की जरूरत होती है।",
          "सुरक्षा मानकों का पालन करते हुए काम को सावधानीपूर्वक पूरा करता हूँ।",
        ],
      },
    },

    // Q9: Preferred Pathway: Self-Employment vs Wage Employment (Mandated)
    {
      id: "q9_pathway_pref",
      stepNumber: 9,
      totalSteps: 10,
      acknowledgment: {
        en: "Work autonomy noted.",
        te: "పని స్వతంత్రత వివరాలు నమోదయ్యాయి.",
        hi: "कार्य स्वतंत्रता का विवरण दर्ज कर लिया गया है।",
      },
      question: {
        en: "Would you prefer finding a wage employment job, starting your own enterprise/shop, or exploring both pathways?",
        te: "మీరు స్థిరమైన జీతం వచ్చే ఉద్యోగం చేయాలనుకుంటున్నారా, మీ సొంత వ్యాపారం లేదా షాపు ప్రారంభించాలనుకుంటున్నారా, లేదా రెండూ చూడాలనుకుంటున్నారా?",
        hi: "क्या आप एक निश्चित वेतन वाली नौकरी करना चाहते हैं, अपनी दुकान या व्यवसाय शुरू करना चाहते हैं, या दोनों विकल्प देखना चाहते हैं?",
      },
      suggestionsHeader: {
        en: "Choose your preferred pathway:",
        te: "మీకు నచ్చిన మార్గాన్ని ఎంచుకోండి:",
        hi: "अपना पसंदीदा मार्ग चुनें:",
      },
      suggestions: {
        en: [
          "I prefer wage employment (regular monthly salary).",
          "I want to start my own business / workshop / enterprise.",
          "I want to explore and compare both options side-by-side.",
          "I want an NSQF certificate to get bank loans for self-employment.",
        ],
        te: [
          "నాకు స్థిరమైన జీతం వచ్చే ఉద్యోగం కావాలి (ఉపాధి మార్గం).",
          "నేను స్వంత వ్యాపారం లేదా సర్వీస్ సెంటర్ ప్రారంభించాలనుకుంటున్నాను.",
          "నేను రెండు అవకాశాలను సరిపోల్చి చూడాలనుకుంటున్నాను.",
          "నాకు నైపుణ్య సర్టిఫికేట్ మరియు బ్యాంక్ లోన్ సహాయం కావాలి.",
        ],
        hi: [
          "मुझे निश्चित मासिक वेतन वाली नौकरी चाहिए (रोजगार मार्ग)।",
          "मैं अपना खुद का व्यवसाय, दुकान या वर्कशॉप शुरू करना चाहता हूँ।",
          "मैं दोनों विकल्पों की तुलना करके फैसला लेना चाहता हूँ।",
          "मुझे कौशल प्रमाणपत्र और स्वरोजगार के लिए बैंक ऋण चाहिए।",
        ],
      },
    },

    // Q10: Financial Support & PM-AJAY GIA Need (Mandated)
    {
      id: "q10_income_support",
      stepNumber: 10,
      totalSteps: 10,
      acknowledgment: {
        en: "Career preference noted.",
        te: "కెరీర్ ప్రాధాన్యత నమోదైంది.",
        hi: "करियर प्राथमिकता दर्ज कर ली गई है।",
      },
      question: {
        en: "Do you need government financial assistance, toolkits, or subsidy loans under PM-AJAY GIA to start your skilling journey?",
        te: "మీ జీవనోపాధిని పెంపొందించుకోవడానికి PM-AJAY GIA కింద ప్రభుత్వ ఉచిత టూల్‌కిట్, స్టైపెండ్ లేదా సబ్సిడీ లోన్ సహాయం అవసరమా?",
        hi: "क्या आपको अपनी आजीविका शुरू करने के लिए PM-AJAY GIA के तहत सरकारी निःशुल्क टूलकिट, वजीफा (स्टाइपेंड) या सब्सिडी ऋण की आवश्यकता है?",
      },
      suggestionsHeader: {
        en: "You can say:",
        te: "మీరు ఇలా చెప్పవచ్చు:",
        hi: "आप ऐसा कह सकते हैं:",
      },
      suggestions: {
        en: [
          "Yes, I need free toolkit support and training stipend under PM-AJAY GIA.",
          "Yes, I need bank linkage and government capital subsidy for my business.",
          "I need 100% free residential training and placement assistance.",
          "I just need official NSQF certification for my existing skills.",
        ],
        te: [
          "అవును, నాకు PM-AJAY GIA కింద ఉచిత టూల్‌కిట్ మరియు శిక్షణ స్టైపెండ్ కావాలి.",
          "అవును, వ్యాపారం కోసం బ్యాంకు రుణం మరియు ప్రభుత్వ రాయితీ (సబ్సిడీ) కావాలి.",
          "నాకు ఉచిత హాస్టల్ శిక్షణ మరియు ఉద్యోగ సహాయం కావాలి.",
          "నాకున్న అనుభవానికి అధికారిక NSQF సర్టిఫికేషన్ మాత్రమే కావాలి.",
        ],
        hi: [
          "हाँ, मुझे PM-AJAY GIA के तहत मुफ्त टूलकिट और प्रशिक्षण स्टाइपेंड चाहिए।",
          "हाँ, व्यवसाय के लिए बैंक लिंकेज और सरकारी पूंजीगत सब्सिडी चाहिए।",
          "मुझे 100% निःशुल्क आवासीय प्रशिक्षण और नौकरी सहायता चाहिए।",
          "मुझे केवल अपने मौजूदा अनुभव के लिए आधिकारिक NSQF प्रमाण पत्र चाहिए।",
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
