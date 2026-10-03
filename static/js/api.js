// Calls to Refrain's own server. Every failure becomes one of two calm messages.

const TIMEOUT_MS = 55_000;

export const MESSAGES = {
  unavailable: "The coach couldn't respond. Your work is saved.",
  rateLimited: "The coach needs a short break. Try again in a few minutes.",
};

// Said while the coach works, so a long wait is expected. Times measured with real Gemini in 5-build.
export const WAITS = {
  roadmap: "The coach is building your plan. This usually takes about 10 seconds.",
  check: "The coach is checking your answers. This usually takes a few seconds.",
  debrief: "The coach is reading your session. This usually takes 5 to 20 seconds.",
};

// Resolves to { ok: true, data } or { ok: false, code, message, fields, reached }.
// `reached` is false when the server never answered (offline, timeout).
export async function post(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data) return { ok: true, data };
    const code = data?.error ?? "coach_unavailable";
    return {
      ok: false,
      code,
      message: code === "rate_limited" ? MESSAGES.rateLimited : MESSAGES.unavailable,
      fields: data?.fields ?? null,
      reached: true,
    };
  } catch {
    return { ok: false, code: "network", message: MESSAGES.unavailable, fields: null, reached: false };
  } finally {
    clearTimeout(timer);
  }
}
