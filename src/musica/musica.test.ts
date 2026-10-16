import { describe, expect, it } from "vitest";
import { COMPASES, cabe, compas } from "./compases";
import { comprobar, expandirPulsos } from "./comprobador";
import { esSilencio, figura, figurasDisponibles } from "./figuras";
import { generarRitmo } from "./generador";

describe("figuras", () => {
  it("las duraciones suman pulsos × unidades de pulso", () => {
    for (const c of COMPASES) {
      for (const f of figurasDisponibles(c.tipo, 2)) {
        expect(f.duraciones.reduce((a, d) => a + d.unidades, 0)).toBe(f.pulsos * c.unidadesPulso);
      }
    }
  });
  it("nivel 2 incluye las de nivel 1", () => {
    expect(figurasDisponibles("simple", 1)).toHaveLength(6);
    expect(figurasDisponibles("simple", 2)).toHaveLength(9);
    expect(figurasDisponibles("compuesto", 2)).toHaveLength(6);
  });
  it("la blanca no cabe en el último pulso de 3/4", () => {
    expect(cabe("blanca", ["negra", "negra"], compas("3/4"), 1)).toBe(false);
    expect(cabe("negra", ["negra", "negra"], compas("3/4"), 1)).toBe(true);
  });
});

describe("generarRitmo", () => {
  for (const c of COMPASES) {
    for (const nivel of [1, 2] as const) {
      it(`cumple las reglas en ${c.id} nivel ${nivel}`, () => {
        for (let i = 0; i < 300; i++) {
          const ids = generarRitmo(c, nivel, 2);
          // Encaja en compases exactos
          let usados = 0;
          const compases: string[][] = [[]];
          for (const id of ids) {
            const f = figura(id);
            expect(f.tipo).toBe(c.tipo);
            expect(f.nivel).toBeLessThanOrEqual(nivel);
            expect(usados + f.pulsos).toBeLessThanOrEqual(c.pulsos);
            compases[compases.length - 1].push(id);
            usados += f.pulsos;
            if (usados === c.pulsos) {
              usados = 0;
              compases.push([]);
            }
          }
          expect(usados).toBe(0);
          compases.pop();
          expect(compases).toHaveLength(2);
          expect(esSilencio(figura(ids[0]))).toBe(false);
          for (const m of compases) {
            expect(m.every((id) => esSilencio(figura(id)))).toBe(false);
            if (nivel === 1) expect(m.filter((id) => esSilencio(figura(id))).length).toBeLessThanOrEqual(1);
          }
          for (let k = 2; k < ids.length; k++) {
            expect(ids[k] === ids[k - 1] && ids[k] === ids[k - 2]).toBe(false);
          }
        }
      });
    }
  }
});

describe("comprobar", () => {
  it("expande una blanca en ataque + continuación", () => {
    expect(expandirPulsos(["blanca"]).map((p) => p.tipo)).toEqual(["ataque", "continuacion"]);
  });
  it("compara pulso a pulso", () => {
    const r = comprobar(["negra", "negra", "dos_corcheas"], ["blanca", "dos_corcheas"]);
    expect(r.map((x) => x.correcto)).toEqual([false, false, true]);
    expect(r[0].respuesta?.figuraId).toBe("negra");
    expect(r[0].esperado.figuraId).toBe("blanca");
  });
  it("respuesta incompleta cuenta como fallo", () => {
    const r = comprobar(["negra"], ["negra", "negra"]);
    expect(r.map((x) => x.correcto)).toEqual([true, false]);
    expect(r[1].respuesta).toBeNull();
  });
});
