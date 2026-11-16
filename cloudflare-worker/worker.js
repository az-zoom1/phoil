/**
 * Vuel (فويل) - Cloudflare Worker Load-Balanced Gemini SSE Proxy
 *
 * Environment Secrets in Cloudflare Dashboard (Settings -> Variables and Secrets -> Add -> Secret):
 *   Option A (Recommended - single secret for unlimited keys):
 *     Name:  GEMINI_KEYS
 *     Value: AIzaSyKey1,AIzaSyKey2,AIzaSyKey3
 *
 *   Option B (Separate secret per key - also supported automatically):
 *     Name:  GEMINI_API_KEY_1   Value: AIzaSyKey1
 *     Name:  GEMINI_API_KEY_2   Value: AIzaSyKey2
 *     Name:  GEMINI_API_KEY_3   Value: AIzaSyKey3
 *     (or single GEMINI_API_KEY)
 *
 * Optimized for slow/weak connections:
 *  - Rotates & falls back across multiple Gemini API keys automatically
 *  - Streams lightweight SSE events: data: {"t":"chunk text"}\n\n
 *  - Emits data: {"done":true}\n\n on completion
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function collectApiKeys(env) {
  const pool = new Set();

  // 1) Comma-separated secret: GEMINI_KEYS
  if (typeof env.GEMINI_KEYS === "string") {
    env.GEMINI_KEYS.split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .forEach((k) => pool.add(k));
  }

  // 2) Single or numbered secrets: GEMINI_API_KEY, GEMINI_API_KEY_1, GEMINI_API_KEY_2, ...
  for (const [envName, envVal] of Object.entries(env || {})) {
    if (envName.startsWith("GEMINI_API_KEY") && typeof envVal === "string" && envVal.trim()) {
      pool.add(envVal.trim());
    }
  }

  return Array.from(pool);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const keys = collectApiKeys(env);
    if (!keys.length) {
      return new Response(JSON.stringify({ error: "No Gemini API keys configured" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const startIdx = Math.floor(Math.random() * keys.length);
    const orderedKeys = [...keys.slice(startIdx), ...keys.slice(0, startIdx)];

    const systemPrompt = String(body.systemPrompt || "");
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const userMessage = String(body.message || "");
    const model = body.model || "gemini-2.5-flash";

    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.text || "") }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const payload = {
      system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 450,
      },
    };

    let upstream = null;
    let lastErrorStatus = 503;
    let lastErrorText = "All upstream Gemini keys failed";

    for (const apiKey of orderedKeys) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok && res.body) {
        upstream = res;
        break;
      }
      lastErrorStatus = res.status;
      lastErrorText = await res.text().catch(() => "Upstream error");
      // Try next key on rate-limit, quota, invalid/expired key, or server error
      if (![400, 401, 403, 429].includes(res.status) && res.status < 500) {
        break;
      }
    }

    if (!upstream) {
      return new Response(JSON.stringify({ error: lastErrorText }), {
        status: lastErrorStatus,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
      const reader = upstream.body.getReader();
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const parsed = JSON.parse(raw);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ t: text })}\n\n`));
              }
            } catch {}
          }
        }
        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  },
};
