// Entradas para la IA, saneado de su salida y validación de la configuración que propone. Puro.
import { COMPASES, compas as getCompas, TEMPOS } from "@/musica/compases";
import { figura, figurasDisponibles } from "@/musica/figuras";
import { seleccionValida, type TipoEjercicio } from "@/practica/ejercicios";
import type { Fallo } from "@/clase/repaso";

export const MAX_EXPLICACION = 220;
export const MAX_RESUMEN = 450;

const PROHIBIDAS = ["fusa", "semifusa", "tresillo", "dosillo", "cuatrillo", "garrapatea", "síncopa", "sincopa", "cinquillo"];

const desc = (id: string) => {
  const f = figura(id);
  return `${f.nombre.toLowerCase()} (${f.silaba === "(silencio)" ? "silencio" : f.silaba})`;
};

export function entradaFallo(compas: string, nivel: number, f: Fallo): string {
  return `Compás ${compas}, nivel ${nivel}. Pulso ${f.pulso + 1}: puso ${desc(f.puesta)}; iba ${desc(f.esperada)}.${f.equivalencia ? " Fue una equivalencia: suena igual." : ""}`;
}

export function entradaFallos(compas: string, nivel: number, fs: Fallo[]): string {
  return `Compás ${compas}, nivel ${nivel}. Fallos del alumno en la clase:\n` + fs.map((f) => `- puso ${desc(f.puesta)}; iba ${desc(f.esperada)}${f.equivalencia ? " (suena igual)" : ""}`).join("\n");
}

/** Quita exclamaciones, recorta al límite por palabra y descarta textos con figuras que no existen en la app. */
export function sanear(texto: string | null, max: number): string | null {
  if (!texto) return null;
  let t = texto.replace(/[¡!]/g, "").replace(/[ \t]+/g, " ").trim();
  const bajo = t.toLowerCase();
  if (PROHIBIDAS.some((p) => new RegExp(`\\b${p}`, "i").test(bajo))) return null;
  if (t.length > max) {
    const corte = t.slice(0, max);
    const fin = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf(".\n"));
    t = fin > max * 0.5 ? corte.slice(0, fin + 1) : corte.slice(0, corte.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
  }
  return t || null;
}

export interface CfgClase {
  nivel: 1 | 2;
  compas: string;
  figuras: string[];
  ejercicio: TipoEjercicio;
  ppm: 50 | 60 | 70;
  numPreguntas: number;
}

export const ESQUEMA_CLASE = {
  name: "config_clase",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["entendido", "compas", "nivel", "figuras", "ejercicio", "preguntas", "ppm"],
    properties: {
      entendido: { type: "boolean" },
      compas: { type: "string", enum: COMPASES.map((c) => c.id) },
      nivel: { type: "integer", enum: [1, 2] },
      figuras: { type: "array", items: { type: "string" } },
      ejercicio: { type: "string", enum: ["cual", "dictado", "error"] },
      preguntas: { type: "integer" },
      ppm: { type: "integer", enum: TEMPOS.map((t) => t.ppm) },
    },
  },
};

export function valoresValidos(min: number, max: number): string {
  const figs = COMPASES.map((c) =>
    [1, 2].map((n) => `${c.id} nivel ${n}: ${figurasDisponibles(c.tipo, n as 1 | 2).map((f) => `${f.id} (${f.nombre})`).join(", ")}`).join("\n"),
  ).join("\n");
  return `Compases: ${COMPASES.map((c) => `${c.id} (${c.tipo})`).join(", ")}.
Ejercicios: cual = ¿Cuál suena?, dictado = Dictado, error = Encuentra el error. Por defecto dictado.
Tempos: ${TEMPOS.map((t) => `${t.ppm} = ${t.nombre}`).join(", ")}. Por defecto 60.
Preguntas: entre ${min} y ${max}. Por defecto 5. Nivel por defecto 1. Si no se nombran figuras, usa todas las del compás y nivel.
Figuras por compás y nivel:
${figs}`;
}

/** Valida la propuesta de la IA contra los valores de la app. Null si algo no vale. */
export function validarCfg(raw: unknown, min: number, max: number): CfgClase | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { entendido?: unknown; compas?: unknown; nivel?: unknown; ejercicio?: unknown; ppm?: unknown; preguntas?: unknown; figuras?: unknown };
  if (r.entendido !== true) return null;
  if (typeof r.compas !== "string" || !COMPASES.some((c) => c.id === r.compas)) return null;
  if (r.nivel !== 1 && r.nivel !== 2) return null;
  if (r.ejercicio !== "cual" && r.ejercicio !== "dictado" && r.ejercicio !== "error") return null;
  if (r.ppm !== 50 && r.ppm !== 60 && r.ppm !== 70) return null;
  if (typeof r.preguntas !== "number" || !Number.isInteger(r.preguntas) || r.preguntas < min || r.preguntas > max) return null;
  if (!Array.isArray(r.figuras)) return null;
  const disp = figurasDisponibles(getCompas(r.compas).tipo, r.nivel).map((f) => f.id);
  const figuras = r.figuras as unknown[];
  if (!figuras.every((id) => typeof id === "string" && disp.includes(id))) return null;
  const ids = [...new Set(figuras as string[])];
  if (!seleccionValida(ids)) return null;
  return { nivel: r.nivel, compas: r.compas, figuras: ids, ejercicio: r.ejercicio, ppm: r.ppm, numPreguntas: r.preguntas };
}
