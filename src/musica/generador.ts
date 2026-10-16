import type { Compas } from "./compases";
import { esSilencio, figurasDisponibles, type Figura, type Nivel } from "./figuras";

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
): string[] {
  const disponibles = figurasDisponibles(c.tipo, nivel);
  const res: string[] = [];

  for (let m = 0; m < numCompases; m++) {
    for (let intento = 0; intento < 50; intento++) {
      const compasActual = generarCompas(c, nivel, disponibles, res, m === 0, azar);
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
        if (nivel === 1 && silencios >= 1) return false;
        if (soloSilencios && f.pulsos === restantes) return false;
      }
      return true;
    });
    if (candidatos.length === 0) return null;

    const pesos = candidatos.map((f) => {
      let p = f.nivel === nivel ? 3 : 1; // favorece las nuevas del nivel
      if (esSilencio(f)) p *= 0.5;
      if (f.pulsos >= 3) p *= 0.5;
      return p;
    });
    const total = pesos.reduce((a, b) => a + b, 0);
    let r = azar() * total;
    let elegido = candidatos[candidatos.length - 1];
    for (let i = 0; i < candidatos.length; i++) {
      r -= pesos[i];
      if (r < 0) {
        elegido = candidatos[i];
        break;
      }
    }
    out.push(elegido);
    usados += elegido.pulsos;
    if (esSilencio(elegido)) silencios++;
  }
  if (out.every((f) => esSilencio(f))) return null;
  return out.map((f) => f.id);
}
