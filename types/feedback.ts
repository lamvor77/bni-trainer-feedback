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

export interface FeedbackFormData {
  ratings: RatingValues;
  texts: TextValues;
}
