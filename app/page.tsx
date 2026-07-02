import FeedbackForm from "@/components/FeedbackForm";
import type { TrainingMeta } from "@/types/feedback";

function toSingleValue(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first && first.trim().length > 0 ? first : undefined;
}

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  const trainingMeta: TrainingMeta = {
    trainingId: toSingleValue(params.training),
    trainingTitle: toSingleValue(params.title),
    trainerName: toSingleValue(params.trainer),
    trainingDate: toSingleValue(params.date),
  };

  const hasTrainingInfo = Boolean(
    trainingMeta.trainingTitle || trainingMeta.trainerName || trainingMeta.trainingDate
  );

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="flex flex-col gap-1 border-b border-zinc-200 bg-white px-5 py-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          BNI Trainer Feedback
        </h1>
        <p className="text-sm text-zinc-500">오늘 교육에 대한 익명 피드백을 남겨주세요.</p>
        <p className="text-xs text-zinc-400">약 1분 이내 완료됩니다.</p>
        {hasTrainingInfo && (
          <div className="mt-2 flex flex-col gap-0.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-zinc-600">
            {trainingMeta.trainingTitle && <p>교육명: {trainingMeta.trainingTitle}</p>}
            {trainingMeta.trainerName && <p>트레이너: {trainingMeta.trainerName}</p>}
            {trainingMeta.trainingDate && <p>교육일: {trainingMeta.trainingDate}</p>}
          </div>
        )}
      </header>
      <FeedbackForm trainingMeta={trainingMeta} />
    </div>
  );
}
