import { NextResponse } from "next/server";
import {
  listPolicyPacks,
  listUseCasePolicies,
  updateThresholds,
} from "@/lib/regretgate";
import type { UseCaseId } from "@/lib/regretgate/types";

export async function GET() {
  return NextResponse.json({
    useCases: listUseCasePolicies(),
    policyPacks: listPolicyPacks(),
  });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    useCase: UseCaseId;
    thresholds: Partial<{
      nearZeroMax: number;
      lowMax: number;
      mediumMax: number;
      highMax: number;
    }>;
  };
  if (!body?.useCase || !body?.thresholds) {
    return NextResponse.json(
      { error: "useCase and thresholds required" },
      { status: 400 },
    );
  }
  const updated = updateThresholds(body.useCase, body.thresholds);
  return NextResponse.json({ policy: updated });
}
