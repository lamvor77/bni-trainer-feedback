export type RatingQuestionId =
  | "overall"
  | "delivery"
  | "preparation"
  | "clarity"
  | "usefulness"
  | "duration"
  | "participation";

export type TextQuestionId = "highlight" | "improvement" | "message";

export type RatingValues = Record<RatingQuestionId, number | null>;
export type TextValues = Record<TextQuestionId, string>;

export type TrainingMeta = {
  trainingId?: string;
  trainingTitle?: string;
  trainerName?: string;
  trainingDate?: string;
};

export interface FeedbackFormData {
  ratings: RatingValues;
  texts: TextValues;
  training: TrainingMeta;
  submittedAt: string;
}

export type TrainingTemplate = {
  id: string;
  title: string;
  defaultTrainer: string;
  active: boolean;
};
