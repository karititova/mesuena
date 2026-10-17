import { describe, it, expect } from "vitest";
import { configuracionPregunta, numeroRonda, puedeAnadirRonda } from "./rondas";
import { limitesPulsos } from "@/musica/zonas";
import type { Config } from "@/practica/ejercicios";
const primera: Config = { nivel: 1, compas: "2/4", figuras: ["negra", "dos_corcheas"], ejercicio: "cual", ppm: 50, numCompases: 1 };
describe("rondas", () => {
  it("la ronda 2 empieza con pregunta 1 de 4 sin reiniciar el cursor global", () => expect(numeroRonda(5, 5, 4, 2)).toEqual({ ronda: 2, pregunta: 1, total: 4 }));
  it("solo añade ronda tras revelar la última pregunta", () => {
    expect(puedeAnadirRonda("revelada", 4, 5)).toBe(true);
    expect(puedeAnadirRonda("pregunta", 4, 5)).toBe(false);
    expect(puedeAnadirRonda("terminada", 4, 5)).toBe(false);
    expect(puedeAnadirRonda("revelada", 3, 5)).toBe(false);
  });
  it("el repaso conserva configuración y tipo de las preguntas anteriores", () => {
    const nueva = { ...primera, compas: "6/8", ejercicio: "dictado" as const, ppm: 70 };
    expect(configuracionPregunta(primera, nueva)).toEqual(primera);
  });
});
describe("rectángulo del pulso", () => {
  it("el último pulso 6/8 cubre corchea y negra hasta la barra", () => expect(limitesPulsos([{ unidad: 0, x: 10 }, { unidad: 6, x: 80 }, { unidad: 8, x: 110 }], 2, 6, 160)).toEqual([10, 80, 160]));
  it("un grupo simple cubre las dos corcheas", () => expect(limitesPulsos([{ unidad: 0, x: 10 }, { unidad: 2, x: 30 }, { unidad: 4, x: 60 }], 2, 4, 100)).toEqual([10, 60, 100]));
  it("interpela los pulsos de una blanca", () => expect(limitesPulsos([{ unidad: 0, x: 10 }], 2, 4, 110)).toEqual([10, 60, 110]));
});