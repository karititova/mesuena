// Progreso en el dispositivo (localStorage). Llamar solo en el navegador.
import type { Nivel } from "@/musica/figuras";
import type { TipoEjercicio } from "./ejercicios";

const K_ID = "me-suena-dispositivo";
const K_HIST = "me-suena-historial";
const kFiguras = (nivel: Nivel, compas: string) => `me-suena-figuras:${nivel}:${compas}`;

export interface TandaGuardada {
  dispositivo: string;
  fecha: string;
  nivel: Nivel;
  compas: string;
  ejercicio: TipoEjercicio;
  figuras: string[];
  ppm: number;
  numCompases: number;
  /** Aciertos por pulso de cada ejercicio. */
  aciertos: boolean[][];
  bien: number;
}

export function idDispositivo(): string {
  let id = localStorage.getItem(K_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(K_ID, id);
  }
  return id;
}

export function historial(): TandaGuardada[] {
  try {
    return JSON.parse(localStorage.getItem(K_HIST) ?? "[]") as TandaGuardada[];
  } catch {
    return [];
  }
}

export function guardarTanda(t: Omit<TandaGuardada, "dispositivo" | "fecha">) {
  const h = historial();
  h.push({ ...t, dispositivo: idDispositivo(), fecha: new Date().toISOString() });
  localStorage.setItem(K_HIST, JSON.stringify(h.slice(-200)));
}

export const ultimaTanda = (): TandaGuardada | null => historial().at(-1) ?? null;

export function figurasGuardadas(nivel: Nivel, compas: string): string[] | null {
  try {
    const v = localStorage.getItem(kFiguras(nivel, compas));
    return v ? (JSON.parse(v) as string[]) : null;
  } catch {
    return null;
  }
}

export function guardarFiguras(nivel: Nivel, compas: string, ids: string[]) {
  localStorage.setItem(kFiguras(nivel, compas), JSON.stringify(ids));
}
