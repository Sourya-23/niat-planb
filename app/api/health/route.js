import { db } from "@/lib/db";
import { generate, listModels } from "@/lib/gemini";
import { mailReady } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Open /api/health after deploying: it tells you exactly what is and isn't wired up.
export async function GET() {
  const report = { gemini_key: Boolean(process.env.GEMINI_API_KEY), supabase_env: Boolean(db()), email: mailReady() };
  try {
    const { data, model } = await generate({ contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }] });
    report.gemini = { ok: true, model, reply: data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim() };
  } catch (e) {
    report.gemini = { ok: false, error: e.message, available: await listModels().catch(() => null) };
  }
  const client = db();
  if (client) {
    const { error } = await client.from("leads").select("id", { count: "exact", head: true });
    report.supabase = error ? { ok: false, error: error.message } : { ok: true };
  }
  return Response.json(report);
}
