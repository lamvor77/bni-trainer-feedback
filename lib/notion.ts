import { Client } from "@notionhq/client";
import type { CreatePageParameters } from "@notionhq/client";
import type { FeedbackFormData, TrainingMeta } from "@/types/feedback";

type NotionProperties = NonNullable<CreatePageParameters["properties"]>;

function getNotionEnv(): { apiKey: string; databaseId: string } | null {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_FEEDBACK_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return null;
  }

  return { apiKey, databaseId };
}

function isValidDateString(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(new Date(value).getTime());
}

function toDateStart(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date(value).toISOString();
}

function formatTimestamp(isoString: string): string {
  return isoString.slice(0, 16).replace("T", " ");
}

function richText(value: string | undefined) {
  return {
    rich_text: value ? [{ text: { content: value } }] : [],
  };
}

function buildFeedbackName(training: TrainingMeta, submittedAtIso: string): string {
  const subject = training.trainingTitle || training.trainingId || "일반교육";
  return `피드백 - ${subject} - ${formatTimestamp(submittedAtIso)}`;
}

function buildFeedbackProperties(payload: FeedbackFormData): NotionProperties {
  const { training, ratings, texts, submittedAt } = payload;
  const submittedAtIso = isValidDateString(submittedAt) ? submittedAt : new Date().toISOString();

  const properties: NotionProperties = {
    Name: { title: [{ text: { content: buildFeedbackName(training, submittedAtIso) } }] },
    "Training ID": richText(training.trainingId),
    "Training Title": richText(training.trainingTitle),
    Trainer: richText(training.trainerName),
    "Submitted At": { date: { start: submittedAtIso } },
    "Overall Satisfaction": { number: ratings.overall },
    Delivery: { number: ratings.delivery },
    Preparation: { number: ratings.preparation },
    Understanding: { number: ratings.clarity },
    Practicality: { number: ratings.usefulness },
    "Time Management": { number: ratings.duration },
    Participation: { number: ratings.participation },
    "Best Point": richText(texts.highlight),
    "Improvement Point": richText(texts.improvement),
    "Message to Trainer": richText(texts.message),
  };

  if (isValidDateString(training.trainingDate)) {
    properties["Training Date"] = { date: { start: toDateStart(training.trainingDate) } };
  }

  return properties;
}

export async function createFeedbackPage(payload: FeedbackFormData): Promise<void> {
  const env = getNotionEnv();

  if (!env) {
    throw new Error("Notion 환경변수(NOTION_API_KEY, NOTION_FEEDBACK_DATABASE_ID)가 설정되지 않았습니다.");
  }

  const notion = new Client({ auth: env.apiKey });

  await notion.pages.create({
    parent: { database_id: env.databaseId },
    properties: buildFeedbackProperties(payload),
  });
}
