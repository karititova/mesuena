import { describe, expect, it } from "vitest";
import { TEMPOS } from "@/musica/compases";
import { configDe } from "./busqueda";
import { comentarioTanda, confusionPrincipal, posicionFallos } from "./comentario";
import { corregirDictado, crearEjercicio, type Config, type Correccion } from "./ejercicios";
import { TEXTOS_RESUMEN } from "./textos-resumen";

const cfg: Config = { nivel: 2, compas: "2/4", figuras: ["negra", "corchea_dos_semis", "dos_semis_corchea"], ejercicio: "dictado", ppm: 60, numCompases: 1 };
const dict = (resp: string[], sol: string[]): Correccion => corregirDictado(resp, { tipo: "dictado", ritmo: sol });

describe("tempos y valores por defecto", () => {
  it("Lento 50, Medio 60, Rápido 70", () => expect(TEMPOS.map((t) => [t.nombre, t.ppm])).toEqual([["Lento", 50], ["Medio", 60], ["Rápido", 70]]));
  it("dos compases por defecto", () => expect(configDe({ nivel: 1, compas: "2/4", figuras: "negra,blanca", ejercicio: "dictado" })!.numCompases).toBe(2));
});

describe("Encuentra el error", () => {
  it("lo que suena solo usa las figuras marcadas", () => {
    const figuras = ["negra", "dos_corcheas", "silencio_negra"];
    for (let i = 0; i < 100; i++) {
      const ej = crearEjercicio({ nivel: 1, compas: "4/4", figuras, ejercicio: "error", ppm: 60, numCompases: 2 });
      expect(ej.suena!.every((id) => figuras.includes(id))).toBe(true);
    }
  });
});

describe("comentario del resumen", () => {
  it("detecta el par de figuras confundidas", () => {
    const c = [dict(["corchea_dos_semis", "negra"], ["dos_semis_corchea", "negra"]), dict(["negra", "corchea_dos_semis"], ["negra", "dos_semis_corchea"])];
    expect(confusionPrincipal(c)).toEqual({ puesta: "corchea_dos_semis", esperada: "dos_semis_corchea", veces: 2 });
    expect(comentarioTanda(c, cfg, 2)[0]).toMatch(/^Has confundido dos semicorcheas y corchea \\(TI-RI TI\\) con corchea y dos semicorcheas \\(TI TI-RI\\) dos veces/);
  });
  it("un solo fallo de un par no basta", () => {
    expect(confusionPrincipal([dict(["corchea_dos_semis", "negra"], ["dos_semis_corchea", "negra"])])).toBeNull();
  });
  it("fallos concentrados en el último pulso", () => {
    const c = [dict(["negra", "corchea_dos_semis"], ["negra", "negra"]), dict(["negra", "dos_semis_corchea"], ["negra", "negra"])];
    expect(posicionFallos(c, 2)).toBe("ultimo");
  });
  it("explica la equivalencia «suena igual»", () => {
    const c = [dict(["negra", "silencio_negra"], ["blanca"])];
    expect(comentarioTanda(c, { ...cfg, figuras: ["negra", "blanca", "silencio_negra"] }, 2)).toContain(TEXTOS_RESUMEN.equivalencia);
  });
  it("todo bien en nivel 1: una sola frase", () => {
    const c = [dict(["negra", "negra"], ["negra", "negra"])];
    expect(comentarioTanda(c, { ...cfg, nivel: 1 }, 2)).toEqual(["Todo correcto. Sube el tempo o prueba el nivel 2."]);
  });
  it("sin par claro y con figuras largas", () => {
    const c = [dict(["negra", "negra"], ["blanca"])];
    expect(comentarioTanda(c, { ...cfg, figuras: ["negra", "blanca"] }, 2)[0]).toBe(TEXTOS_RESUMEN.largas);
  });
  it("nunca nombra números de pulso", () => {
    const c = [dict(["negra", "dos_corcheas"], ["negra", "negra"]), dict(["dos_corcheas", "negra"], ["negra", "negra"])];
    expect(comentarioTanda(c, cfg, 2).join(" ")).not.toMatch(/pulso \d/i);
  });
});
