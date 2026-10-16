import { figura } from "./figuras";

export interface Pulso {
  figuraId: string;
  /** 0 = ataque; 1.. = continuación de una figura de varios pulsos */
  indice: number;
  tipo: "ataque" | "continuacion";
}

export function expandirPulsos(ids: string[]): Pulso[] {
  const out: Pulso[] = [];
  for (const id of ids) {
    const f = figura(id);
    for (let i = 0; i < f.pulsos; i++) {
      out.push({ figuraId: id, indice: i, tipo: i === 0 ? "ataque" : "continuacion" });
    }
  }
  return out;
}

export interface ResultadoPulso {
  pulso: number;
  correcto: boolean;
  esperado: Pulso;
  respuesta: Pulso | null;
  /** Correcto por sonar igual (continuación ↔ silencio), no acierto exacto. */
  equivalencia: boolean;
}

const esSilencio = (p: Pulso) => figura(p.figuraId).duraciones.every((d) => d.silencio);
/** Una continuación de nota larga y un silencio suenan igual en ese pulso (nada nuevo suena). */
function suenaIgual(a: Pulso, b: Pulso) {
  const callaA = a.tipo === "continuacion" || esSilencio(a);
  const callaB = b.tipo === "continuacion" || esSilencio(b);
  return callaA && callaB && (a.tipo === "continuacion") !== (b.tipo === "continuacion");
}

export function comprobar(respuesta: string[], correcta: string[]): ResultadoPulso[] {
  const r = expandirPulsos(respuesta);
  const c = expandirPulsos(correcta);
  return c.map((esperado, i) => {
    const dado = r[i] ?? null;
    const exacto = !!dado && dado.figuraId === esperado.figuraId && dado.indice === esperado.indice;
    const equivalencia = !exacto && !!dado && suenaIgual(esperado, dado);
    return { pulso: i, esperado, respuesta: dado, correcto: exacto || equivalencia, equivalencia };
  });
}
