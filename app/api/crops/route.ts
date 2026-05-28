import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import {
  dbInsertCrop,
  dbInsertTask,
  dbListCropGuides,
  dbListCrops,
  type CropGuideStep,
} from "@/lib/supabase/server-queries";
import type { CropRow } from "@/lib/crop-types";
import { buildAutoTaskPlan } from "@/lib/agro-calendar";
import type { CropGuideRow } from "@/lib/supabase/server-queries";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase, user } = auth;
    const crops = await dbListCrops(supabase, user.id);
    return NextResponse.json(crops);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<CropRow, "id" | "createdAt">;
    if (!body?.name?.trim() || !body?.variety?.trim()) {
      return NextResponse.json({ error: "name and variety required" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase, user } = auth;
    const cropId = await dbInsertCrop(supabase, body, user.id);

    const guides = await dbListCropGuides(supabase, user.id);
    const matchedGuide = pickMatchingGuide(guides, body.name);
    const autoPlan = matchedGuide
      ? buildAutoTaskPlanFromSteps(body.plantingDate, matchedGuide.steps)
      : buildAutoTaskPlan(body.name, body.plantingDate);
    await Promise.all(
      autoPlan.map((step) =>
        dbInsertTask(
          supabase,
          {
            type: step.type,
            dueDate: step.dueDate,
            notes: step.notes,
            cropId,
          },
          user.id,
        ),
      ),
    );

    return NextResponse.json({ ok: true, autoTasks: autoPlan.length }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildAutoTaskPlanFromSteps(plantingDate: string, steps: CropGuideStep[]) {
  const planting = new Date(`${plantingDate}T12:00:00`);
  return steps.map((step) => {
    const due = new Date(planting);
    due.setDate(due.getDate() + step.offsetDays);
    return {
      type: step.taskType,
      dueDate: due.toISOString().slice(0, 10),
      notes: `${step.title}: ${step.description}`,
    };
  });
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function tokenOverlapScore(a: string, b: string) {
  const aSet = new Set(a.split(/\s+/).filter(Boolean));
  const bSet = new Set(b.split(/\s+/).filter(Boolean));
  let shared = 0;
  for (const token of aSet) {
    if (bSet.has(token)) shared += 1;
  }
  return shared;
}

function pickMatchingGuide(guides: CropGuideRow[], cropName: string): CropGuideRow | null {
  const target = normalizeText(cropName);
  if (!target) return null;

  const exact = guides.find((g) => normalizeText(g.cropName) === target);
  if (exact) return exact;

  const partial = guides.find((g) => {
    const n = normalizeText(g.cropName);
    return n.includes(target) || target.includes(n);
  });
  if (partial) return partial;

  let best: CropGuideRow | null = null;
  let bestScore = 0;
  for (const guide of guides) {
    const score = tokenOverlapScore(target, normalizeText(guide.cropName));
    if (score > bestScore) {
      best = guide;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}
