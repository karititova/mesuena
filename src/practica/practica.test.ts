import { describe, expect, it } from "vitest";
import { compas } from "@/musica/compases";
import { expandirPulsos } from "@/musica/comprobador";
import { figura } from "@/musica/figuras";
import { generarRitmo } from "@/musica/generador";
import {
  baldoResumen,
  corregirCual,
  corregirDictado,
  corregirError,
  crearEjercicio,
  pulsosMasFallados,
  seleccionValida,
  type Config,
} from "./ejercicios";

const base: Config = { nivel: 1, compas: "4/4", figuras: ["negra", "blanca", "silencio_negra", "dos_corcheas"], ejercicio: "cual", ppm: 60, numCompases: 2 };
const huella = (ids: string[]) => expandirPulsos(ids).map((p) => `${p.figuraId}:${p.indice}`).join("|");

describe("selección de figuras", () => {
  it("exige al menos dos figuras", () => expect(seleccionValida(["negra"])).toBe(false));
  it("exige al menos una figura de un pulso", () => expect(seleccionValida(["blanca", "redonda"])).toBe(false));
  it("acepta dos figuras con una de un pulso", () => expect(seleccionValida(["blanca", "negra"])).toBe(true));
  it("el generador solo usa las figuras elegidas", () => {
    for (let i = 0; i < 50; i++) {
      const r = generarRitmo(compas("3/4"), 1, 2, Math.random, ["negra", "blanca"]);
      expect(r.every((id) => id === "negra" || id === "blanca")).toBe(true);
      expect(r.reduce((a, id) => a + figura(id).pulsos, 0)).toBe(6);
    }
  });
});

describe("¿Cuál suena?", () => {
  it("tres opciones; las otras dos difieren del ritmo en al menos un pulso", () => {
    for (let i = 0; i < 40; i++) {
      const ej = crearEjercicio(base);
      expect(ej.opciones).toHaveLength(3);
      expect(ej.opciones![ej.correcta!]).toEqual(ej.ritmo);
      const h = ej.opciones!.map(huella);
      expect(new Set(h).size).toBe(3);
    }
  });
  it("elegir la correcta es acierto", () => {
    const ej = crearEjercicio(base);
    expect(corregirCual(ej.correcta!, ej).acierto).toBe(true);
    expect(corregirCual((ej.correcta! + 1) % 3, ej).acierto).toBe(false);
  });
});

describe("Encuentra el error", () => {
  it("lo que suena difiere en exactamente un pulso", () => {
    for (let i = 0; i < 40; i++) {
      const ej = crearEjercicio({ ...base, ejercicio: "error" });
      const a = expandirPulsos(ej.ritmo);
      const b = expandirPulsos(ej.suena!);
      const distintos = a.map((p, k) => (p.figuraId !== b[k]!.figuraId ? k : -1)).filter((k) => k >= 0);
      expect(distintos).toEqual([ej.errorPulso]);
    }
  });
  it("tocar el pulso correcto es acierto", () => {
    const ej = crearEjercicio({ ...base, ejercicio: "error" });
    expect(corregirError(ej.errorPulso!, ej).acierto).toBe(true);
    const otro = (ej.errorPulso! + 1) % 8;
    expect(corregirError(otro, ej).acierto).toBe(false);
  });
});

describe("Dictado", () => {
  it("silencio en vez de continuación cuenta como bien y guarda la equivalencia", () => {
    const c = corregirDictado(["negra", "silencio_negra"], { tipo: "dictado", ritmo: ["blanca"] });
    expect(c.aciertos[1]).toBe(true);
    expect(c.equivalencias).toEqual([null, "blanca"]);
  });
});

describe("resumen de la tanda", () => {
  it("Baldo celebra con 4 o más de 5", () => {
    expect(baldoResumen(4)).toBe("celebracion");
    expect(baldoResumen(3)).toBe("neutro");
  });
  it("pulsos más fallados ordenados", () => {
    expect(pulsosMasFallados([[true, false], [true, false], [false, true]])).toEqual([
      { pulso: 2, veces: 2 },
      { pulso: 1, veces: 1 },
    ]);
  });
});
