import { NextResponse } from "next/server";
import { getAnalysisReportById } from "@/lib/notion";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getAnalysisReportById(id);

  if (!report) {
    return NextResponse.json({ ok: false, message: "리포트를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, report });
}
