import { NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { aiTools } from "@/lib/ai/tools";
import { generateSystemPrompt } from "@/lib/ai/systemPrompt";
import { mockDb } from "@/lib/mockStore";

export const maxDuration = 60; // Hobby tier max duration

export async function POST(req: NextRequest) {
  try {
    const provider = process.env.AI_PROVIDER || "openai";
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // Check if API key is present for chosen provider
    if (provider === "openai" && !openaiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_KEY_MISSING",
          message: "Add your OpenAI API key in Settings to turn this on",
        },
        { status: 400 }
      );
    }

    if (provider === "google" && !googleKey) {
      return NextResponse.json(
        {
          error: "GOOGLE_KEY_MISSING",
          message: "Add your AI key in Settings to turn this on",
        },
        { status: 400 }
      );
    }

    if (provider === "groq" && !groqKey) {
      return NextResponse.json(
        {
          error: "GROQ_KEY_MISSING",
          message: "Add your Groq API key in Settings to turn this on",
        },
        { status: 400 }
      );
    }

    const { messages, threadId } = await req.json();

    // Select model provider dynamically
    let model: any;
    if (provider === "openai") {
      model = openai(process.env.AI_MODEL || "gpt-4o-mini");
    } else if (provider === "groq") {
      model = groq(process.env.AI_MODEL || "llama-3.3-70b-versatile");
    } else {
      model = google(process.env.AI_MODEL || "gemini-2.5-flash");
    }

    const systemPrompt = generateSystemPrompt();
    const trimmedMessages = Array.isArray(messages) ? messages.slice(-12) : [];

    const result = streamText({
      model,
      system: systemPrompt,
      messages: trimmedMessages,
      tools: aiTools,
      stopWhen: stepCountIs(12),
      onFinish: async (event) => {
        if (event.usage) {
          mockDb.aiUsage.unshift({
            id: `u_${Math.random().toString(36).substring(2, 10)}`,
            model: process.env.AI_MODEL || "gpt-4o-mini",
            input_tokens: event.usage.inputTokens || 0,
            output_tokens: event.usage.outputTokens || 0,
            created_at: new Date().toISOString(),
          });
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return NextResponse.json(
      { error: "AI_ERROR", message: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
