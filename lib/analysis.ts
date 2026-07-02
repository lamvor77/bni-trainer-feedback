import type { FeedbackAnalysisResult } from "@/types/analysis";

export async function analyzeFeedbackBatch(feedbackList: unknown[]): Promise<FeedbackAnalysisResult> {
  const count = Array.isArray(feedbackList) ? feedbackList.length : 0;

  return {
    summary: `이번 교육에는 총 ${count}건의 피드백이 수집되었습니다. (Mock 데이터 — 실제 AI 분석은 아직 연동되지 않았습니다.)`,
    averageScores: {
      overallSatisfaction: 4.2,
      delivery: 4.0,
      preparation: 4.1,
      understanding: 4.3,
      practicality: 4.0,
      timeManagement: 3.8,
      participation: 4.1,
    },
    strengths: [
      "트레이너의 전달력이 좋았다는 의견이 많았습니다.",
      "실제 사례 중심의 설명이 도움이 되었습니다.",
      "교육 준비가 체계적으로 느껴졌습니다.",
      "참여자 간 소통 기회가 충분했습니다.",
      "교육 내용이 실무에 바로 적용 가능했습니다.",
    ],
    improvements: [
      "교육 시간이 다소 부족했다는 의견이 있었습니다.",
      "일부 개념 설명이 빠르게 지나갔습니다.",
      "실습 시간을 더 늘려달라는 요청이 있었습니다.",
      "Q&A 시간이 짧았습니다.",
      "자료 사전 공유가 있었으면 좋겠다는 의견이 있었습니다.",
    ],
    trainerAdvice:
      "전달력과 준비도에 대한 만족도가 높습니다. 다음 교육에서는 실습·질의응답 시간을 조금 더 확보하면 완성도가 더 높아질 것입니다. (Mock 데이터)",
    keepForNextTraining: [
      "사례 중심의 설명 방식",
      "체계적인 교육 준비",
      "참여자와의 활발한 소통",
    ],
    improveForNextTraining: [
      "실습 및 Q&A 시간 확대",
      "핵심 개념 설명 속도 조절",
      "사전 자료 공유",
    ],
    oneLineReview: "전달력과 준비도가 돋보인 교육이었으며, 시간 배분만 조금 더 다듬으면 좋겠습니다. (Mock)",
  };
}
