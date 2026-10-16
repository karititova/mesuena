// Lógica pura de la práctica libre: crear y corregir ejercicios. Sin DOM ni audio.
import { compas as getCompas, type Compas } from "@/musica/compases";
import { comprobar, expandirPulsos } from "@/musica/comprobador";
import { figura, figurasDisponibles, type Nivel } from "@/musica/figuras";
import { generarRitmo } from "@/musica/generador";

export type TipoEjercicio = "cual" | "dictado" | "error";

export const EJERCICIOS: { id: TipoEjercicio; nombre: string; frase: string }[] = [
  { id: "cual", nombre: "¿Cuál suena?", frase: "Ves una partitura y eliges cuál de tres audios la toca." },
  { id: "dictado", nombre: "Dictado", frase: "Escuchas un ritmo y lo montas con las figuras." },
  { id: "error", nombre: "Encuentra el error", frase: "Lo que suena no coincide con lo escrito en un pulso." },
];

export const TANDA = 5;

export interface Config {
  nivel: Nivel;
  compas: string;
  figuras: string[];
  ejercicio: TipoEjercicio;
  ppm: number;
  numCompases: number;
}

export interface Ejercicio {
  tipo: TipoEjercicio;
  /** Ritmo de referencia: el que suena (cuál/dictado) o el escrito (error). */
  ritmo: string[];
  /** ¿Cuál suena?: tres opciones de audio y el índice de la correcta. */
  opciones?: string[][];
  correcta?: number;
  /** Encuentra el error: lo que suena y el pulso que difiere. */
  suena?: string[];
  errorPulso?: number;
}

export interface Correccion {
  /** true por pulso si está bien (incluye «suena igual»). */
  aciertos: boolean[];
  /** Figura esperada si el pulso fue una equivalencia sonora, si no null. */
  equivalencias: (string | null)[];
  acierto: boolean;
  /** Ritmo que se muestra como «tu respuesta» y ritmo de la solución. */
  respuesta: string[];
  solucion: string[];
}

const huella = (ids: string[]) => expandirPulsos(ids).map((p) => `${p.figuraId}:${p.indice}`).join("|");

/** Selección válida: al menos dos figuras y al menos una de un pulso. */
export function seleccionValida(ids: string[]): boolean {
  return ids.length >= 2 && ids.some((id) => figura(id).pulsos === 1);
}

/** Cambia una figura de un pulso por otra de un pulso: difiere en exactamente un pulso. */
export function variarUnPulso(
  ids: string[],
  c: Compas,
  nivel: Nivel,
  permitidas: string[],
  azar: () => number = Math.random,
): { ids: string[]; pulso: number } | null {
  const posiciones: { i: number; pulso: number }[] = [];
  let p = 0;
  ids.forEach((id, i) => {
    if (figura(id).pulsos === 1) posiciones.push({ i, pulso: p });
    p += figura(id).pulsos;
  });
  if (!posiciones.length) return null;
  const unPulso = figurasDisponibles(c.tipo, nivel).filter((f) => f.pulsos === 1);
  const preferidas = unPulso.filter((f) => permitidas.includes(f.id));
  for (let intento = 0; intento < 40; intento++) {
    const pos = posiciones[Math.floor(azar() * posiciones.length)]!;
    const actual = ids[pos.i]!;
    const pool = (intento < 20 ? preferidas : unPulso).filter((f) => f.id !== actual);
    if (!pool.length) continue;
    const nueva = pool[Math.floor(azar() * pool.length)]!;
    const out = [...ids];
    out[pos.i] = nueva.id;
    return { ids: out, pulso: pos.pulso };
  }
  return null;
}

export function crearEjercicio(cfg: Config, azar: () => number = Math.random): Ejercicio {
  const c = getCompas(cfg.compas);
  const gen = () => generarRitmo(c, cfg.nivel, cfg.numCompases, azar, cfg.figuras);

  if (cfg.ejercicio === "dictado") return { tipo: "dictado", ritmo: gen() };

  if (cfg.ejercicio === "error") {
    for (let i = 0; i < 50; i++) {
      const ritmo = gen();
      const v = variarUnPulso(ritmo, c, cfg.nivel, cfg.figuras, azar);
      if (v) return { tipo: "error", ritmo, suena: v.ids, errorPulso: v.pulso };
    }
    // Siempre hay figuras de un pulso en la selección; esto no debería ocurrir.
    const ritmo = gen();
    return { tipo: "error", ritmo, suena: ritmo, errorPulso: 0 };
  }

  const ritmo = gen();
  const vistos = new Set([huella(ritmo)]);
  const distractores: string[][] = [];
  for (let i = 0; i < 200 && distractores.length < 2; i++) {
    const otro = i < 120 ? gen() : variarUnPulso(ritmo, c, cfg.nivel, cfg.figuras, azar)?.ids;
    if (!otro) continue;
    const h = huella(otro);
    if (vistos.has(h)) continue;
    vistos.add(h);
    distractores.push(otro);
  }
  const correcta = Math.floor(azar() * 3);
  const opciones = [...distractores];
  opciones.splice(correcta, 0, ritmo);
  return { tipo: "cual", ritmo, opciones, correcta };
}

export function corregirDictado(respuesta: string[], ej: Ejercicio): Correccion {
  const r = comprobar(respuesta, ej.ritmo);
  const aciertos = r.map((x) => x.correcto);
  return {
    aciertos,
    equivalencias: r.map((x) => (x.equivalencia ? x.esperado.figuraId : null)),
    acierto: aciertos.every(Boolean),
    respuesta,
    solucion: ej.ritmo,
  };
}

export function corregirCual(elegida: number, ej: Ejercicio): Correccion {
  const respuesta = ej.opciones![elegida]!;
  const acierto = elegida === ej.correcta;
  const r = comprobar(respuesta, ej.ritmo);
  return {
    aciertos: acierto ? r.map(() => true) : r.map((x) => x.correcto && !x.equivalencia),
    equivalencias: r.map(() => null),
    acierto,
    respuesta,
    solucion: ej.ritmo,
  };
}

export function corregirError(tocado: number, ej: Ejercicio): Correccion {
  const total = expandirPulsos(ej.ritmo).length;
  const acierto = tocado === ej.errorPulso;
  const aciertos = Array.from({ length: total }, (_, i) => acierto || (i !== tocado && i !== ej.errorPulso));
  return { aciertos, equivalencias: aciertos.map(() => null), acierto, respuesta: ej.ritmo, solucion: ej.suena! };
}

/** Pulsos (1, 2, …) más fallados en una tanda, de más a menos; máximo tres. */
export function pulsosMasFallados(tanda: boolean[][]): { pulso: number; veces: number }[] {
  const cuenta = new Map<number, number>();
  for (const ej of tanda) ej.forEach((ok, i) => !ok && cuenta.set(i, (cuenta.get(i) ?? 0) + 1));
  return [...cuenta.entries()]
    .map(([i, veces]) => ({ pulso: i + 1, veces }))
    .sort((a, b) => b.veces - a.veces || a.pulso - b.pulso)
    .slice(0, 3);
}

/** Bien si el ejercicio entero está bien. */
export const aciertosTanda = (correcciones: Correccion[]) => correcciones.filter((c) => c.acierto).length;
export const baldoResumen = (aciertos: number) => (aciertos >= 4 ? "celebracion" : "neutro") as "celebracion" | "neutro";
