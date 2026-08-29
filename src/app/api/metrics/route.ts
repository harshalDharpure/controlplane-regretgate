import { NextResponse } from "next/server";
import { getFeedbackOffsets, getStore } from "@/lib/regretgate";

export async function GET() {
  return NextResponse.json({
    metrics: getStore().metrics(),
    feedback: getFeedbackOffsets(),
  });
}
