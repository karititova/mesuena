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
}

export function comprobar(respuesta: string[], correcta: string[]): ResultadoPulso[] {
  const r = expandirPulsos(respuesta);
  const c = expandirPulsos(correcta);
  return c.map((esperado, i) => {
    const dado = r[i] ?? null;
    return {
      pulso: i,
      esperado,
      respuesta: dado,
      correcto: !!dado && dado.figuraId === esperado.figuraId && dado.indice === esperado.indice,
    };
  });
}
