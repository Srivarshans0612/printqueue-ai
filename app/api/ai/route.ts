import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { message } = await request.json();

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "Invalid message" }, { status: 400 });
  }

  const apiKey = process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER ?? "gemini";

  if (!apiKey) {
    return Response.json({
      response: "AI assistant is not configured. Please set up the AI_API_KEY environment variable to enable this feature. In the meantime, I can tell you that PrintQueue AI helps students find the best campus printing shop based on queue length, price, rating, and deadline using smart AI-powered recommendations.",
    });
  }

  const systemPrompt = `You are a helpful printing assistant for PrintQueue AI, a smart campus printing platform. Help students with:
- Understanding printing options (B&W vs color, pages, copies)
- Cost estimation and pricing
- Order tracking and status
- Choosing the right shop for their deadline
- Understanding the eco score
- General printing advice

Keep responses concise (2-3 sentences max). Be friendly and practical. Focus only on printing-related topics.`;

  try {
    if (provider === "gemini") {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent(message);
      return Response.json({ response: result.response.text().trim() });
    } else if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 150,
        }),
      });
      const data = await response.json();
      return Response.json({ response: data.choices?.[0]?.message?.content?.trim() ?? "Unable to generate response." });
    }

    return Response.json({ error: "Unknown AI provider" }, { status: 500 });
  } catch (err) {
    console.error("AI API error:", err);
    return Response.json({ response: "I'm having trouble connecting to the AI right now. Please try again." });
  }
}
