import { NextResponse } from "next/server";
import { getStore } from "@/lib/regretgate";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "50");
  return NextResponse.json({ events: getStore().listAudit(limit) });
}
