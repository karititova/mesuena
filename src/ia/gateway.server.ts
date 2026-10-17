// Llamada a Lovable AI (Responses, en streaming) con corte a los 8 s. Devuelve null ante cualquier fallo.
const URL_IA = "https://ai.gateway.lovable.dev/v1/responses";
export const MODELO = "openai/gpt-6-astra";
export const LIMITE_MS = 8000;

export async function pedirIA(opts: { instrucciones: string; entrada: string; esquema?: { name: string; schema: object } }): Promise<string | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LIMITE_MS);
  try {
    const res = await fetch(URL_IA, {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: MODELO,
        instructions: opts.instrucciones,
        input: opts.entrada,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        ...(opts.esquema ? { text: { format: { type: "json_schema", name: opts.esquema.name, schema: opts.esquema.schema, strict: true } } } : {}),
      }),
    });
    if (!res.ok || !res.body) {
      console.error("IA", res.status, await res.text().catch(() => ""));
      return null;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let texto = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const linea = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!linea.startsWith("data:")) continue;
        const d = linea.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") texto += ev.delta;
          if (ev.type === "response.refusal.delta" || ev.type === "error" || ev.type === "response.failed") return null;
        } catch {
          /* trama incompleta */
        }
      }
    }
    return texto.trim() || null;
  } catch (e) {
    if (!ctrl.signal.aborted) console.error("IA", e);
    return null;
  } finally {
    clearTimeout(t);
  }
}
