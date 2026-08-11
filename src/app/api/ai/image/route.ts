import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024, style = "photorealistic" } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    // Enhance prompt with style direction
    let enhancedPrompt = prompt.trim();
    if (style === "photorealistic") {
      enhancedPrompt += ", highly detailed photorealistic, 8k resolution, professional photography";
    } else if (style === "logo") {
      enhancedPrompt += ", vector logo design, flat minimalist, clean modern typography, graphic design";
    } else if (style === "digital_art") {
      enhancedPrompt += ", vibrant digital illustration, 4k digital art, artstation trending";
    } else if (style === "minimalist") {
      enhancedPrompt += ", minimalist modern aesthetic, clean line art, elegant design";
    } else if (style === "3d_render") {
      enhancedPrompt += ", 3D render, octane render, soft lighting, 4k resolution";
    }

    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: enhancedPrompt,
      originalPrompt: prompt,
      width,
      height,
      seed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate AI image" },
      { status: 500 }
    );
  }
}
