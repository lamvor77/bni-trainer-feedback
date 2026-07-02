import { NextResponse } from "next/server";
import { createFeedbackPage } from "@/lib/notion";
import type {
  FeedbackFormData,
  RatingQuestionId,
  RatingValues,
  TextQuestionId,
  TextValues,
  TrainingMeta,
} from "@/types/feedback";

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

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function parseFeedbackPayload(body: unknown): FeedbackFormData | null {
  if (typeof body !== "object" || body === null) return null;
  const { training, ratings, texts, submittedAt } = body as Record<string, unknown>;

  if (typeof ratings !== "object" || ratings === null) return null;
  const ratingsRecord = ratings as Record<string, unknown>;
  const parsedRatings = {} as RatingValues;
  for (const id of RATING_QUESTION_IDS) {
    const value = ratingsRecord[id];
    if (typeof value !== "number" || value < 1 || value > 5) return null;
    parsedRatings[id] = value;
  }

  if (typeof texts !== "object" || texts === null) return null;
  const textsRecord = texts as Record<string, unknown>;
  for (const id of REQUIRED_TEXT_QUESTION_IDS) {
    const value = textsRecord[id];
    if (typeof value !== "string" || value.trim().length === 0) return null;
  }
  const parsedTexts: TextValues = {
    highlight: String(textsRecord.highlight),
    improvement: String(textsRecord.improvement),
    message: typeof textsRecord.message === "string" ? textsRecord.message : "",
  };

  const trainingRecord =
    typeof training === "object" && training !== null ? (training as Record<string, unknown>) : {};
  const parsedTraining: TrainingMeta = {
    trainingId: asString(trainingRecord.trainingId),
    trainingTitle: asString(trainingRecord.trainingTitle),
    trainerName: asString(trainingRecord.trainerName),
    trainingDate: asString(trainingRecord.trainingDate),
  };

  const parsedSubmittedAt = typeof submittedAt === "string" ? submittedAt : new Date().toISOString();

  return {
    ratings: parsedRatings,
    texts: parsedTexts,
    training: parsedTraining,
    submittedAt: parsedSubmittedAt,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });
  }

  const payload = parseFeedbackPayload(body);
  if (!payload) {
    return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });
  }

  console.log("[BNI Feedback] received submission", payload);

  try {
    await createFeedbackPage(payload);
  } catch (error) {
    console.error("[BNI Feedback] failed to save to Notion", error);
    return NextResponse.json(
      { ok: false, message: "피드백 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "피드백이 접수되었습니다." });
}
