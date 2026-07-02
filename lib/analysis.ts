import OpenAI from "openai";
import type { FeedbackAnalysisResult, FeedbackForAnalysis } from "@/types/analysis";

const DEFAULT_MODEL = "gpt-4.1-mini";

const SYSTEM_PROMPT = `당신은 BNI 교육 트레이너를 돕는 피드백 분석 어시스턴트입니다.
아래 JSON 스키마와 정확히 일치하는 JSON 객체만 응답하세요. 다른 설명 텍스트는 포함하지 마세요.

{
  "summary": "교육 전체 요약 (한 문단)",
  "averageScores": {
    "overallSatisfaction": 0,
    "delivery": 0,
    "preparation": 0,
    "understanding": 0,
    "practicality": 0,
    "timeManagement": 0,
    "participation": 0
  },
  "strengths": ["강점 최대 5개, 응답 근거 포함"],
  "improvements": ["개선점 최대 5개, 건설적인 톤 유지"],
  "trainerAdvice": "트레이너에게 주는 조언 (한 문단)",
  "keepForNextTraining": ["다음 교육에서 유지할 점"],
  "improveForNextTraining": ["다음 교육에서 개선할 점"],
  "oneLineReview": "한 줄 종합 평가"
}

트레이너가 상처받지 않도록 부정적 피드백은 건설적으로 표현하되, 내용을 축소하거나 왜곡하지 마세요.`;

function computeAverageScores(feedbackList: FeedbackForAnalysis[]): FeedbackAnalysisResult["averageScores"] {
  const sums = {
    overallSatisfaction: 0,
    delivery: 0,
    preparation: 0,
    understanding: 0,
    practicality: 0,
    timeManagement: 0,
    participation: 0,
  };

  for (const feedback of feedbackList) {
    sums.overallSatisfaction += feedback.overallSatisfaction;
    sums.delivery += feedback.delivery;
    sums.preparation += feedback.preparation;
    sums.understanding += feedback.understanding;
    sums.practicality += feedback.practicality;
    sums.timeManagement += feedback.timeManagement;
    sums.participation += feedback.participation;
  }

  const count = feedbackList.length;
  const round1 = (value: number) => Math.round((value / count) * 10) / 10;

  return {
    overallSatisfaction: round1(sums.overallSatisfaction),
    delivery: round1(sums.delivery),
    preparation: round1(sums.preparation),
    understanding: round1(sums.understanding),
    practicality: round1(sums.practicality),
    timeManagement: round1(sums.timeManagement),
    participation: round1(sums.participation),
  };
}

function buildUserPrompt(
  feedbackList: FeedbackForAnalysis[],
  averageScores: FeedbackAnalysisResult["averageScores"]
): string {
  const trainingTitle = feedbackList[0]?.trainingTitle || "일반교육";
  const trainerName = feedbackList.find((feedback) => feedback.trainerName)?.trainerName || "(미상)";

  const feedbackEntries = feedbackList
    .map(
      (feedback, index) =>
        `${index + 1}.
- 가장 좋았던 점: ${feedback.bestPoint || "(없음)"}
- 개선하면 좋을 점: ${feedback.improvementPoint || "(없음)"}
- 응원 메시지: ${feedback.messageToTrainer || "(없음)"}`
    )
    .join("\n\n");

  return `[교육 정보]
교육명: ${trainingTitle}
트레이너: ${trainerName}
피드백 건수: ${feedbackList.length}

[평균 점수 (1~5점 척도)]
전체 만족도: ${averageScores.overallSatisfaction}
전달력: ${averageScores.delivery}
준비도: ${averageScores.preparation}
이해도: ${averageScores.understanding}
실무 적용성: ${averageScores.practicality}
시간 관리: ${averageScores.timeManagement}
참여도: ${averageScores.participation}

[개별 피드백 응답]
${feedbackEntries}

위 데이터를 바탕으로 시스템 프롬프트에서 지정한 JSON 스키마에 맞춰 분석 결과를 작성하세요.`;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeAnalysisResult(
  parsed: unknown,
  averageScores: FeedbackAnalysisResult["averageScores"]
): FeedbackAnalysisResult {
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }

  const obj = parsed as Record<string, unknown>;

  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    averageScores,
    strengths: toStringArray(obj.strengths).slice(0, 5),
    improvements: toStringArray(obj.improvements).slice(0, 5),
    trainerAdvice: typeof obj.trainerAdvice === "string" ? obj.trainerAdvice : "",
    keepForNextTraining: toStringArray(obj.keepForNextTraining),
    improveForNextTraining: toStringArray(obj.improveForNextTraining),
    oneLineReview: typeof obj.oneLineReview === "string" ? obj.oneLineReview : "",
  };
}

export async function analyzeFeedbackBatch(feedbackList: FeedbackForAnalysis[]): Promise<FeedbackAnalysisResult> {
  if (feedbackList.length === 0) {
    throw new Error("분석할 피드백이 없습니다.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요.");
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const averageScores = computeAverageScores(feedbackList);
  const client = new OpenAI({ apiKey });

  let content: string | null;

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(feedbackList, averageScores) },
      ],
    });
    content = completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("[BNI Feedback] OpenAI request failed", error);
    throw new Error("AI 분석 요청 중 오류가 발생했습니다.");
  }

  if (!content) {
    throw new Error("AI 응답이 비어 있습니다.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error("[BNI Feedback] failed to parse AI response as JSON", error, content);
    throw new Error("AI 응답을 해석하지 못했습니다.");
  }

  return normalizeAnalysisResult(parsed, averageScores);
}
