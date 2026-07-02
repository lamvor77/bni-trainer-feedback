import FeedbackForm from "@/components/FeedbackForm";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="flex flex-col gap-1 border-b border-zinc-200 bg-white px-5 py-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          BNI Trainer Feedback
        </h1>
        <p className="text-sm text-zinc-500">오늘 교육에 대한 익명 피드백을 남겨주세요.</p>
        <p className="text-xs text-zinc-400">약 1분 이내 완료됩니다.</p>
      </header>
      <FeedbackForm />
    </div>
  );
}
