"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const QR_FILENAME = "bni-feedback-qr.png";
const SESSION_KEY = "bni-admin-authenticated";

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
    </div>
  );
}
