import { NextResponse } from "next/server";
import { getStore } from "@/lib/regretgate";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as
    | "pending"
    | "approved"
    | "edited"
    | "rejected"
    | "escalated"
    | null;
  return NextResponse.json({
    items: getStore().listHitl(status ?? undefined),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    id: string;
    status: "approved" | "edited" | "rejected" | "escalated";
    note?: string;
    editedText?: string;
  };
  if (!body?.id || !body?.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  const result = getStore().resolveHitl(
    body.id,
    body.status,
    body.note,
    body.editedText,
  );
  if (!result) {
    return NextResponse.json({ error: "HITL item not found or already resolved" }, { status: 404 });
  }
  return NextResponse.json(result);
}
