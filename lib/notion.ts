import { Client } from "@notionhq/client";
import type { CreatePageParameters } from "@notionhq/client";
import type { FeedbackFormData, TrainingMeta, TrainingTemplate } from "@/types/feedback";
import type { AnalysisReportSummary, FeedbackAnalysisResult, FeedbackForAnalysis } from "@/types/analysis";

type NotionProperties = NonNullable<CreatePageParameters["properties"]>;

function getNotionEnv(): { apiKey: string; databaseId: string } | null {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_FEEDBACK_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return null;
  }

  return { apiKey, databaseId };
}

function getTrainingTemplateEnv(): { apiKey: string; databaseId: string } | null {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_TRAINING_TEMPLATE_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return null;
  }

  return { apiKey, databaseId };
}

function getAnalysisReportEnv(): { apiKey: string; databaseId: string } | null {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_ANALYSIS_REPORT_DATABASE_ID;

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

function readTitleText(property: unknown): string {
  if (typeof property !== "object" || property === null) return "";
  const { title } = property as Record<string, unknown>;
  if (!Array.isArray(title)) return "";
  return title
    .map((item) =>
      typeof item === "object" && item !== null && typeof (item as Record<string, unknown>).plain_text === "string"
        ? ((item as Record<string, unknown>).plain_text as string)
        : ""
    )
    .join("");
}

function readRichText(property: unknown): string {
  if (typeof property !== "object" || property === null) return "";
  const { rich_text: richTextValue } = property as Record<string, unknown>;
  if (!Array.isArray(richTextValue)) return "";
  return richTextValue
    .map((item) =>
      typeof item === "object" && item !== null && typeof (item as Record<string, unknown>).plain_text === "string"
        ? ((item as Record<string, unknown>).plain_text as string)
        : ""
    )
    .join("");
}

function readCheckbox(property: unknown): boolean {
  if (typeof property !== "object" || property === null) return false;
  return (property as Record<string, unknown>).checkbox === true;
}

function readNumber(property: unknown): number {
  if (typeof property !== "object" || property === null) return 0;
  const value = (property as Record<string, unknown>).number;
  return typeof value === "number" ? value : 0;
}

function readDateStart(property: unknown): string | undefined {
  if (typeof property !== "object" || property === null) return undefined;
  const date = (property as Record<string, unknown>).date;
  if (typeof date !== "object" || date === null) return undefined;
  const start = (date as Record<string, unknown>).start;
  return typeof start === "string" ? start : undefined;
}

export async function getTrainingTemplates(): Promise<TrainingTemplate[]> {
  const env = getTrainingTemplateEnv();

  if (!env) {
    return [];
  }

  try {
    const notion = new Client({ auth: env.apiKey });
    const database = await notion.databases.retrieve({ database_id: env.databaseId });
    const dataSourceId = "data_sources" in database ? database.data_sources[0]?.id : undefined;

    if (!dataSourceId) {
      return [];
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: { property: "Active", checkbox: { equals: true } },
    });

    const templates: TrainingTemplate[] = [];

    for (const result of response.results) {
      if (result.object !== "page") continue;
      const properties = (result as { properties?: unknown }).properties;
      if (typeof properties !== "object" || properties === null) continue;

      const props = properties as Record<string, unknown>;
      const title = readTitleText(props["Name"]);
      if (!title) continue;

      const templateId = readRichText(props["Template ID"]) || result.id;
      const defaultTrainer = readRichText(props["Default Trainer"]);
      const active = readCheckbox(props["Active"]);

      templates.push({ id: templateId, title, defaultTrainer, active });
    }

    return templates;
  } catch (error) {
    console.error("[BNI Feedback] failed to load training templates", error);
    return [];
  }
}

export async function getFeedbackByTrainingId(trainingId: string): Promise<FeedbackForAnalysis[]> {
  const env = getNotionEnv();

  if (!env) {
    return [];
  }

  try {
    const notion = new Client({ auth: env.apiKey });
    const database = await notion.databases.retrieve({ database_id: env.databaseId });
    const dataSourceId = "data_sources" in database ? database.data_sources[0]?.id : undefined;

    if (!dataSourceId) {
      return [];
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: { property: "Training ID", rich_text: { equals: trainingId } },
      sorts: [{ property: "Submitted At", direction: "descending" }],
    });

    const feedbackList: FeedbackForAnalysis[] = [];

    for (const result of response.results) {
      if (result.object !== "page") continue;
      const properties = (result as { properties?: unknown }).properties;
      if (typeof properties !== "object" || properties === null) continue;

      const props = properties as Record<string, unknown>;

      feedbackList.push({
        trainingId: readRichText(props["Training ID"]) || trainingId,
        trainingTitle: readRichText(props["Training Title"]),
        trainerName: readRichText(props["Trainer"]) || undefined,
        trainingDate: readDateStart(props["Training Date"]),
        submittedAt: readDateStart(props["Submitted At"]),
        overallSatisfaction: readNumber(props["Overall Satisfaction"]),
        delivery: readNumber(props["Delivery"]),
        preparation: readNumber(props["Preparation"]),
        understanding: readNumber(props["Understanding"]),
        practicality: readNumber(props["Practicality"]),
        timeManagement: readNumber(props["Time Management"]),
        participation: readNumber(props["Participation"]),
        bestPoint: readRichText(props["Best Point"]),
        improvementPoint: readRichText(props["Improvement Point"]),
        messageToTrainer: readRichText(props["Message to Trainer"]) || undefined,
      });
    }

    return feedbackList;
  } catch (error) {
    console.error("[BNI Feedback] failed to load feedback for analysis", error);
    return [];
  }
}

function buildAnalysisReportName(trainingTitle: string, trainingId: string, analyzedAtIso: string): string {
  const subject = trainingTitle || trainingId || "일반교육";
  return `분석 리포트 - ${subject} - ${formatTimestamp(analyzedAtIso)}`;
}

function buildAnalysisReportProperties(params: {
  trainingId: string;
  trainingTitle: string;
  analysis: FeedbackAnalysisResult;
  analyzedAtIso: string;
}): NotionProperties {
  const { trainingId, trainingTitle, analysis, analyzedAtIso } = params;

  return {
    Name: {
      title: [{ text: { content: buildAnalysisReportName(trainingTitle, trainingId, analyzedAtIso) } }],
    },
    "Training ID": richText(trainingId),
    "Training Title": richText(trainingTitle),
    "Analyzed At": { date: { start: analyzedAtIso } },
    Summary: richText(analysis.summary),
    "One Line Review": richText(analysis.oneLineReview),
    "Overall Satisfaction": { number: analysis.averageScores.overallSatisfaction },
    Delivery: { number: analysis.averageScores.delivery },
    Preparation: { number: analysis.averageScores.preparation },
    Understanding: { number: analysis.averageScores.understanding },
    Practicality: { number: analysis.averageScores.practicality },
    "Time Management": { number: analysis.averageScores.timeManagement },
    Participation: { number: analysis.averageScores.participation },
    Strengths: richText(analysis.strengths.join("\n")),
    Improvements: richText(analysis.improvements.join("\n")),
    "Trainer Advice": richText(analysis.trainerAdvice),
    "Keep For Next Training": richText(analysis.keepForNextTraining.join("\n")),
    "Improve For Next Training": richText(analysis.improveForNextTraining.join("\n")),
  };
}

export async function createAnalysisReportPage(params: {
  trainingId: string;
  trainingTitle: string;
  analysis: FeedbackAnalysisResult;
}): Promise<void> {
  const env = getAnalysisReportEnv();

  if (!env) {
    throw new Error(
      "Notion 환경변수(NOTION_API_KEY, NOTION_ANALYSIS_REPORT_DATABASE_ID)가 설정되지 않았습니다."
    );
  }

  const analyzedAtIso = new Date().toISOString();
  const notion = new Client({ auth: env.apiKey });

  try {
    await notion.pages.create({
      parent: { database_id: env.databaseId },
      properties: buildAnalysisReportProperties({ ...params, analyzedAtIso }),
    });
  } catch (error) {
    console.error("[BNI Feedback] failed to save analysis report to Notion", error);
    throw new Error("분석 결과 저장 중 오류가 발생했습니다.");
  }
}

export async function getAnalysisReports(limit: number = 10): Promise<AnalysisReportSummary[]> {
  const env = getAnalysisReportEnv();

  if (!env) {
    return [];
  }

  try {
    const notion = new Client({ auth: env.apiKey });
    const database = await notion.databases.retrieve({ database_id: env.databaseId });
    const dataSourceId = "data_sources" in database ? database.data_sources[0]?.id : undefined;

    if (!dataSourceId) {
      return [];
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [{ property: "Analyzed At", direction: "descending" }],
      page_size: limit,
    });

    const reports: AnalysisReportSummary[] = [];

    for (const result of response.results) {
      if (result.object !== "page") continue;
      const properties = (result as { properties?: unknown }).properties;
      if (typeof properties !== "object" || properties === null) continue;

      const props = properties as Record<string, unknown>;

      reports.push({
        id: result.id,
        name: readTitleText(props["Name"]),
        trainingId: readRichText(props["Training ID"]),
        trainingTitle: readRichText(props["Training Title"]),
        analyzedAt: readDateStart(props["Analyzed At"]) || "",
        oneLineReview: readRichText(props["One Line Review"]),
        overallSatisfaction: readNumber(props["Overall Satisfaction"]),
      });
    }

    return reports;
  } catch (error) {
    console.error("[BNI Feedback] failed to load analysis reports", error);
    return [];
  }
}
