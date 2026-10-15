"use client";
import { useEffect, useRef, useState } from "react";
import { T } from "@/lib/i18n";
import { FUNNEL, funnelShare, COLLEGES } from "@/lib/data";

const fmtIN = (n) => Number(n).toLocaleString("en-IN");

function sid() {
  try {
    let s = localStorage.getItem("pb_sid");
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("pb_sid", s);
    }
    return s;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2);
  }
}

export default function Home() {
  const [lang, setLang] = useState("en");
  const [variant, setVariant] = useState("odds");
  const t = T[lang];
  const ctx = useRef({ session_id: "", source: "direct" });
  const started = useRef(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "student", state: "Telangana", percentile: "", interest: "AI / Machine Learning", consent: true });
  const [stage, setStage] = useState("form");
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [res, setRes] = useState(null);
  const [chat, setChat] = useState([]);
  const [q, setQ] = useState("");
  const [asking, setAsking] = useState(false);

  function track(event, meta) {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, lang, meta, ...ctx.current }),
    }).catch(() => {});
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = p.get("v") === "planb" ? "planb" : "odds";
    setVariant(v);
    ctx.current = { session_id: sid(), source: `${(p.get("src") || "direct").slice(0, 30)}:${v}` };
    const l = p.get("lang");
    if (l && T[l]) setLang(l);
    track("page_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage !== "loading") return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 2200);
    return () => clearInterval(id);
  }, [stage]);

  const set = (k) => (e) => {
    if (!started.current) {
      started.current = true;
      track("form_start");
    }
    setForm({ ...form, [k]: e.target.value });
  };

  function switchLang(l) {
    setLang(l);
    track("lang_switch", { to: l });
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!form.name.trim() || form.phone.replace(/\D/g, "").length < 10 || !form.consent) {
      setErr(t.errReq);
      return;
    }
    track("form_submit");
    setStage("loading");
    setStep(0);
    try {
      const r = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lang, ...ctx.current }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setRes(j);
      setStage("report");
      track("report_view", { intent: j.intent });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e2) {
      setErr(e2.message);
      setStage("form");
    }
  }

  async function ask(e) {
    e.preventDefault();
    if (!q.trim() || asking) return;
    const history = [...chat, { role: "user", text: q.trim() }];
    setChat(history);
    setQ("");
    setAsking(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, lang, profile: form, ...ctx.current }),
      });
      const j = await r.json();
      setChat([...history, { role: "model", text: j.reply || j.error }]);
    } catch {
      setChat([...history, { role: "model", text: "…" }]);
    }
    setAsking(false);
  }

  const share = funnelShare();

  return (
    <main className="wrap" lang={lang}>
      <header className="top">
        <div className="brand">Plan B <span>Navigator</span></div>
        <div className="langs">
          {[["en", "EN"], ["te", "తెలుగు"], ["hi", "हिंदी"]].map(([k, l]) => (
            <button key={k} className={lang === k ? "on" : ""} onClick={() => switchLang(k)}>{l}</button>
          ))}
        </div>
      </header>

      {stage !== "report" && (
        <>
          <section className="hero">
            <div className="kicker">{t.kicker}</div>
            <h1>{variant === "planb" ? t.titleB : t.title}</h1>
            <p className="sub">{t.sub}</p>
          </section>

          {variant === "planb" && (
            <section className="card" style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 20 }}>{t.tableTitle}</h2>
              <Colleges rows={COLLEGES.filter((c) => c.state === "Telangana").slice(0, 5)} t={t} />
              <p className="note">NIRF 2025</p>
            </section>
          )}
          <section className="funnel">
            <div className="row">
              <div><div className="big">{fmtIN(FUNNEL.jee_main_unique_appeared)}</div><div className="lbl">{t.appeared}</div></div>
              <div><div className="big green">{fmtIN(FUNNEL.josaa_total_seats)}</div><div className="lbl">{t.seats}</div></div>
            </div>
            <div className="bar" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
            <p className="odds">{t.odds.replace("{x}", share)}</p>
          </section>

          <div className="grid2">
            <form className="card" onSubmit={submit}>
              <h2>{t.formTitle}</h2>
              {stage === "loading" ? (
                <>
                  <p>{t.working}</p>
                  <ul className="steps">
                    {t.steps.map((s, i) => (
                      <li key={i} className={i < step ? "done" : i === step ? "now" : ""}><span className="dot" />{s}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <label>{t.iam}</label>
                  <div className="seg">
                    {["student", "parent"].map((r) => (
                      <button type="button" key={r} className={form.role === r ? "on" : ""} onClick={() => setForm({ ...form, role: r })}>{t[r]}</button>
                    ))}
                  </div>
                  <label htmlFor="n">{t.name}</label>
                  <input id="n" value={form.name} onChange={set("name")} autoComplete="name" />
                  <label htmlFor="p">{t.phone}</label>
                  <input id="p" value={form.phone} onChange={set("phone")} inputMode="tel" placeholder="98XXXXXXXX" />
                  <label htmlFor="e">{t.email}</label>
                  <input id="e" type="email" value={form.email} onChange={set("email")} />
                  <label htmlFor="s">{t.state}</label>
                  <select id="s" value={form.state} onChange={set("state")}>
                    <option>Telangana</option><option>Andhra Pradesh</option><option>Other</option>
                  </select>
                  <label htmlFor="pc">{t.pct}</label>
                  <input id="pc" type="number" min="0" max="100" step="0.01" value={form.percentile} onChange={set("percentile")} placeholder="e.g. 82.5" />
                  <label htmlFor="i">{t.interest}</label>
                  <select id="i" value={form.interest} onChange={set("interest")}>
                    {T.en.interests.map((v, k) => <option key={v} value={v}>{t.interests[k]}</option>)}
                  </select>
                  <label className="check"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />{t.consent}</label>
                  <button className="btn" type="submit">{t.go}</button>
                  {err && <div className="err">{err}</div>}
                </>
              )}
            </form>
            <div className="card why hide-sm">
              <h2>{t.tableTitle}</h2>
              <p className="note" style={{ marginTop: 0 }}>NIRF 2025 · JoSAA 2026 · TGEAPCET 2026</p>
              <ul>{t.steps.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        </>
      )}

      {stage === "report" && res && (
        <section style={{ margin: "16px 0 48px" }}>
          <div className="grid2">
            <div className="card report">
              <span className="pill">{form.name}</span>
              <div style={{ marginTop: 14 }}><Report text={res.report} /></div>
              <a className="btn alt" href={`https://www.niatindia.com/?utm_source=planb&utm_medium=${ctx.current.source}`} target="_blank" rel="noreferrer" onClick={() => track("cta_click")}>{t.cta}</a>
              <details>
                <summary>{t.trace}</summary>
                <ol className="trace">
                  {res.trace.map((x, i) => <li key={i}><code>{x.tool}</code> {Object.keys(x.args).length ? JSON.stringify(x.args).slice(0, 80) : ""}</li>)}
                </ol>
                <p className="note">Model: {res.model} · Follow-up: {res.followup_status}</p>
              </details>
            </div>

            <div>
              <div className="card">
                <h2 style={{ fontSize: 20 }}>{t.tableTitle}</h2>
                <Colleges rows={res.data.colleges} t={t} />
                <p className="note">{res.data.caveat}</p>
              </div>
              <div className="card" style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 20 }}>{t.niatTitle}</h2>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{res.data.niat.edge.map((x) => <li key={x} style={{ margin: "6px 0" }}>{x}</li>)}</ul>
                <p className="note">{res.data.niat.honest_caveat}</p>
              </div>
            </div>
          </div>

          <div className="card chat" style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 20 }}>{t.askTitle}</h2>
            <div className="msgs">
              {chat.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
              {asking && <div className="msg model">…</div>}
            </div>
            <form className="ask" onSubmit={ask}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.askPh} />
              <button className="btn" disabled={asking}>{t.send}</button>
            </form>
          </div>

          <div className="card src" style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18 }}>{t.sources}</h2>
            <ul>
              {res.data.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></li>)}
              <li>College placement rows: NIRF 2025 filings via Careers360 / Shiksha (linked per college in data).</li>
            </ul>
            <button className="btn" style={{ background: "var(--ink)", maxWidth: 220 }} onClick={() => { setStage("form"); setRes(null); setChat([]); }}>{t.again}</button>
          </div>
        </section>
      )}

      <footer>Built for the NxtWave Growth Hack Challenge · Data: NTA, JoSAA, TGCHE, NIRF 2025 · Not an official NIAT page.</footer>
    </main>
  );
}

function Report({ text }) {
  const blocks = (text || "").split("\n").filter((l) => l.trim());
  return blocks.map((l, i) =>
    l.startsWith("## ") || l.startsWith("### ") ? <h3 key={i}>{l.replace(/^#+\s*/, "")}</h3> : <p key={i}>{l.replace(/\*\*/g, "").replace(/^[-*]\s+/, "• ")}</p>
  );
}

function Colleges({ rows, t }) {
  const max = Math.max(...rows.map((r) => r.median_lpa || 0), 1);
  return (
    <div className="scroll">
      <table>
        <thead><tr><th>{t.colCollege}</th><th>{t.colPlaced}</th><th>{t.colMedian}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className={r.type === "govt" ? "govt" : ""}>
              <td>{r.name}<div className="note" style={{ margin: 0 }}>{r.city}</div></td>
              <td className="num">{r.placed ? fmtIN(r.placed) : t.notDisclosed}{r.placed_pct ? ` (${r.placed_pct}%)` : ""}</td>
              <td className="num">₹{r.median_lpa} L<div className="mbar"><i style={{ width: `${(r.median_lpa / max) * 100}%` }} /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
