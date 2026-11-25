import { Client } from "@notionhq/client";
import type { CreatePageParameters } from "@notionhq/client";
import type { FeedbackFormData, TrainingMeta, TrainingTemplate } from "@/types/feedback";
import type {
  AnalysisReportDetail,
  AnalysisReportSummary,
  FeedbackAnalysisResult,
  FeedbackForAnalysis,
} from "@/types/analysis";

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
    "이름": { title: [{ text: { content: buildFeedbackName(training, submittedAtIso) } }] },
    "교육 ID": richText(training.trainingId),
    "교육명": richText(training.trainingTitle),
    "트레이너": richText(training.trainerName),
    "제출일시": { date: { start: submittedAtIso } },
    "전체 만족도": { number: ratings.overall },
    "전달력": { number: ratings.delivery },
    "준비도": { number: ratings.preparation },
    "이해도": { number: ratings.clarity },
    "실무 적용성": { number: ratings.usefulness },
    "시간 관리": { number: ratings.duration },
    "참여도": { number: ratings.participation },
    "가장 좋았던 점": richText(texts.highlight),
    "개선할 점": richText(texts.improvement),
    "트레이너에게 한마디": richText(texts.message),
  };

  if (isValidDateString(training.trainingDate)) {
    properties["교육일"] = { date: { start: toDateStart(training.trainingDate) } };
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

    // Notion은 한 번에 최대 100건만 반환하므로 끝까지 이어서 조회한다.
    const results = [];
    let cursor: string | undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: { property: "교육 ID", rich_text: { equals: trainingId } },
        sorts: [{ property: "제출일시", direction: "descending" }],
        page_size: 100,
        start_cursor: cursor,
      });

      results.push(...response.results);
      cursor = response.has_more && response.next_cursor ? response.next_cursor : undefined;
    } while (cursor);

    const feedbackList: FeedbackForAnalysis[] = [];

    for (const result of results) {
      if (result.object !== "page") continue;
      const properties = (result as { properties?: unknown }).properties;
      if (typeof properties !== "object" || properties === null) continue;

      const props = properties as Record<string, unknown>;

      feedbackList.push({
        trainingId: readRichText(props["교육 ID"]) || trainingId,
        trainingTitle: readRichText(props["교육명"]),
        trainerName: readRichText(props["트레이너"]) || undefined,
        trainingDate: readDateStart(props["교육일"]),
        submittedAt: readDateStart(props["제출일시"]),
        overallSatisfaction: readNumber(props["전체 만족도"]),
        delivery: readNumber(props["전달력"]),
        preparation: readNumber(props["준비도"]),
        understanding: readNumber(props["이해도"]),
        practicality: readNumber(props["실무 적용성"]),
        timeManagement: readNumber(props["시간 관리"]),
        participation: readNumber(props["참여도"]),
        bestPoint: readRichText(props["가장 좋았던 점"]),
        improvementPoint: readRichText(props["개선할 점"]),
        messageToTrainer: readRichText(props["트레이너에게 한마디"]) || undefined,
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
    "이름": {
      title: [{ text: { content: buildAnalysisReportName(trainingTitle, trainingId, analyzedAtIso) } }],
    },
    "교육 ID": richText(trainingId),
    "교육명": richText(trainingTitle),
    "분석일시": { date: { start: analyzedAtIso } },
    "교육 요약": richText(analysis.summary),
    "한 줄 종합 평가": richText(analysis.oneLineReview),
    "전체 만족도": { number: analysis.averageScores.overallSatisfaction },
    "전달력": { number: analysis.averageScores.delivery },
    "준비도": { number: analysis.averageScores.preparation },
    "이해도": { number: analysis.averageScores.understanding },
    "실무 적용성": { number: analysis.averageScores.practicality },
    "시간 관리": { number: analysis.averageScores.timeManagement },
    "참여도": { number: analysis.averageScores.participation },
    "강점": richText(analysis.strengths.join("\n")),
    "개선점": richText(analysis.improvements.join("\n")),
    "트레이너 조언": richText(analysis.trainerAdvice),
    "다음 교육에서 유지할 점": richText(analysis.keepForNextTraining.join("\n")),
    "다음 교육에서 개선할 점": richText(analysis.improveForNextTraining.join("\n")),
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
      sorts: [{ property: "분석일시", direction: "descending" }],
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
        name: readTitleText(props["이름"]),
        trainingId: readRichText(props["교육 ID"]),
        trainingTitle: readRichText(props["교육명"]),
        analyzedAt: readDateStart(props["분석일시"]) || "",
        oneLineReview: readRichText(props["한 줄 종합 평가"]),
        overallSatisfaction: readNumber(props["전체 만족도"]),
      });
    }

    return reports;
  } catch (error) {
    console.error("[BNI Feedback] failed to load analysis reports", error);
    return [];
  }
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export async function getAnalysisReportById(reportId: string): Promise<AnalysisReportDetail | null> {
  const env = getAnalysisReportEnv();

  if (!env) {
    return null;
  }

  try {
    const notion = new Client({ auth: env.apiKey });
    const page = await notion.pages.retrieve({ page_id: reportId });

    if (page.object !== "page") {
      return null;
    }

    const properties = (page as { properties?: unknown }).properties;
    if (typeof properties !== "object" || properties === null) {
      return null;
    }

    const props = properties as Record<string, unknown>;

    return {
      id: page.id,
      name: readTitleText(props["이름"]),
      trainingId: readRichText(props["교육 ID"]),
      trainingTitle: readRichText(props["교육명"]),
      analyzedAt: readDateStart(props["분석일시"]) || "",
      oneLineReview: readRichText(props["한 줄 종합 평가"]),
      overallSatisfaction: readNumber(props["전체 만족도"]),
      summary: readRichText(props["교육 요약"]),
      delivery: readNumber(props["전달력"]),
      preparation: readNumber(props["준비도"]),
      understanding: readNumber(props["이해도"]),
      practicality: readNumber(props["실무 적용성"]),
      timeManagement: readNumber(props["시간 관리"]),
      participation: readNumber(props["참여도"]),
      strengths: splitLines(readRichText(props["강점"])),
      improvements: splitLines(readRichText(props["개선점"])),
      trainerAdvice: readRichText(props["트레이너 조언"]),
      keepForNextTraining: splitLines(readRichText(props["다음 교육에서 유지할 점"])),
      improveForNextTraining: splitLines(readRichText(props["다음 교육에서 개선할 점"])),
    };
  } catch (error) {
    console.error("[BNI Feedback] failed to load analysis report detail", error);
    return null;
  }
}
