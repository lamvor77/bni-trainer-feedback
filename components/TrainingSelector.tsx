"use client";

import type { TrainingTemplate } from "@/types/feedback";

interface TrainingSelectorProps {
  templates: TrainingTemplate[];
  templatesLoaded: boolean;
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  trainingDate: string;
  onChangeDate: (date: string) => void;
  fallbackTrainerName?: string;
  error?: boolean;
}

export default function TrainingSelector({
  templates,
  templatesLoaded,
  selectedTemplateId,
  onSelectTemplate,
  trainingDate,
  onChangeDate,
  fallbackTrainerName,
  error,
}: TrainingSelectorProps) {
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const displayTrainer = selectedTemplate?.defaultTrainer || fallbackTrainerName;
  const templatesUnavailable = templatesLoaded && templates.length === 0;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      {templatesUnavailable ? (
        <p className="text-sm text-zinc-500">
          교육 목록을 불러오지 못했습니다.
          <br />
          관리자에게 문의해주세요.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor="training-template" className="text-sm font-medium text-zinc-800">
            교육명
          </label>
          <select
            id="training-template"
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-sm text-zinc-900 outline-none focus:border-red-500 ${
              error ? "border-red-400 bg-red-50" : "border-zinc-200 bg-white"
            }`}
          >
            <option value="" disabled>
              교육을 선택해주세요
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-red-600">교육을 선택해주세요.</p>}
        </div>
      )}

      {displayTrainer && <p className="text-sm text-zinc-600">트레이너: {displayTrainer}</p>}

      <div className="flex flex-col gap-2">
        <label htmlFor="training-date" className="text-sm font-medium text-zinc-800">
          교육일
        </label>
        <input
          id="training-date"
          type="date"
          value={trainingDate}
          onChange={(e) => onChangeDate(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-red-500"
        />
      </div>
    </section>
  );
}
