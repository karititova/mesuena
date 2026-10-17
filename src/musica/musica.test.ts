import { describe, expect, it } from "vitest";
import { COMPASES, cabe, compas } from "./compases";
import { comprobar, expandirPulsos } from "./comprobador";
import { esSilencio, figura, figurasDisponibles } from "./figuras";
import { esApoyo, generarRitmo, tieneSemis } from "./generador";

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
            compases[compases.length - 1]!.push(id);
            usados += f.pulsos;
            if (usados === c.pulsos) {
              usados = 0;
              compases.push([]);
            }
          }
          expect(usados).toBe(0);
          compases.pop();
          expect(compases).toHaveLength(2);
          expect(esSilencio(figura(ids[0]!))).toBe(false);
          for (const m of compases) {
            expect(m.every((id) => esSilencio(figura(id)))).toBe(false);
            if (nivel === 1) expect(m.filter((id) => esSilencio(figura(id))).length).toBeLessThanOrEqual(1);
          }
          if (nivel === 2) {
            for (const m of compases) {
              const n2 = m.filter((id) => figura(id).nivel === 2).length;
              expect(n2).toBeLessThanOrEqual(c.pulsos / 2);
              expect(m.some(esApoyo)).toBe(true);
            }
            let seguidos = 0;
            for (const id of ids) {
              seguidos = tieneSemis(id) ? seguidos + 1 : 0;
              expect(seguidos).toBeLessThanOrEqual(2);
            }
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
  it("silencio en lugar de continuación de blanca suena igual y se marca como equivalencia", () => {
    const r = comprobar(["negra", "silencio_negra"], ["blanca"]);
    expect(r[1]!.correcto).toBe(true);
    expect(r[1]!.equivalencia).toBe(true);
    expect(r[0]!.equivalencia).toBe(false);
  });
  it("continuación en lugar de silencio también suena igual", () => {
    const r = comprobar(["blanca"], ["negra", "silencio_negra"]);
    expect(r[0]!.correcto).toBe(false);
    expect(r[1]!.correcto).toBe(true);
    expect(r[1]!.equivalencia).toBe(true);
  });
  it("expande una blanca en ataque + continuación", () => {
    expect(expandirPulsos(["blanca"]).map((p) => p.tipo)).toEqual(["ataque", "continuacion"]);
  });
  it("compara pulso a pulso", () => {
    const r = comprobar(["negra", "negra", "dos_corcheas"], ["blanca", "dos_corcheas"]);
    expect(r.map((x) => x.correcto)).toEqual([false, false, true]);
    expect(r[0]!.respuesta?.figuraId).toBe("negra");
    expect(r[0]!.esperado.figuraId).toBe("blanca");
  });
  it("respuesta incompleta cuenta como fallo", () => {
    const r = comprobar(["negra"], ["negra", "negra"]);
    expect(r.map((x) => x.correcto)).toEqual([true, false]);
    expect(r[1]!.respuesta).toBeNull();
  });
});

import { eventosDe, RITMO_VOZ, VEL_NOTA, VEL_PULSO } from "@/audio/motor";
import { compas as cc } from "./compases";
describe("compás de entrada", () => {
  it.each(["2/4", "6/8", "4/4", "12/8"])("siempre 1 compás en %s", (id) => {
    const c = cc(id);
    const { eventos } = eventosDe(c, [], 60, 1);
    expect(eventos.filter((e) => e.tipo === "metro" && (e.pulso ?? 0) < 0)).toHaveLength(c.pulsos);
  });
});

describe("sonido del ritmo", () => {
  const ritmo = (ids: string[]) => eventosDe(cc("2/4"), ids, 60, 1).eventos.filter((e) => e.tipo === "ritmo");
  it("la blanca se sostiene entera y negra + silencio no", () => {
    expect(ritmo(["blanca"])[0]!.dur).toBeCloseTo(2 - 0.04);
    const ns = ritmo(["negra", "silencio_negra"]);
    expect(ns).toHaveLength(1);
    expect(ns[0]!.dur).toBeCloseTo(1 - 0.04);
  });
  it("la primera nota de cada pulso suena más fuerte", () => {
    const v = ritmo(["dos_corcheas", "negra"]).map((e) => e.vel);
    expect(v[0]).toBeGreaterThan(v[1]!);
    expect(v[2]).toBe(v[0]);
  });
  it("el metrónomo solo suena en el compás de entrada", () => {
    const m = eventosDe(cc("2/4"), ["blanca"], 60, 1).eventos.filter((e) => e.tipo === "metro");
    expect(m.filter((e) => (e.pulso ?? 0) < 0).every((e) => e.vel > 0)).toBe(true);
    expect(m.filter((e) => (e.pulso ?? 0) >= 0).every((e) => e.vel === 0)).toBe(true);
  });
  it("el ritmo suena siempre en la misma nota fija y sin deslizamiento", () => {
    expect(RITMO_VOZ.nota).toBe("A5");
    expect(RITMO_VOZ.golpe).toBe(0.05);
    expect(RITMO_VOZ.pitchDecay).toBe(0.006);
    expect(RITMO_VOZ.octaves).toBe(1.5);
  });
  it("la primera nota de cada pulso suena 2,5 dB más fuerte", () => {
    expect(20 * Math.log10(VEL_PULSO / VEL_NOTA)).toBeCloseTo(2.5, 5);
  });
});
