import { NextResponse } from "next/server";
import { analyzeFeedbackBatch } from "@/lib/analysis";

function buildMockFeedbackList(trainingId: string | undefined, trainingTitle: string | undefined): unknown[] {
  const label = trainingTitle || trainingId || "일반교육";

  return [
    {
      trainingId,
      trainingTitle: label,
      ratings: {
        overall: 5,
        delivery: 4,
        preparation: 4,
        clarity: 5,
        usefulness: 4,
        duration: 3,
        participation: 4,
      },
      texts: {
        highlight: "트레이너의 사례 설명이 유익했습니다.",
        improvement: "실습 시간이 조금 더 있으면 좋겠습니다.",
        message: "항상 감사합니다!",
      },
    },
    {
      trainingId,
      trainingTitle: label,
      ratings: {
        overall: 4,
        delivery: 4,
        preparation: 5,
        clarity: 4,
        usefulness: 4,
        duration: 4,
        participation: 4,
      },
      texts: {
        highlight: "교육 준비가 체계적이었습니다.",
        improvement: "Q&A 시간이 짧았습니다.",
        message: "",
      },
    },
    {
      trainingId,
      trainingTitle: label,
      ratings: {
        overall: 4,
        delivery: 3,
        preparation: 4,
        clarity: 4,
        usefulness: 4,
        duration: 4,
        participation: 5,
      },
      texts: {
        highlight: "참여자 간 소통이 활발했습니다.",
        improvement: "일부 개념 설명이 빨랐습니다.",
        message: "다음 교육도 기대됩니다.",
      },
    },
  ];
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { trainingId, trainingTitle } =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const mockFeedbackList = buildMockFeedbackList(
    typeof trainingId === "string" ? trainingId : undefined,
    typeof trainingTitle === "string" ? trainingTitle : undefined
  );

  const analysis = await analyzeFeedbackBatch(mockFeedbackList);

  return NextResponse.json({ ok: true, analysis });
}
