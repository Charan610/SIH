import { NextResponse } from "next/server";

const SARVAM_API_KEY =
  process.env.SARVAM_API_KEY ||
  process.env.NEXT_PUBLIC_SARVAM_API_KEY ||
  "sk_xfuppg6g_vhtQ4AXwD4fOBZnXGVzK54oh";
const SARVAM_STT_ENDPOINT = "https://api.sarvam.ai/speech-to-text";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio_file") as Blob | null;
    const language = (formData.get("language") as string) || "te";

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const langClean = language.toLowerCase().trim();
    let sarvamLang = "te-IN";
    if (langClean.startsWith("hi")) sarvamLang = "hi-IN";
    else if (langClean.startsWith("en")) sarvamLang = "en-IN";

    const sarvamFormData = new FormData();
    sarvamFormData.append("file", audioFile, "voice_input.wav");
    sarvamFormData.append("model", "saaras:v3");
    sarvamFormData.append("language_code", sarvamLang);
    sarvamFormData.append("with_diarization", "false");

    const res = await fetch(SARVAM_STT_ENDPOINT, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: sarvamFormData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Sarvam STT error from Next.js API route:", res.status, errText);
      return NextResponse.json(
        { error: "Sarvam AI STT call failed", details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const transcript = (data.transcript || "").trim();
    const detectedLang = (data.language_code || sarvamLang).split("-")[0];

    return NextResponse.json({
      transcript,
      language: detectedLang,
      provider: "sarvam_ai",
    });
  } catch (err: any) {
    console.error("Error in Next.js voice transcribe route:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
