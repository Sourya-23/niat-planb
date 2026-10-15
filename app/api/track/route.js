import { db } from "@/lib/db";

export const runtime = "nodejs";
const ALLOWED = new Set(["page_view", "form_start", "form_submit", "report_view", "cta_click", "lang_switch"]);

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  if (!ALLOWED.has(b.event)) return Response.json({ ok: false }, { status: 400 });
  const client = db();
  if (client) {
    await client.from("events").insert({
      session_id: String(b.session_id || "").slice(0, 64),
      event: b.event,
      lang: String(b.lang || "en").slice(0, 4),
      source: String(b.source || "direct").slice(0, 40),
      meta: b.meta && typeof b.meta === "object" ? b.meta : null,
    });
  }
  return Response.json({ ok: true });
}
