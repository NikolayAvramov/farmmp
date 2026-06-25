import { NextResponse } from "next/server";
import { analyzePlantImage } from "@/lib/plant-diagnosis-service";
import type { DiagnoseRequestBody } from "@/lib/plant-diagnosis-types";
import { requireAuth } from "@/lib/supabase/route-auth";

const MAX_DATA_URL_CHARS = 6_000_000;

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as DiagnoseRequestBody;
    if (!body?.imageDataUrl?.startsWith("data:image/")) {
      return NextResponse.json({ error: "Изисква се валидна снимка (image/*)." }, { status: 400 });
    }
    if (body.imageDataUrl.length > MAX_DATA_URL_CHARS) {
      return NextResponse.json({ error: "Снимката е твърде голяма. Опитай по-малък файл." }, { status: 400 });
    }

    const result = await analyzePlantImage({
      imageDataUrl: body.imageDataUrl,
      notes: body.notes ?? null,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
