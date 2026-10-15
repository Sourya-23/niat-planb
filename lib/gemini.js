// Thin REST client for Gemini with automatic model fallback.
// If one model name 404s for this key, the next one is tried.

const BASE = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/models";
let workingModel = null;

function candidates() {
  const list = [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
  return [...new Set(list.filter(Boolean))];
}

export async function generate(body) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const order = workingModel ? [workingModel, ...candidates().filter((m) => m !== workingModel)] : candidates();
  let lastErr;
  for (const model of order) {
    const res = await fetch(`${BASE}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      workingModel = model;
      return { data: await res.json(), model };
    }
    const text = await res.text();
    lastErr = new Error(`Gemini ${model} ${res.status}: ${text.slice(0, 300)}`);
    if (![404, 400, 429, 503].includes(res.status) || (res.status === 400 && !text.includes("model"))) throw lastErr;
  }
  throw lastErr;
}

export async function listModels() {
  const res = await fetch(`${BASE}?pageSize=100`, { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY || "" } });
  if (!res.ok) return { ok: false, status: res.status, body: (await res.text()).slice(0, 300) };
  const j = await res.json();
  return {
    ok: true,
    models: (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => m.name.replace("models/", "")),
  };
}
