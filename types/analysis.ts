export type FeedbackForAnalysis = {
  trainingId: string;
  trainingTitle: string;
  trainerName?: string;
  trainingDate?: string;
  submittedAt?: string;
  overallSatisfaction: number;
  delivery: number;
  preparation: number;
  understanding: number;
  practicality: number;
  timeManagement: number;
  participation: number;
  bestPoint: string;
  improvementPoint: string;
  messageToTrainer?: string;
};

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

export type AnalysisReportSummary = {
  id: string;
  name: string;
  trainingId: string;
  trainingTitle: string;
  analyzedAt: string;
  oneLineReview: string;
  overallSatisfaction: number;
};
