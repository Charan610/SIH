import { NextResponse } from "next/server";

export async function GET() {
  const sarvamKey =
    process.env.SARVAM_API_KEY ||
    process.env.NEXT_PUBLIC_SARVAM_API_KEY ||
    "sk_xfuppg6g_vhtQ4AXwD4fOBZnXGVzK54oh";
  const configured = Boolean(sarvamKey && !sarvamKey.startsWith("put-"));

  return NextResponse.json({
    status: "ok",
    sarvam_ai: {
      configured,
      stt_model: "saaras:v3",
      tts_model: "bulbul:v3",
      speaker: "ritu",
    },
    bhashini: { configured: false },
    groq_whisper: { configured: true, model: "whisper-large-v3" },
    supported_languages: ["en", "te", "hi"],
    recommended_primary: configured ? "sarvam_ai" : "browser_fallback",
  });
}
