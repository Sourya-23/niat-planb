import { runReport } from "@/lib/agent";
import { db } from "@/lib/db";
import { sendFollowup } from "@/lib/mail";
import { FUNNEL, funnelShare, collegesFor, NIAT_FACTS, DATA_CAVEAT } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  let p;
  try {
    p = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const profile = {
    name: String(p.name || "").slice(0, 60).trim(),
    phone: String(p.phone || "").replace(/[^\d+]/g, "").slice(0, 15),
    email: String(p.email || "").slice(0, 120).trim(),
    role: p.role === "parent" ? "parent" : "student",
    state: String(p.state || "Telangana").slice(0, 40),
    percentile: p.percentile ? Math.max(0, Math.min(100, Number(p.percentile))) : null,
    interest: String(p.interest || "Not sure").slice(0, 40),
    lang: ["en", "te", "hi"].includes(p.lang) ? p.lang : "en",
    session_id: String(p.session_id || "").slice(0, 64),
    source: String(p.source || "direct").slice(0, 40),
  };
  if (!profile.name || profile.phone.replace(/\D/g, "").length < 10) {
    return Response.json({ error: "Name and a valid phone number are required." }, { status: 400 });
  }

  let out;
  try {
    out = await runReport(profile);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "The AI counsellor is busy. Please try again in a moment.", detail: e.message }, { status: 502 });
  }

  const followup_status = await sendFollowup({
    to: profile.email,
    name: profile.name,
    message: out.assessment.followup_message,
    report: out.text,
  });

  let lead_id = null;
  const client = db();
  if (client) {
    const { data, error } = await client
      .from("leads")
      .insert({
        name: profile.name,
        phone: profile.phone,
        email: profile.email || null,
        role: profile.role,
        state: profile.state,
        lang: profile.lang,
        mock_percentile: profile.percentile,
        interest: profile.interest,
        intent: out.assessment.intent,
        intent_reason: out.assessment.intent_reason,
        followup_message: out.assessment.followup_message,
        followup_status,
        report: out.text,
        session_id: profile.session_id,
        source: profile.source,
      })
      .select("id")
      .single();
    if (error) console.error("lead insert failed", error.message);
    lead_id = data?.id || null;
  }

  return Response.json({
    report: out.text,
    trace: out.trace,
    model: out.model,
    intent: out.assessment.intent,
    followup_status,
    lead_id,
    data: {
      funnel: { appeared: FUNNEL.jee_main_unique_appeared, seats: FUNNEL.josaa_total_seats, share: funnelShare(), breakdown: FUNNEL.josaa_breakdown },
      colleges: collegesFor(profile.state),
      caveat: DATA_CAVEAT,
      niat: NIAT_FACTS,
      sources: [...FUNNEL.sources, ...NIAT_FACTS.sources],
    },
  });
}
