// Comentario del resumen de la tanda, calculado por reglas (sin IA). Puro: sin DOM.
import { expandirPulsos } from "@/musica/comprobador";
import { figura } from "@/musica/figuras";
import { TEMPOS } from "@/musica/compases";
import type { Config, Correccion } from "./ejercicios";
import { TEXTOS_RESUMEN as T } from "./textos-resumen";

const datos = (id: string) => {
  const f = figura(id);
  return { nombre: f.nombre, silaba: f.silaba === "(silencio)" ? "silencio" : f.silaba };
};

/** Par de figuras que más se confunden (≥ 2 veces), con la dirección más frecuente. */
export function confusionPrincipal(correcciones: Correccion[]): { puesta: string; esperada: string; veces: number } | null {
  const pares = new Map<string, { veces: number; dir: Map<string, number> }>();
  for (const c of correcciones) {
    const r = expandirPulsos(c.respuesta);
    const s = expandirPulsos(c.solucion);
    c.aciertos.forEach((ok, i) => {
      if (ok || !r[i] || !s[i] || r[i]!.indice !== 0 || s[i]!.indice !== 0) return;
      const a = r[i]!.figuraId;
      const b = s[i]!.figuraId;
      if (a === b) return;
      const clave = [a, b].sort().join("|");
      const e = pares.get(clave) ?? { veces: 0, dir: new Map() };
      e.veces++;
      e.dir.set(`${a}>${b}`, (e.dir.get(`${a}>${b}`) ?? 0) + 1);
      pares.set(clave, e);
    });
  }
  let mejor: { puesta: string; esperada: string; veces: number } | null = null;
  for (const e of pares.values()) {
    if (e.veces < 2 || (mejor && e.veces <= mejor.veces)) continue;
    const [dir] = [...e.dir.entries()].sort((x, y) => y[1] - x[1])[0]!;
    const [puesta, esperada] = dir.split(">") as [string, string];
    mejor = { puesta, esperada, veces: e.veces };
  }
  return mejor;
}

/** «primero» o «ultimo» si al menos 2 fallos y el 60 % caen en esa posición del compás. */
export function posicionFallos(correcciones: Correccion[], pulsosCompas: number): "primero" | "ultimo" | null {
  let total = 0;
  let primero = 0;
  let ultimo = 0;
  for (const c of correcciones) {
    c.aciertos.forEach((ok, i) => {
      if (ok) return;
      total++;
      const p = i % pulsosCompas;
      if (p === 0) primero++;
      if (p === pulsosCompas - 1) ultimo++;
    });
  }
  if (total < 2) return null;
  if (ultimo / total >= 0.6) return "ultimo";
  if (primero / total >= 0.6) return "primero";
  return null;
}

/** Dos o tres frases a partir de los fallos de la tanda. */
export function comentarioTanda(correcciones: Correccion[], cfg: Config, pulsosCompas: number): string[] {
  const frases: string[] = [];
  const algunFallo = correcciones.some((c) => c.aciertos.some((ok) => !ok));
  const conf = cfg.ejercicio === "error" ? null : confusionPrincipal(correcciones);
  if (conf) {
    const clave = [conf.puesta, conf.esperada].sort().join("|");
    frases.push(T.confusion(datos(conf.puesta), datos(conf.esperada), T.pistas[clave] ?? ""));
  }
  const pos = posicionFallos(correcciones, pulsosCompas);
  if (pos) frases.push(pos === "primero" ? T.primerPulso : T.ultimoPulso);
  if (correcciones.some((c) => c.equivalencias.some(Boolean))) frases.push(T.equivalencia);

  if (!algunFallo) {
    const masRapido = TEMPOS.some((t) => t.ppm > cfg.ppm);
    if (frases.length === 0) frases.push(T.todoBien);
    frases.push(masRapido ? T.sugerenciaTempo : cfg.nivel === 1 ? T.sugerenciaNivel : T.sugerenciaFin);
  } else if (frases.length === 0) {
    frases.push(T.generico);
  }
  return frases.slice(0, 3);
}
