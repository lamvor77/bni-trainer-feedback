"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { FeedbackAnalysisResult } from "@/types/analysis";

const QR_FILENAME = "bni-feedback-qr.png";
const SESSION_KEY = "bni-admin-authenticated";

type AnalysisStatus = "idle" | "loading" | "success" | "error";

export default function AdminPage() {
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  const passwordConfigured = Boolean(adminPassword);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(!passwordConfigured);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [origin, setOrigin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const [analysisTrainingId, setAnalysisTrainingId] = useState("msp");
  const [analysisTrainingTitle, setAnalysisTrainingTitle] = useState("MSP 교육");
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysisResult, setAnalysisResult] = useState<FeedbackAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (passwordConfigured && sessionStorage.getItem(SESSION_KEY) === "true") {
      setAuthenticated(true);
    }
    setSessionChecked(true);
  }, [passwordConfigured]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const feedbackLink = origin ? `${origin}/` : "";

  useEffect(() => {
    if (!feedbackLink) return;

    let cancelled = false;

    QRCode.toDataURL(feedbackLink, { width: 320, margin: 2 })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [feedbackLink]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordInput === adminPassword) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleCopy = async () => {
    if (!feedbackLink) return;

    try {
      await navigator.clipboard.writeText(feedbackLink);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    } finally {
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = QR_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAnalyze = async () => {
    setAnalysisStatus("loading");
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId: analysisTrainingId, trainingTitle: analysisTrainingTitle }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setAnalysisResult(data.analysis);
        setAnalysisStatus("success");
      } else {
        setAnalysisError(
          typeof data?.message === "string" ? data.message : "분석 결과를 가져오지 못했습니다."
        );
        setAnalysisStatus("error");
      }
    } catch {
      setAnalysisError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setAnalysisStatus("error");
    }
  };

  if (!sessionChecked) {
    return null;
  }

  if (!authenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-5 py-10">
        <div className="flex w-full max-w-sm flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            BNI Trainer Feedback 관리자
          </h1>
          <p className="text-sm text-zinc-500">관리자 비밀번호를 입력해 주세요.</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="flex w-full max-w-sm flex-col gap-3">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setAuthError(false);
            }}
            placeholder="비밀번호"
            className={`w-full rounded-xl border px-4 py-3 text-sm text-zinc-900 outline-none focus:border-red-500 ${
              authError ? "border-red-400 bg-red-50" : "border-zinc-200 bg-white"
            }`}
          />
          {authError && <p className="text-sm text-red-600">비밀번호가 올바르지 않습니다.</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors active:bg-red-700"
          >
            관리자 페이지 열기
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-5 py-10">
      {!passwordConfigured && (
        <div className="w-full max-w-sm rounded-xl bg-yellow-50 px-4 py-3 text-xs leading-relaxed text-yellow-700">
          관리자 비밀번호가 설정되어 있지 않습니다.
          <br />
          .env.local에 NEXT_PUBLIC_ADMIN_PASSWORD를 설정하세요.
        </div>
      )}

      <div className="flex w-full max-w-sm flex-col items-center gap-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          BNI Trainer Feedback 관리자
        </h1>
        <p className="text-sm text-zinc-500">고정 피드백 링크</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <p className="break-all rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900">
          {feedbackLink || "링크를 불러오는 중..."}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!feedbackLink}
          className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors active:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {copyStatus === "copied" ? "복사됨" : copyStatus === "error" ? "복사 실패" : "링크 복사"}
        </button>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white p-6">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="피드백 페이지 QR 코드" width={240} height={240} />
        ) : (
          <div className="flex h-60 w-60 items-center justify-center text-sm text-zinc-400">
            QR 코드를 생성하는 중...
          </div>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!qrDataUrl}
          className="w-full rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-800 transition-colors active:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          QR 다운로드
        </button>
      </div>

      <p className="max-w-sm text-center text-xs leading-relaxed text-zinc-400">
        이 QR은 매 교육마다 변경할 필요가 없습니다.
        <br />
        참석자가 QR을 스캔한 뒤 교육명을 직접 선택합니다.
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="analysis-training-id" className="text-xs font-medium text-zinc-600">
            trainingId
          </label>
          <input
            id="analysis-training-id"
            type="text"
            value={analysisTrainingId}
            onChange={(e) => setAnalysisTrainingId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-red-500"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="analysis-training-title" className="text-xs font-medium text-zinc-600">
            trainingTitle
          </label>
          <input
            id="analysis-training-title"
            type="text"
            value={analysisTrainingTitle}
            onChange={(e) => setAnalysisTrainingTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-red-500"
          />
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analysisStatus === "loading"}
          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors active:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {analysisStatus === "loading" ? "분석 중..." : "AI 분석 테스트"}
        </button>

        {analysisStatus === "error" && analysisError && (
          <p className="text-sm text-red-600">{analysisError}</p>
        )}

        {analysisStatus === "success" && analysisResult && (
          <div className="flex flex-col gap-4 text-sm text-zinc-800">
            <div>
              <p className="font-semibold text-zinc-900">한 줄 종합 평가</p>
              <p className="mt-1 text-zinc-600">{analysisResult.oneLineReview}</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">교육 요약</p>
              <p className="mt-1 text-zinc-600">{analysisResult.summary}</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">평균 점수</p>
              <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-600">
                <li>전체 만족도: {analysisResult.averageScores.overallSatisfaction}</li>
                <li>전달력: {analysisResult.averageScores.delivery}</li>
                <li>준비도: {analysisResult.averageScores.preparation}</li>
                <li>이해도: {analysisResult.averageScores.understanding}</li>
                <li>실무 적용성: {analysisResult.averageScores.practicality}</li>
                <li>시간 관리: {analysisResult.averageScores.timeManagement}</li>
                <li>참여도: {analysisResult.averageScores.participation}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">강점</p>
              <ul className="mt-1 list-inside list-disc text-zinc-600">
                {analysisResult.strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">개선점</p>
              <ul className="mt-1 list-inside list-disc text-zinc-600">
                {analysisResult.improvements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">다음 교육에서 유지할 점</p>
              <ul className="mt-1 list-inside list-disc text-zinc-600">
                {analysisResult.keepForNextTraining.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">다음 교육에서 개선할 점</p>
              <ul className="mt-1 list-inside list-disc text-zinc-600">
                {analysisResult.improveForNextTraining.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">트레이너 조언</p>
              <p className="mt-1 text-zinc-600">{analysisResult.trainerAdvice}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
