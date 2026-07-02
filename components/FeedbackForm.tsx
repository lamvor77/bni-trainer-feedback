"use client";

import { useEffect, useState } from "react";
import StarRating from "./StarRating";
import TrainingSelector from "./TrainingSelector";
import type {
  FeedbackFormData,
  RatingQuestionId,
  RatingValues,
  TextQuestionId,
  TextValues,
  TrainingMeta,
  TrainingTemplate,
} from "@/types/feedback";

const RATING_QUESTIONS: { id: RatingQuestionId; number: number; label: string }[] = [
  { id: "overall", number: 1, label: "이번 교육의 전체 만족도는 어떠셨나요?" },
  { id: "delivery", number: 2, label: "트레이너의 전달력은 어떠셨나요?" },
  { id: "preparation", number: 3, label: "교육 준비는 충분했다고 느끼셨나요?" },
  { id: "clarity", number: 4, label: "교육 내용은 이해하기 쉬웠나요?" },
  { id: "usefulness", number: 5, label: "교육 내용은 실제 BNI 활동에 도움이 될 것 같습니까?" },
  { id: "duration", number: 6, label: "교육 시간은 적절했다고 생각하십니까?" },
  { id: "participation", number: 7, label: "교육 참여와 소통은 충분했다고 생각하십니까?" },
];

const TEXT_QUESTIONS: {
  id: TextQuestionId;
  number: number;
  label: string;
  required: boolean;
  placeholder: string;
}[] = [
  {
    id: "highlight",
    number: 8,
    label: "오늘 교육에서 가장 좋았던 점은 무엇이었나요?",
    required: true,
    placeholder: "자유롭게 작성해주세요",
  },
  {
    id: "improvement",
    number: 9,
    label: "더 좋은 교육을 위해 개선하면 좋을 점은 무엇인가요?",
    required: true,
    placeholder: "자유롭게 작성해주세요",
  },
  {
    id: "message",
    number: 10,
    label: "트레이너에게 응원의 한마디 또는 전하고 싶은 메시지가 있다면 남겨주세요.",
    required: false,
    placeholder: "선택 사항입니다",
  },
];

const INITIAL_RATINGS: RatingValues = {
  overall: null,
  delivery: null,
  preparation: null,
  clarity: null,
  usefulness: null,
  duration: null,
  participation: null,
};

const INITIAL_TEXTS: TextValues = {
  highlight: "",
  improvement: "",
  message: "",
};

type Errors = Partial<Record<RatingQuestionId | TextQuestionId, boolean>>;
type SubmitStatus = "idle" | "submitting" | "success" | "error";

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateInputFormat(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

interface FeedbackFormProps {
  urlTrainingMeta: TrainingMeta;
}

export default function FeedbackForm({ urlTrainingMeta }: FeedbackFormProps) {
  const [ratings, setRatings] = useState<RatingValues>(INITIAL_RATINGS);
  const [texts, setTexts] = useState<TextValues>(INITIAL_TEXTS);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [trainingError, setTrainingError] = useState(false);
  const [trainingDate, setTrainingDate] = useState(() =>
    isDateInputFormat(urlTrainingMeta.trainingDate) ? urlTrainingMeta.trainingDate : todayDateString()
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/training-templates")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: TrainingTemplate[] = Array.isArray(data?.templates) ? data.templates : [];
        setTemplates(list);
        setSelectedTemplateId((current) => {
          if (current) return current;
          const matched = list.find((template) => template.id === urlTrainingMeta.trainingId);
          return matched ? matched.id : current;
        });
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [urlTrainingMeta.trainingId]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const templatesUnavailable = templatesLoaded && templates.length === 0;

  const resolvedTraining: TrainingMeta = {
    trainingId: selectedTemplate?.id,
    trainingTitle: selectedTemplate?.title,
    trainerName: selectedTemplate?.defaultTrainer || urlTrainingMeta.trainerName,
    trainingDate: trainingDate || undefined,
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    setTrainingError(false);
  };

  const handleRatingChange = (id: RatingQuestionId, value: number) => {
    setRatings((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: false }));
  };

  const handleTextChange = (id: TextQuestionId, value: string) => {
    setTexts((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "submitting") {
      return;
    }

    if (templatesUnavailable) {
      return;
    }

    if (!selectedTemplate) {
      setTrainingError(true);
      return;
    }

    setTrainingError(false);

    const nextErrors: Errors = {};

    for (const question of RATING_QUESTIONS) {
      if (ratings[question.id] === null) {
        nextErrors[question.id] = true;
      }
    }

    for (const question of TEXT_QUESTIONS) {
      if (question.required && texts[question.id].trim().length === 0) {
        nextErrors[question.id] = true;
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: FeedbackFormData = {
      ratings,
      texts,
      training: resolvedTraining,
      submittedAt: new Date().toISOString(),
    };

    setStatus("submitting");
    setSubmitError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus("success");
      } else {
        setSubmitError(
          typeof data?.message === "string" ? data.message : "제출 중 오류가 발생했습니다. 다시 시도해주세요."
        );
        setStatus("error");
      }
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="mt-6 text-lg font-medium leading-relaxed text-zinc-900">
          소중한 피드백 감사합니다.
          <br />
          트레이너의 다음 교육 개선에 잘 반영하겠습니다.
        </p>
      </div>
    );
  }

  const hasRatingErrors = RATING_QUESTIONS.some((question) => errors[question.id]);
  const hasTextErrors = TEXT_QUESTIONS.some((question) => question.required && errors[question.id]);
  const submitDisabled = status === "submitting" || templatesUnavailable || !selectedTemplate;

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col pb-28">
      <div className="flex flex-1 flex-col gap-8 px-5 py-6">
        {status === "error" && submitError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
        )}

        <TrainingSelector
          templates={templates}
          templatesLoaded={templatesLoaded}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={handleSelectTemplate}
          trainingDate={trainingDate}
          onChangeDate={setTrainingDate}
          fallbackTrainerName={urlTrainingMeta.trainerName}
          error={trainingError}
        />

        <section className="flex flex-col gap-7">
          {RATING_QUESTIONS.map((question) => (
            <div key={question.id} className="flex flex-col gap-3">
              <label className="text-sm font-medium leading-relaxed text-zinc-800">
                {question.number}. {question.label}
              </label>
              <StarRating
                label={question.label}
                value={ratings[question.id]}
                onChange={(value) => handleRatingChange(question.id, value)}
                error={errors[question.id]}
              />
            </div>
          ))}
          {hasRatingErrors && (
            <p className="text-xs text-red-600">모든 항목을 평가해주세요.</p>
          )}
        </section>

        <section className="flex flex-col gap-6">
          {TEXT_QUESTIONS.map((question) => (
            <div key={question.id} className="flex flex-col gap-2">
              <label htmlFor={question.id} className="text-sm font-medium leading-relaxed text-zinc-800">
                {question.number}. {question.label}
                {!question.required && (
                  <span className="ml-1 font-normal text-zinc-400">(선택)</span>
                )}
              </label>
              <textarea
                id={question.id}
                value={texts[question.id]}
                onChange={(e) => handleTextChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                rows={3}
                className={`w-full resize-none rounded-xl border px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-red-500 ${
                  errors[question.id] ? "border-red-400 bg-red-50" : "border-zinc-200 bg-white"
                }`}
              />
            </div>
          ))}
          {hasTextErrors && (
            <p className="text-xs text-red-600">필수 의견을 입력해주세요.</p>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={submitDisabled}
          className="w-full rounded-xl bg-red-600 py-3.5 text-base font-semibold text-white transition-colors active:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {status === "submitting" ? "제출 중..." : "제출하기"}
        </button>
      </div>
    </form>
  );
}
