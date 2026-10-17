import { describe, expect, it } from "vitest";
import { crearEjercicio, type Config } from "@/practica/ejercicios";
import { APODOS_DEMO, erroresFrecuentes, mapaPulsos, pulsoDificil, respuestaDemo, resumenClase, tonoFallo, type FilaRespuesta } from "./agregados";
import { codigoValido, corregirEntrada, ejercicioPublico, entradaDe, generarCodigo, PREGUNTAS_DEFECTO, PREGUNTAS_MAX, PREGUNTAS_MIN } from "./sala";

const fila = (aciertos: boolean[], extra: Partial<FilaRespuesta> = {}): FilaRespuesta => ({
  participante_id: "a",
  pregunta_id: "q",
  entrada: { tipo: "dictado", ids: [] },
  respuesta: [],
  aciertos,
  acierto: aciertos.every(Boolean),
  ...extra,
});

describe("clase en directo", () => {
  it("el código de la sala tiene 4 letras", () => {
    for (let i = 0; i < 50; i++) expect(codigoValido(generarCodigo())).toBe(true);
  });

  it("preguntas: 5 por defecto, de 3 a 10", () => {
    expect([PREGUNTAS_DEFECTO, PREGUNTAS_MIN, PREGUNTAS_MAX]).toEqual([5, 3, 10]);
  });

  it("mapa por pulsos: porcentaje de alumnos que falló cada pulso", () => {
    const rs = [fila([true, false]), fila([true, false]), fila([false, true]), fila([true, true])];
    expect(mapaPulsos(rs, 2)).toEqual([25, 50]);
  });

  it("color del mapa: verde hasta 20 %, terracota por encima del 60 %", () => {
    expect(tonoFallo(0)).toBe(0);
    expect(tonoFallo(20)).toBe(0);
    expect(tonoFallo(61)).toBe(1);
    expect(tonoFallo(40)).toBeCloseTo(0.5);
  });

  it("muestra las dos respuestas equivocadas más repetidas con su número de alumnos", () => {
    const rs = [
      fila([false], { respuesta: ["x"] }),
      fila([false], { respuesta: ["x"] }),
      fila([false], { respuesta: ["y"] }),
      fila([false], { respuesta: ["z"] }),
      fila([false], { respuesta: ["z"] }),
      fila([false], { respuesta: ["z"] }),
      fila([true], { respuesta: ["ok"] }),
    ];
    expect(erroresFrecuentes(rs).map((g) => [g.muestra.respuesta[0], g.veces])).toEqual([["z", 3], ["x", 2]]);
  });

  it("el resumen lista a los alumnos en orden de llegada, no por puntuación", () => {
    const ej = crearEjercicio({ nivel: 1, compas: "2/4", figuras: ["negra", "dos_corcheas"], ejercicio: "dictado", ppm: 60, numCompases: 1 });
    const r = resumenClase(
      [{ id: "q", orden: 0, ej }],
      [{ id: "a", apodo: "Ana" }, { id: "b", apodo: "Bea" }],
      [fila([false], { participante_id: "a" }), fila([true], { participante_id: "b" })],
    );
    expect(r.alumnos).toEqual([{ apodo: "Ana", aciertos: 0 }, { apodo: "Bea", aciertos: 1 }]);
    expect(r.media).toBe(50);
  });

  it("modo demo: 14 alumnos, y sus fallos caen en el pulso difícil", () => {
    expect(APODOS_DEMO).toHaveLength(14);
    const cfg: Config = { nivel: 1, compas: "4/4", figuras: ["negra", "dos_corcheas", "silencio_negra"], ejercicio: "dictado", ppm: 60, numCompases: 2 };
    const ej = crearEjercicio(cfg);
    const dificil = pulsoDificil(ej);
    for (let i = 0; i < 40; i++) {
      const c = corregirEntrada(ej, respuestaDemo(ej, dificil, cfg.figuras));
      c.aciertos.forEach((ok, p) => !ok && expect(p).toBe(dificil));
    }
  });

  it("el móvil no recibe la respuesta correcta mientras la pregunta está abierta", () => {
    const ej = crearEjercicio({ nivel: 1, compas: "2/4", figuras: ["negra", "dos_corcheas"], ejercicio: "cual", ppm: 60, numCompases: 2 });
    expect(ejercicioPublico(ej).correcta).toBeUndefined();
  });

  it("la entrada se recupera de la corrección de la interfaz", () => {
    const ej = crearEjercicio({ nivel: 1, compas: "2/4", figuras: ["negra", "dos_corcheas"], ejercicio: "error", ppm: 60, numCompases: 2 });
    const mal = (ej.errorPulso! + 1) % 4;
    expect(entradaDe(corregirEntrada(ej, { tipo: "error", tocado: mal }), ej)).toEqual({ tipo: "error", tocado: mal });
  });
});
