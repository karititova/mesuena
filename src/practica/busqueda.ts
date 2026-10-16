// Parámetros de la URL del recorrido «Practicar».
import { COMPASES, TEMPOS } from "@/musica/compases";
import { figura, type Nivel } from "@/musica/figuras";
import type { Config, TipoEjercicio } from "./ejercicios";

export interface Busqueda {
  nivel?: Nivel;
  compas?: string;
  figuras?: string;
  ejercicio?: TipoEjercicio;
  ppm?: number;
  n?: number;
}

export function leerBusqueda(entrada: Record<string, unknown>): Busqueda {
  const s = entrada as { nivel?: unknown; compas?: unknown; figuras?: unknown; ejercicio?: unknown; ppm?: unknown; n?: unknown };
  const out: Busqueda = {};
  const nivel = Number(s.nivel);
  if (nivel === 1 || nivel === 2) out.nivel = nivel;
  if (typeof s.compas === "string" && COMPASES.some((c) => c.id === s.compas)) out.compas = s.compas;
  if (typeof s.figuras === "string") out.figuras = s.figuras;
  if (s.ejercicio === "cual" || s.ejercicio === "dictado" || s.ejercicio === "error") out.ejercicio = s.ejercicio;
  const ppm = Number(s.ppm);
  if (TEMPOS.some((t) => t.ppm === ppm)) out.ppm = ppm;
  const n = Number(s.n);
  if (n === 1 || n === 2) out.n = n;
  return out;
}

export function listaFiguras(s: string | undefined): string[] {
  if (!s) return [];
  return s.split(",").filter((id) => {
    try {
      figura(id);
      return true;
    } catch {
      return false;
    }
  });
}

export function configDe(b: Busqueda): Config | null {
  if (!b.nivel || !b.compas || !b.ejercicio) return null;
  const figuras = listaFiguras(b.figuras);
  if (!figuras.length) return null;
  return { nivel: b.nivel, compas: b.compas, figuras, ejercicio: b.ejercicio, ppm: b.ppm ?? 60, numCompases: b.n ?? 1 };
}

export const busquedaDe = (c: Config): Busqueda => ({
  nivel: c.nivel,
  compas: c.compas,
  figuras: c.figuras.join(","),
  ejercicio: c.ejercicio,
  ppm: c.ppm,
  n: c.numCompases,
});
