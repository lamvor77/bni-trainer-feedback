export type FeedbackAnalysisResult = {
  summary: string;
  averageScores: {
    overallSatisfaction: number;
    delivery: number;
    preparation: number;
    understanding: number;
    practicality: number;
    timeManagement: number;
    participation: number;
  };
  strengths: string[];
  improvements: string[];
  trainerAdvice: string;
  keepForNextTraining: string[];
  improveForNextTraining: string[];
  oneLineReview: string;
};
