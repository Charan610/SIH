import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return NextResponse.json({
      status: "saved",
      answer_id: Date.now(),
      step_number: payload.step_number || 1,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save answer" }, { status: 500 });
  }
}
