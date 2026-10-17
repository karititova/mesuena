// Comentario del resumen de la tanda, calculado por reglas (sin IA). Puro: sin DOM.
import { expandirPulsos } from "@/musica/comprobador";
import { figura } from "@/musica/figuras";
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

/** Figuras de la solución en los pulsos fallados, de más a menos fallada. */
function figurasFalladas(correcciones: Correccion[]): string[] {
  const cuenta = new Map<string, number>();
  for (const c of correcciones) {
    const s = expandirPulsos(c.solucion);
    c.aciertos.forEach((ok, i) => {
      const id = s[i]?.figuraId;
      if (!ok && id) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
    });
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

/** Dos o tres frases a partir de los fallos de la tanda. Nombra figuras, nunca números de pulso. */
export function comentarioTanda(correcciones: Correccion[], cfg: Config, _pulsosCompas?: number): string[] {
  const algunFallo = correcciones.some((c) => c.aciertos.some((ok) => !ok));
  if (!algunFallo) return [cfg.nivel === 1 ? T.todoBien : T.todoBienNivel2];
  const frases: string[] = [];
  const conf = confusionPrincipal(correcciones);
  if (conf) {
    frases.push(T.confusion(datos(conf.esperada), datos(conf.puesta), conf.veces, T.pistas[conf.esperada] ?? ""));
  } else {
    const ids = figurasFalladas(correcciones);
    if (ids.some((id) => figura(id).pulsos > 1)) frases.push(T.largas);
    else if (ids.length) frases.push(T.figuras(ids.slice(0, 2).map((id) => figura(id).nombre)));
  }
  if (correcciones.some((c) => c.equivalencias.some(Boolean))) frases.push(T.equivalencia);
  return frases.slice(0, 3);
}
