import { NextResponse } from "next/server";
import type { RatingQuestionId, TextQuestionId } from "@/types/feedback";

const RATING_QUESTION_IDS: RatingQuestionId[] = [
  "overall",
  "delivery",
  "preparation",
  "clarity",
  "usefulness",
  "duration",
  "participation",
];

const REQUIRED_TEXT_QUESTION_IDS: TextQuestionId[] = ["highlight", "improvement"];

function isValidPayload(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const { ratings, texts } = body as Record<string, unknown>;

  if (typeof ratings !== "object" || ratings === null) return false;
  for (const id of RATING_QUESTION_IDS) {
    const value = (ratings as Record<string, unknown>)[id];
    if (typeof value !== "number" || value < 1 || value > 5) return false;
  }

  if (typeof texts !== "object" || texts === null) return false;
  for (const id of REQUIRED_TEXT_QUESTION_IDS) {
    const value = (texts as Record<string, unknown>)[id];
    if (typeof value !== "string" || value.trim().length === 0) return false;
  }

  return true;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { ok: false, message: "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  console.log("[BNI Feedback] received submission", body);

  return NextResponse.json({ ok: true, message: "피드백이 접수되었습니다." });
}
