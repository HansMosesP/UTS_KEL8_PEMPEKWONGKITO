import { NextResponse } from "next/server";
import { markNotificationsRead } from "../../../lib/database";
import { jsonError, requireUser } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tandai notifikasi sudah dibaca: body { ids: number[] } atau { ids: "all" }. */
export async function PATCH(request: Request) {
  const { response } = await requireUser("admin");
  if (response) return response;
  const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
  const ids = body.ids;
  if (ids !== "all" && !(Array.isArray(ids) && ids.every((id) => typeof id === "number")))
    return jsonError("Data tidak valid.", 400);
  await markNotificationsRead(ids as number[] | "all");
  return NextResponse.json({ ok: true });
}
