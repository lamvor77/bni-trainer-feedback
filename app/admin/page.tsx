"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const QR_FILENAME = "bni-feedback-qr.png";

export default function AdminPage() {
  const [origin, setOrigin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

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

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-5 py-10">
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
    </div>
  );
}
