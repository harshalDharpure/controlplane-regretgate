import { NextResponse } from "next/server";
import { evaluateAction } from "@/lib/regretgate";
import type { PendingAction } from "@/lib/regretgate/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PendingAction & { persist?: boolean };
    if (!body?.text || !body?.useCase) {
      return NextResponse.json(
        { error: "text and useCase are required" },
        { status: 400 },
      );
    }
    const decision = evaluateAction(body, { persist: body.persist !== false });
    return NextResponse.json({ decision });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "evaluate failed" },
      { status: 500 },
    );
  }
}
