import type { Compas } from "./compases";
import { esSilencio, figura, figurasDisponibles, type Figura, type Nivel } from "./figuras";

export const tieneSemis = (id: string) => figura(id).duraciones.some((d) => d.unidades === 1);
/** Negra (o negra con puntillo), figura de 2+ pulsos o silencio: da respiro al compás. */
export const esApoyo = (id: string) => {
  const f = figura(id);
  return esSilencio(f) || f.pulsos >= 2 || f.duraciones.length === 1;
};

/**
 * Reglas extra de nivel 2 para un compás: máx. la mitad de sus pulsos con figuras de nivel 2,
 * nunca más de dos pulsos seguidos con semicorcheas (contando el compás anterior)
 * y al menos una negra, figura larga o silencio.
 */
export function cumpleNivel2(ids: string[], previo: string[] = []): boolean {
  const pulsos = ids.reduce((a, id) => a + figura(id).pulsos, 0);
  const n2 = ids.filter((id) => figura(id).nivel === 2).reduce((a, id) => a + figura(id).pulsos, 0);
  if (n2 > pulsos / 2) return false;
  if (!ids.some(esApoyo)) return false;
  let seguidos = 0;
  for (const id of [...previo, ...ids]) {
    seguidos = tieneSemis(id) ? seguidos + 1 : 0;
    if (seguidos > 2) return false;
  }
  return true;
}

/**
 * Genera una secuencia válida de ids de figura.
 * Reglas: favorece las figuras nuevas del nivel; no más de dos iguales seguidas;
 * nivel 1 máx. un silencio por compás; nunca un compás entero de silencio;
 * el primer pulso del ritmo nunca es silencio.
 */
export function generarRitmo(
  c: Compas,
  nivel: Nivel,
  numCompases: number,
  azar: () => number = Math.random,
  permitidas?: string[],
): string[] {
  const todas = figurasDisponibles(c.tipo, nivel);
  const filtradas = permitidas ? todas.filter((f) => permitidas.includes(f.id)) : todas;
  const disponibles = filtradas.some((f) => f.pulsos === 1) ? filtradas : todas;
  const res: string[] = [];

  for (let m = 0; m < numCompases; m++) {
    // Primero con todas las reglas; si la selección del alumno lo impide, se relajan las de nivel 2.
    for (let intento = 0; intento < 700; intento++) {
      const compasActual = generarCompas(c, nivel, disponibles, res, m === 0, azar, intento < 500);
      if (compasActual) {
        res.push(...compasActual);
        break;
      }
    }
  }
  return res;
}

function generarCompas(
  c: Compas,
  nivel: Nivel,
  disponibles: Figura[],
  previo: string[],
  esPrimero: boolean,
  azar: () => number,
  estricto = true,
): string[] | null {
  const out: Figura[] = [];
  let usados = 0;
  let silencios = 0;
  while (usados < c.pulsos) {
    const restantes = c.pulsos - usados;
    const historial = [...previo, ...out.map((f) => f.id)];
    const ultimo = historial[historial.length - 1];
    const repetido = historial.length >= 2 && historial[historial.length - 2] === ultimo;
    const soloSilencios = out.every((f) => esSilencio(f));

    const candidatos = disponibles.filter((f) => {
      if (f.pulsos > restantes) return false;
      if (repetido && f.id === ultimo) return false;
      if (esSilencio(f)) {
        if (esPrimero && usados === 0) return false;
        if (nivel === 1 && silencios >= 1 && estricto) return false;
        if (soloSilencios && f.pulsos === restantes) return false;
      }
      return true;
    });
    if (candidatos.length === 0) return null;

    const pesos = candidatos.map((f) => {
      let p = f.nivel === nivel ? 3 : 1; // favorece las nuevas del nivel
      if (esSilencio(f)) p *= 0.5;
      if (f.pulsos >= 2) p *= 0.35; // las largas salen menos que las de un pulso
      return p;
    });
    const total = pesos.reduce((a, b) => a + b, 0);
    let r = azar() * total;
    let elegido = candidatos[candidatos.length - 1]!;
    for (let i = 0; i < candidatos.length; i++) {
      r -= pesos[i]!;
      if (r < 0) {
        elegido = candidatos[i]!;
        break;
      }
    }
    out.push(elegido);
    usados += elegido.pulsos;
    if (esSilencio(elegido)) silencios++;
  }
  if (out.every((f) => esSilencio(f))) return null;
  const ids = out.map((f) => f.id);
  if (estricto && nivel === 2 && !cumpleNivel2(ids, previo)) return null;
  return ids;
}
