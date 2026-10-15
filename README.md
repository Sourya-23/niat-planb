# Plan B Navigator

AI growth system for NIAT: reaches Class 12 students *while they are still preparing for JEE* with an honest, data-backed Plan B.

**Flow:** landing (EN / Telugu / Hindi) → Gemini agent with tool calls (JoSAA 2026 funnel, NIRF 2025 private-college placement data, verified NIAT facts) → personal report + AI lead scoring + drafted follow-up → Supabase → auto email (Gmail) or one-tap WhatsApp → live growth dashboard with funnel drop-off.

- `/` app · `/dashboard` growth dashboard (`?key=` unlocks contacts) · `/api/health` wiring check
- Track channels with `?src=telegram`, `?src=youtube` etc.

Env vars: see `.env.example`.
