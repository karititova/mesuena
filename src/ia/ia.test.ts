import { describe, expect, it } from "vitest";
import { sanear, validarCfg, MAX_EXPLICACION } from "./texto";
import { falloPrincipal, figurasRepaso } from "@/clase/repaso";

describe("saneado de la IA", () => {
  it("quita exclamaciones", () => expect(sanear("¡Muy bien! Escucha.", 220)).toBe("Muy bien Escucha."));
  it("no pasa de 220 caracteres", () => expect(sanear("palabra ".repeat(60), MAX_EXPLICACION)!.length).toBeLessThanOrEqual(220));
  it("descarta figuras que no existen en la app", () => expect(sanear("Has puesto un tresillo.", 220)).toBeNull());
});

describe("configuración propuesta por la IA", () => {
  const ok = { entendido: true, compas: "6/8", nivel: 1, figuras: ["negra_puntillo", "tres_corcheas"], ejercicio: "dictado", preguntas: 6, ppm: 50 };
  it("acepta valores válidos", () => expect(validarCfg(ok, 3, 10)?.numPreguntas).toBe(6));
  it("rechaza figuras de otro compás", () => expect(validarCfg({ ...ok, figuras: ["negra", "blanca"] }, 3, 10)).toBeNull());
  it("rechaza un tempo que no existe", () => expect(validarCfg({ ...ok, ppm: 80 }, 3, 10)).toBeNull());
  it("rechaza si no lo ha entendido", () => expect(validarCfg({ ...ok, entendido: false }, 3, 10)).toBeNull());
});

describe("repaso decidido por el motor", () => {
  const c = { aciertos: [true, false], equivalencias: [null, null], acierto: false, respuesta: ["negra", "negra"], solucion: ["negra", "dos_corcheas"] };
  it("fallo principal", () => expect(falloPrincipal(c)).toEqual({ pulso: 1, puesta: "negra", esperada: "dos_corcheas", equivalencia: false }));
  it("las figuras falladas entran en el repaso", () => {
    const f = figurasRepaso([c], "2/4", 1, ["negra", "dos_corcheas", "blanca"]);
    expect(f[0]).toBe("dos_corcheas");
    expect(f.length).toBeGreaterThanOrEqual(2);
  });
});
