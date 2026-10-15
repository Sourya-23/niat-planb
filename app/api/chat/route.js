import { runChat } from "@/lib/agent";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const history = Array.isArray(body.history) ? body.history.slice(-10).map((h) => ({ role: h.role, text: String(h.text || "").slice(0, 1000) })) : [];
  if (!history.length) return Response.json({ error: "Empty" }, { status: 400 });
  try {
    const out = await runChat({ history, lang: body.lang || "en", profile: body.profile });
    const client = db();
    if (client) {
      await client.from("events").insert({
        session_id: String(body.session_id || "").slice(0, 64),
        event: "chat_message",
        lang: body.lang || "en",
        source: String(body.source || "direct").slice(0, 40),
        meta: { question: history[history.length - 1].text.slice(0, 300), tools: out.trace.map((t) => t.tool) },
      });
    }
    return Response.json({ reply: out.text || "…", trace: out.trace });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Busy, try again.", detail: e.message }, { status: 502 });
  }
}
