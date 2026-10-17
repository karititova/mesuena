// Lógica pura de la clase en directo: preguntas, entradas del alumno y corrección. Sin DOM ni base de datos.
import { expandirPulsos } from "@/musica/comprobador";
import { corregirCual, corregirDictado, corregirError, type Correccion, type Ejercicio, type TipoEjercicio } from "@/practica/ejercicios";

export type EstadoSala = "espera" | "pregunta" | "revelada" | "terminada";

/** Lo que el alumno hizo: montar un ritmo, elegir una opción o tocar un pulso. */
export type Entrada = { tipo: "dictado"; ids: string[] } | { tipo: "cual"; elegida: number } | { tipo: "error"; tocado: number };

export interface FilaPregunta {
  orden: number;
  ritmo: string[];
  opciones: unknown;
  correcta: number | null;
  suena: string[] | null;
  error_pulso: number | null;
}

export const PREGUNTAS_MIN = 3;
export const PREGUNTAS_MAX = 10;
export const PREGUNTAS_DEFECTO = 5;

export function ejercicioDe(tipo: TipoEjercicio, p: FilaPregunta): Ejercicio {
  const ej: Ejercicio = { tipo, ritmo: p.ritmo };
  if (p.opciones) ej.opciones = p.opciones as string[][];
  if (p.correcta !== null) ej.correcta = p.correcta;
  if (p.suena) ej.suena = p.suena;
  if (p.error_pulso !== null) ej.errorPulso = p.error_pulso;
  return ej;
}

/** Lo que recibe el móvil mientras la pregunta está abierta: sin la respuesta correcta. */
export function ejercicioPublico(ej: Ejercicio): Ejercicio {
  const { correcta: _c, errorPulso: _e, ...resto } = ej;
  return resto;
}

export function entradaValida(ej: Ejercicio, e: Entrada): boolean {
  if (e.tipo !== ej.tipo) return false;
  if (e.tipo === "cual") return Number.isInteger(e.elegida) && e.elegida >= 0 && e.elegida < (ej.opciones?.length ?? 0);
  if (e.tipo === "error") return Number.isInteger(e.tocado) && e.tocado >= 0 && e.tocado < expandirPulsos(ej.ritmo).length;
  return e.ids.length > 0 && e.ids.length <= 64;
}

export function corregirEntrada(ej: Ejercicio, e: Entrada): Correccion {
  if (e.tipo === "cual") return corregirCual(e.elegida, ej);
  if (e.tipo === "error") return corregirError(e.tocado, ej);
  return corregirDictado(e.ids, ej);
}

/** Recupera la entrada a partir de la corrección que devuelve la interfaz de ejercicio. */
export function entradaDe(c: Correccion, ej: Ejercicio): Entrada {
  if (ej.tipo === "dictado") return { tipo: "dictado", ids: c.respuesta };
  if (ej.tipo === "cual") {
    const k = c.respuesta.join(",");
    return { tipo: "cual", elegida: Math.max(0, ej.opciones!.findIndex((o) => o.join(",") === k)) };
  }
  const tocado = c.acierto ? ej.errorPulso! : c.aciertos.findIndex((ok, i) => !ok && i !== ej.errorPulso);
  return { tipo: "error", tocado: Math.max(0, tocado) };
}

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin I ni O
export function generarCodigo(azar: () => number = Math.random): string {
  return Array.from({ length: 4 }, () => LETRAS[Math.floor(azar() * LETRAS.length)]).join("");
}

export const codigoValido = (s: string) => /^[A-Z]{4}$/.test(s);
export const normalizarCodigo = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
