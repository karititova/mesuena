import type { TipoCompas } from "./figuras";
import { figura } from "./figuras";

export interface Compas {
  id: string;
  num: number;
  den: number;
  tipo: TipoCompas;
  pulsos: number;
  unidadesPulso: number;
}

export const COMPASES: Compas[] = [
  { id: "2/4", num: 2, den: 4, tipo: "simple", pulsos: 2, unidadesPulso: 4 },
  { id: "3/4", num: 3, den: 4, tipo: "simple", pulsos: 3, unidadesPulso: 4 },
  { id: "4/4", num: 4, den: 4, tipo: "simple", pulsos: 4, unidadesPulso: 4 },
  { id: "6/8", num: 6, den: 8, tipo: "compuesto", pulsos: 2, unidadesPulso: 6 },
  { id: "9/8", num: 9, den: 8, tipo: "compuesto", pulsos: 3, unidadesPulso: 6 },
  { id: "12/8", num: 12, den: 8, tipo: "compuesto", pulsos: 4, unidadesPulso: 6 },
];

export function compas(id: string): Compas {
  const c = COMPASES.find((x) => x.id === id);
  if (!c) throw new Error(`Compás desconocido: ${id}`);
  return c;
}

export const TEMPOS = [
  { id: "lento", nombre: "Lento", ppm: 50 },
  { id: "medio", nombre: "Medio", ppm: 60 },
  { id: "rapido", nombre: "Rápido", ppm: 70 },
] as const;

/** Reparte una secuencia de ids de figura en compases (cada figura entera dentro de su compás). */
export function repartirEnCompases(ids: string[], c: Compas): string[][] {
  const res: string[][] = [[]];
  let usados = 0;
  for (const id of ids) {
    const p = figura(id).pulsos;
    if (usados + p > c.pulsos) {
      res.push([]);
      usados = 0;
    }
    res[res.length - 1]!.push(id);
    usados += p;
    if (usados === c.pulsos) {
      res.push([]);
      usados = 0;
    }
  }
  if (res.length > 1 && res[res.length - 1]!.length === 0) res.pop();
  return res;
}

/** Pulsos que quedan libres en el compás en curso tras colocar `ids`. */
export function pulsosRestantesEnCompas(ids: string[], c: Compas): number {
  const total = ids.reduce((a, id) => a + figura(id).pulsos, 0);
  const r = total % c.pulsos;
  return r === 0 ? c.pulsos : c.pulsos - r;
}

/** ¿Cabe la figura en lo que queda del compás actual y del ejercicio? */
export function cabe(id: string, ids: string[], c: Compas, numCompases: number): boolean {
  const total = ids.reduce((a, x) => a + figura(x).pulsos, 0);
  if (total >= c.pulsos * numCompases) return false;
  return figura(id).pulsos <= pulsosRestantesEnCompas(ids, c);
}
