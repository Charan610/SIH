import { NextResponse } from "next/server";

const SARVAM_API_KEY =
  process.env.SARVAM_API_KEY ||
  process.env.NEXT_PUBLIC_SARVAM_API_KEY ||
  "sk_xfuppg6g_vhtQ4AXwD4fOBZnXGVzK54oh";
const SARVAM_TTS_ENDPOINT = "https://api.sarvam.ai/text-to-speech";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, language = "hi", speaker = "ritu" } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const langClean = language.toLowerCase().trim();
    let sarvamLang = "hi-IN";
    if (langClean.startsWith("te")) sarvamLang = "te-IN";
    else if (langClean.startsWith("en")) sarvamLang = "en-IN";

    const payload = {
      inputs: [text.trim().slice(0, 480)],
      target_language_code: sarvamLang,
      speaker: speaker || "ritu",
      pitch: 0,
      pace: 1.0,
      loudness: 1.0,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: "bulbul:v3",
    };

    const res = await fetch(SARVAM_TTS_ENDPOINT, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Sarvam TTS error from Next.js API route:", res.status, errText);
      return NextResponse.json(
        { error: "Sarvam AI TTS call failed", details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const audios = data.audios || [];
    if (!audios.length || !audios[0]) {
      return NextResponse.json({ error: "No audio generated" }, { status: 500 });
    }

    return NextResponse.json({
      audio_base64: audios[0],
      provider: "sarvam_ai",
      speaker: speaker || "ritu",
      client_fallback: false,
      language: sarvamLang,
      text,
    });
  } catch (err: any) {
    console.error("Error in Next.js voice synthesize route:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
