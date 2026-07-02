import { NextResponse } from "next/server";
import { analyzeFeedbackBatch } from "@/lib/analysis";
import { getFeedbackByTrainingId } from "@/lib/notion";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { trainingId } = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  if (typeof trainingId !== "string" || trainingId.trim().length === 0) {
    return NextResponse.json({ ok: false, message: "trainingId가 필요합니다." }, { status: 400 });
  }

  const feedbackList = await getFeedbackByTrainingId(trainingId);

  if (feedbackList.length === 0) {
    return NextResponse.json({ ok: false, message: "분석할 피드백이 없습니다." });
  }

  try {
    const analysis = await analyzeFeedbackBatch(feedbackList);
    return NextResponse.json({ ok: true, analysis });
  } catch (error) {
    console.error("[BNI Feedback] analysis failed", error);
    const message = error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
