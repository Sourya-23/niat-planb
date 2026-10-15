import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Growth Dashboard" };

const STEPS = [
  ["page_view", "Visited"],
  ["form_start", "Started form"],
  ["form_submit", "Submitted"],
  ["report_view", "Got report"],
  ["chat_message", "Asked agent"],
  ["cta_click", "Clicked NAT CTA"],
];

const mask = (s, keep = 2) => (s ? s.slice(0, keep) + "•".repeat(Math.max(0, s.length - keep - 2)) + s.slice(-2) : "");

export default async function Dashboard({ searchParams }) {
  const sp = await searchParams;
  const unlocked = process.env.DASHBOARD_KEY && sp?.key === process.env.DASHBOARD_KEY;
  const client = db();
  if (!client) return <main className="wrap"><h1>Dashboard</h1><p>Supabase is not configured yet.</p></main>;

  const [{ data: events = [] }, { data: leads = [] }] = await Promise.all([
    client.from("events").select("session_id,event,lang,source,created_at").order("created_at", { ascending: false }).limit(5000),
    client.from("leads").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  const sessions = {};
  for (const s of STEPS) sessions[s[0]] = new Set();
  for (const e of events || []) sessions[e.event]?.add(e.session_id);
  const counts = STEPS.map(([k, label]) => [label, sessions[k].size]);
  const top = Math.max(counts[0][1], 1);

  const by = (key) => (leads || []).reduce((m, l) => ((m[l[key] || "unknown"] = (m[l[key] || "unknown"] || 0) + 1), m), {});
  const intent = by("intent");
  const lang = by("lang");
  const source = by("source");
  const role = by("role");
  const sent = (leads || []).filter((l) => l.followup_status === "sent").length;

  const visit = counts[0][1];
  const conv = visit ? ((counts[3][1] / visit) * 100).toFixed(1) : "0";
  let worst = null;
  for (let i = 1; i < counts.length; i++) {
    const prev = counts[i - 1][1];
    if (!prev) continue;
    const drop = 1 - counts[i][1] / prev;
    if (!worst || drop > worst.drop) worst = { from: counts[i - 1][0], to: counts[i][0], drop };
  }

  return (
    <main className="wrap" style={{ paddingBottom: 48 }}>
      <header className="top"><div className="brand">Plan B <span>Growth Dashboard</span></div><a href="/" className="note">← App</a></header>

      <div className="kpis">
        <div className="kpi"><b>{visit}</b><span>Unique visitors</span></div>
        <div className="kpi"><b>{(leads || []).length}</b><span>Leads captured</span></div>
        <div className="kpi"><b>{intent.hot || 0}</b><span>Hot leads (AI scored)</span></div>
        <div className="kpi"><b>{conv}%</b><span>Visit → report conversion</span></div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2 style={{ fontSize: 20 }}>Funnel (unique sessions)</h2>
          {counts.map(([label, n]) => (
            <div className="frow" key={label}>
              <span>{label}</span>
              <div className="ftrack"><i style={{ width: `${(n / top) * 100}%` }} /></div>
              <b style={{ textAlign: "right" }}>{n}</b>
            </div>
          ))}
          {worst && <p className="note">Biggest drop-off: <b>{worst.from} → {worst.to}</b> ({Math.round(worst.drop * 100)}% lost). Fix this step first.</p>}
        </div>
        <div className="card">
          <h2 style={{ fontSize: 20 }}>Lead mix</h2>
          <Split title="Intent" obj={intent} />
          <Split title="Language" obj={lang} />
          <Split title="Role" obj={role} />
          <Split title="Source (?src=)" obj={source} />
          <p className="note">Follow-ups auto-sent by email: {sent} · others drafted for WhatsApp</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20 }}>Latest leads {unlocked ? "" : "(contact details masked)"}</h2>
        <div className="scroll">
          <table>
            <thead><tr><th>When</th><th>Name</th><th>Role</th><th>Mock %ile</th><th>Lang</th><th>Intent</th><th>AI reason</th><th>Follow-up</th></tr></thead>
            <tbody>
              {(leads || []).map((l) => (
                <tr key={l.id}>
                  <td className="num">{new Date(l.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  <td>{unlocked ? l.name : mask(l.name, 3)}<div className="note" style={{ margin: 0 }}>{unlocked ? l.phone : mask(l.phone, 2)}</div></td>
                  <td>{l.role}</td>
                  <td className="num">{l.mock_percentile ?? "–"}</td>
                  <td>{l.lang}</td>
                  <td><span className={`tag ${l.intent}`}>{l.intent}</span></td>
                  <td style={{ fontSize: 13, maxWidth: 220 }}>{l.intent_reason}</td>
                  <td style={{ fontSize: 13, maxWidth: 280 }}>
                    <div>{l.followup_status}</div>
                    {unlocked ? (
                      <a className="note" href={`https://wa.me/${waNum(l.phone)}?text=${encodeURIComponent(l.followup_message || "")}`} target="_blank" rel="noreferrer">Send on WhatsApp →</a>
                    ) : (
                      <div className="note" style={{ margin: 0 }}>{(l.followup_message || "").slice(0, 90)}…</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function waNum(p) {
  const d = String(p || "").replace(/\D/g, "");
  return d.length === 10 ? "91" + d : d;
}

function Split({ title, obj }) {
  const total = Object.values(obj).reduce((a, b) => a + b, 0) || 1;
  return (
    <div style={{ margin: "10px 0" }}>
      <div className="note" style={{ margin: "0 0 4px" }}>{title}</div>
      {Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
        <div className="frow" key={k}><span>{k}</span><div className="ftrack"><i style={{ width: `${(v / total) * 100}%` }} /></div><b style={{ textAlign: "right" }}>{v}</b></div>
      ))}
      {!Object.keys(obj).length && <div className="note">No data yet</div>}
    </div>
  );
}
