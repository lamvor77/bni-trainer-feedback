import { NextResponse } from "next/server";
import { getTrainingTemplates } from "@/lib/notion";

export async function GET() {
  const templates = await getTrainingTemplates();
  return NextResponse.json({ ok: true, templates });
}
