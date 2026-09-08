import { Shop, AIRecommendation } from "@/types";
import { addMinutes, format, parseISO, isAfter } from "date-fns";

export interface RecommendationInput {
  shops: Shop[];
  deadline?: string; // ISO string
  studentLat?: number;
  studentLng?: number;
  pageCount?: number;
  copies?: number;
  printType?: "bw" | "color";
}

export interface ScoredShop {
  shop: Shop;
  recommendation: AIRecommendation;
}

function calculateDistance(
  lat1?: number,
  lng1?: number,
  lat2?: number,
  lng2?: number
): number {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 1; // default 1km
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function predictCompletionMinutes(shop: Shop, pageCount: number, copies: number): number {
  const totalPages = pageCount * copies;
  const baseTime = shop.avg_completion_minutes;
  const queueTime = shop.current_queue * (baseTime * 0.3);
  const pageTime = Math.ceil(totalPages / 20) * 2;
  return Math.round(baseTime + queueTime + pageTime);
}

export function scoreShops(input: RecommendationInput): ScoredShop[] {
  const { shops, deadline, pageCount = 10, copies = 1 } = input;
  const now = new Date();

  const openShops = shops.filter((s) => s.is_open && s.status === "approved");

  const scored: ScoredShop[] = openShops.map((shop) => {
    const completionMins = predictCompletionMinutes(shop, pageCount, copies);
    const predictedReady = addMinutes(now, completionMins);
    const reasons: string[] = [];
    let score = 0;

    // === Queue score (0–25) ===
    const queueScore = Math.max(0, 25 - shop.current_queue * 3);
    score += queueScore;
    if (shop.current_queue <= 2) reasons.push("Very low queue right now");
    else if (shop.current_queue <= 5) reasons.push("Short queue");

    // === Rating score (0–25) ===
    const ratingScore = (shop.rating / 5) * 25;
    score += ratingScore;
    if (shop.rating >= 4.5) reasons.push("Excellent rating");
    else if (shop.rating >= 4.0) reasons.push("High rating");

    // === Price score (0–20) ===
    const pricePerPage =
      input.printType === "color" ? shop.price_color : shop.price_bw;
    const priceScore = Math.max(0, 20 - pricePerPage * 2);
    score += priceScore;
    if (pricePerPage <= 1.5) reasons.push("Very affordable pricing");
    else if (pricePerPage <= 2.5) reasons.push("Competitive pricing");

    // === Speed score (0–20) ===
    const speedScore = Math.max(0, 20 - completionMins * 0.3);
    score += speedScore;
    if (completionMins <= 15) reasons.push("Fastest predicted completion");
    else if (completionMins <= 30) reasons.push("Quick turnaround");

    // === Deadline score (0–10) ===
    let deadlineScore = 5;
    let meetsDeadline = true;
    if (deadline) {
      const dl = parseISO(deadline);
      meetsDeadline = !isAfter(predictedReady, dl);
      if (meetsDeadline) {
        const buffer = (dl.getTime() - predictedReady.getTime()) / 60000;
        deadlineScore = buffer > 30 ? 10 : 5;
        reasons.push("Ready before your deadline");
      } else {
        deadlineScore = -20;
        reasons.push("⚠ May not meet your deadline");
      }
    }
    score += deadlineScore;

    // === Availability bonus ===
    if (shop.is_open) {
      score += 5;
      reasons.push("Open now");
    }

    const confidence = Math.min(99, Math.max(60, Math.round(score)));

    return {
      shop,
      recommendation: {
        shop_id: shop.id,
        shop_name: shop.name,
        score: Math.round(score),
        confidence,
        predicted_ready_at: predictedReady.toISOString(),
        reasons,
        is_recommended: false,
        explanation: "",
      },
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.recommendation.score - a.recommendation.score);

  // Mark top as recommended and generate explanation
  if (scored.length > 0) {
    scored[0].recommendation.is_recommended = true;
    const top = scored[0];
    const readyTime = format(
      parseISO(top.recommendation.predicted_ready_at),
      "h:mm a"
    );
    top.recommendation.explanation = `${top.shop.name} is the best match based on its ${
      top.shop.current_queue <= 2 ? "low queue" : "manageable queue"
    }, ${top.shop.rating >= 4.0 ? "high rating" : "rating"} of ${top.shop.rating.toFixed(1)}★, and competitive pricing. Predicted ready by ${readyTime}.`;
  }

  return scored;
}

// Server-side AI-enhanced recommendation using Gemini/OpenAI
export async function getAIRecommendation(
  input: RecommendationInput
): Promise<ScoredShop[]> {
  // First compute deterministic scores
  const scored = scoreShops(input);

  if (scored.length === 0) return scored;

  const apiKey = process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER || "gemini";

  if (!apiKey) return scored;

  try {
    const topShop = scored[0].shop;
    const shopSummary = scored
      .slice(0, 3)
      .map(
        (s) =>
          `${s.shop.name}: queue=${s.shop.current_queue}, rating=${s.shop.rating}, price_bw=₹${s.shop.price_bw}, score=${s.recommendation.score}`
      )
      .join("; ");

    const prompt = `You are a campus printing assistant. Based on these shop scores: ${shopSummary}. The top recommended shop is "${topShop.name}" with a score of ${scored[0].recommendation.score}. The student's deadline is ${input.deadline ? format(parseISO(input.deadline), "h:mm a") : "not specified"}. Write a single, friendly 1-2 sentence explanation of why "${topShop.name}" is the best choice. Be concise and mention 2-3 key reasons. Do not use markdown.`;

    let explanation = scored[0].recommendation.explanation;

    if (provider === "gemini") {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      explanation = result.response.text().trim();
    } else if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 100,
        }),
      });
      const data = await response.json();
      explanation = data.choices?.[0]?.message?.content?.trim() ?? explanation;
    }

    scored[0].recommendation.explanation = explanation;
  } catch (err) {
    // Fall back to deterministic explanation
    console.error("AI recommendation enhancement failed:", err);
  }

  return scored;
}
