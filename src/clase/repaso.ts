// Repaso tras la clase: fallo principal de cada pregunta y figuras a repasar. Lo decide el motor, nunca la IA. Puro.
import { expandirPulsos } from "@/musica/comprobador";
import { figura, figurasDisponibles, type Nivel } from "@/musica/figuras";
import { compas as getCompas } from "@/musica/compases";
import { seleccionValida, type Correccion } from "@/practica/ejercicios";

export interface Fallo {
  pulso: number;
  puesta: string;
  esperada: string;
  equivalencia: boolean;
}

/** Primer pulso fallado donde se ve una figura distinta, o una equivalencia «suena igual» si no hay fallo. */
export function falloPrincipal(c: Correccion): Fallo | null {
  const r = expandirPulsos(c.respuesta);
  const s = expandirPulsos(c.solucion);
  for (let i = 0; i < s.length; i++) {
    if (c.aciertos[i] === false && s[i] && r[i] && r[i]!.figuraId !== s[i]!.figuraId) {
      return { pulso: i, puesta: r[i]!.figuraId, esperada: s[i]!.figuraId, equivalencia: false };
    }
  }
  for (let i = 0; i < s.length; i++) {
    const e = c.equivalencias[i];
    if (e && r[i]) return { pulso: i, puesta: r[i]!.figuraId, esperada: e, equivalencia: true };
  }
  return null;
}

/** Figuras de la solución en los pulsos fallados, de más a menos falladas. */
export function figurasFalladas(cs: Correccion[]): string[] {
  const n = new Map<string, number>();
  for (const c of cs) {
    const s = expandirPulsos(c.solucion);
    c.aciertos.forEach((ok, i) => {
      if (!ok && s[i]) n.set(s[i]!.figuraId, (n.get(s[i]!.figuraId) ?? 0) + 1);
    });
  }
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

/** Figuras para repasar: hasta 3 falladas del compás y nivel, completadas con figuras de un pulso hasta ser una selección válida. */
export function figurasRepaso(cs: Correccion[], compasId: string, nivel: Nivel, figurasClase: string[]): string[] {
  const disp = figurasDisponibles(getCompas(compasId).tipo, nivel).map((f) => f.id);
  const sel = figurasFalladas(cs).filter((id) => disp.includes(id)).slice(0, 3);
  const relleno = [...figurasClase, ...disp].filter((id) => disp.includes(id) && figura(id).pulsos === 1);
  for (const id of relleno) {
    if (seleccionValida(sel)) break;
    if (!sel.includes(id)) sel.push(id);
  }
  return seleccionValida(sel) ? sel : figurasClase;
}
