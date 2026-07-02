import { NextResponse } from "next/server";
import { getAnalysisReports } from "@/lib/notion";

export async function GET() {
  const reports = await getAnalysisReports();
  return NextResponse.json({ ok: true, reports });
}
