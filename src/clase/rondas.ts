import type { Config } from "@/practica/ejercicios";
import { z } from "zod";

const schema = z.object({
  nivel: z.union([z.literal(1), z.literal(2)]), compas: z.string(), figuras: z.array(z.string()),
  ejercicio: z.enum(["cual", "dictado", "error"]), ppm: z.number(), numCompases: z.number(),
});

export function configuracionPregunta(valor: unknown, fallback: Config): Config {
  const r = schema.safeParse(valor);
  return r.success ? r.data : fallback;
}

export function numeroRonda(actual: number, inicio: number, total: number, ronda: number) {
  return { ronda, pregunta: actual - inicio + 1, total };
}

export function puedeAnadirRonda(estado: string, actual: number, total: number) {
  return estado === "revelada" && actual + 1 === total;
}