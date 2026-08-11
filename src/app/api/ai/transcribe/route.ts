import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Check size limit: max 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio file exceeds 25MB size limit" }, { status: 400 });
    }

    if (!groqKey) {
      return NextResponse.json(
        {
          error: "GROQ_KEY_MISSING",
          message: "Groq API Key is missing for voice STT. Configure GROQ_API_KEY in environment or Settings.",
        },
        { status: 400 }
      );
    }

    // Forward file to Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append("file", file, file.name || "audio.webm");
    groqFormData.append("model", process.env.STT_MODEL || "whisper-large-v3-turbo");
    groqFormData.append("language", "en");
    groqFormData.append("prompt", "Hinglish speech, Indian personal and company names, Indian currency rupees INR");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: groqFormData,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return NextResponse.json({ error: "Groq STT failed", details: errText }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (error: any) {
    console.error("Transcribe Error:", error);
    return NextResponse.json(
      { error: "TRANSCRIBE_ERROR", message: error.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
