import { generate } from "./gemini";
import { FUNNEL, funnelShare, collegesFor, NIAT_FACTS, DATA_CAVEAT } from "./data";

const LANG = { en: "English", te: "Telugu (తెలుగు script)", hi: "Hindi (Devanagari script)" };

const TOOLS = [
  {
    name: "get_jee_funnel",
    description: "Official 2026 numbers: how many students appeared for JEE Main vs total JoSAA seats (IIT/NIT/IIIT/GFTI), plus Telangana private-college seat share.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_private_college_outcomes",
    description: "NIRF 2025 placement data (students placed, graduating, median salary) for private engineering colleges a student from this state would realistically consider.",
    parameters: { type: "OBJECT", properties: { state: { type: "STRING" } }, required: ["state"] },
  },
  {
    name: "get_niat_facts",
    description: "Verified facts about NIAT: what it is, admission via NAT, fees, real advantages, and honest caveats (no graduated batch yet).",
    parameters: { type: "OBJECT", properties: {} },
  },
];

const SAVE_TOOL = {
  name: "save_lead_assessment",
  description: "Call exactly once at the end. Records how ready this family is to consider NIAT and drafts a personal follow-up message for a counsellor to send.",
  parameters: {
    type: "OBJECT",
    properties: {
      intent: { type: "STRING", enum: ["hot", "warm", "cold"], description: "hot: parent, or weak mocks and anxious, or asked about fees/admission. warm: curious. cold: strong JEE scorer just browsing." },
      intent_reason: { type: "STRING", description: "One short line in English explaining the score." },
      followup_message: { type: "STRING", description: "WhatsApp-style message (max 70 words) in the user's language, warm, mentions one specific thing from their profile, invites them to a free NAT counselling call. No invented numbers." },
    },
    required: ["intent", "intent_reason", "followup_message"],
  },
};

function runTool(name, args) {
  if (name === "get_jee_funnel") return { ...FUNNEL, share_of_jee_takers_who_can_get_a_josaa_seat_pct: funnelShare() };
  if (name === "get_private_college_outcomes") return { colleges: collegesFor(args?.state), caveat: DATA_CAVEAT };
  if (name === "get_niat_facts") return NIAT_FACTS;
  return { error: "unknown tool" };
}

function systemPrompt(lang) {
  return `You are "Plan B Navigator", a calm, honest career counsellor for Indian Class 12 students preparing for JEE, and their parents.
Respond ONLY in ${LANG[lang] || "English"}.

Rules:
- Never discourage JEE preparation. Message: keep preparing, AND have a strong Plan B, because the seats are mathematically limited.
- Use ONLY numbers returned by your tools. Never invent statistics, salaries, or placement percentages. If data is missing, say so.
- Always call get_jee_funnel, get_private_college_outcomes and get_niat_facts before writing.
- Be fair to other colleges: present their NIRF numbers neutrally, mention that they are self-reported.
- Be honest that NIAT has no graduated batch yet; its proof today is first-year internships and skills.
- Speak to the person's role (student or parent). Parents care about degree validity, fees, safety of investment.
- Use the Indian numbering style (lakh).`;
}

function reportPrompt(p) {
  return `Profile:
- Role: ${p.role}
- Name: ${p.name}
- State: ${p.state}
- Latest JEE mock percentile: ${p.percentile || "not shared"}
- Interest: ${p.interest}

Write a personal report under 230 words with exactly these 3 headings (translate the headings into the response language), each starting with "## ":
## The real odds
## Your realistic private-college options
## Why NIAT could be the stronger Plan B
Short paragraphs, no tables, no bullet longer than one line. End with one sentence inviting them to a free NAT counselling call.
After writing the report, call save_lead_assessment.`;
}

function partsText(parts) {
  return (parts || []).filter((p) => p.text && !p.thought).map((p) => p.text).join("").trim();
}

async function loop({ contents, lang, tools, maxSteps = 6 }) {
  const trace = [];
  let assessment = null;
  let finalText = "";
  let model = "";
  for (let step = 0; step < maxSteps; step++) {
    const { data, model: m } = await generate({
      systemInstruction: { parts: [{ text: systemPrompt(lang) }] },
      contents,
      tools: [{ functionDeclarations: tools }],
      generationConfig: { temperature: 0.4 },
    });
    model = m;
    const content = data?.candidates?.[0]?.content;
    if (!content) break;
    contents.push({ role: "model", parts: content.parts });
    const text = partsText(content.parts);
    if (text) finalText = finalText ? `${finalText}\n\n${text}` : text;
    const calls = content.parts.filter((p) => p.functionCall);
    if (!calls.length) break;
    const responses = calls.map(({ functionCall: fc }) => {
      let result;
      if (fc.name === "save_lead_assessment") {
        assessment = fc.args;
        result = { saved: true };
      } else {
        result = runTool(fc.name, fc.args);
      }
      trace.push({ tool: fc.name, args: fc.args || {} });
      return { functionResponse: { name: fc.name, response: { result } } };
    });
    contents.push({ role: "user", parts: responses });
    if (assessment && finalText) break;
  }
  return { text: finalText, trace, assessment, model };
}

export async function runReport(profile) {
  const contents = [{ role: "user", parts: [{ text: reportPrompt(profile) }] }];
  const out = await loop({ contents, lang: profile.lang, tools: [...TOOLS, SAVE_TOOL] });
  if (!out.assessment) out.assessment = fallbackAssessment(profile);
  return out;
}

export async function runChat({ history, lang, profile }) {
  const intro = profile
    ? `Context about the person asking: role ${profile.role}, state ${profile.state}, mock percentile ${profile.percentile || "not shared"}, interest ${profile.interest}. Answer their questions in under 120 words.`
    : "Answer in under 120 words.";
  const contents = [
    { role: "user", parts: [{ text: intro }] },
    { role: "model", parts: [{ text: "Understood." }] },
    ...history.map((h) => ({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] })),
  ];
  return loop({ contents, lang, tools: TOOLS, maxSteps: 4 });
}

export function fallbackAssessment(p) {
  const pct = Number(p.percentile) || 0;
  const hot = p.role === "parent" || (pct > 0 && pct < 90);
  const msgs = {
    en: `Hi ${p.name}, thanks for checking your Plan B with us. Keep preparing for JEE! If you'd like, our counsellor can walk you through NIAT and the NAT test in a free 15-minute call. When is a good time?`,
    te: `నమస్తే ${p.name}, మీ Plan B చూసినందుకు ధన్యవాదాలు. JEE ప్రిపరేషన్ కొనసాగించండి! NIAT మరియు NAT గురించి 15 నిమిషాల ఉచిత కౌన్సెలింగ్ కాల్‌లో వివరిస్తాం. మీకు ఎప్పుడు వీలవుతుంది?`,
    hi: `नमस्ते ${p.name}, अपना Plan B देखने के लिए धन्यवाद। JEE की तैयारी जारी रखें! हमारे काउंसलर 15 मिनट की फ्री कॉल में NIAT और NAT के बारे में बता सकते हैं। आपके लिए कौन सा समय ठीक रहेगा?`,
  };
  return {
    intent: hot ? "hot" : pct >= 97 ? "cold" : "warm",
    intent_reason: "Rule-based fallback score (agent did not return an assessment).",
    followup_message: msgs[p.lang] || msgs.en,
  };
}
