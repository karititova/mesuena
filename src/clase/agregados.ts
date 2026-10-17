// Cálculos de la sala de la profesora: mapa por pulsos, respuestas más repetidas, resumen y alumnos demo. Puro.
import { expandirPulsos } from "@/musica/comprobador";
import { figura } from "@/musica/figuras";
import type { Correccion, Ejercicio } from "@/practica/ejercicios";
import { confusionPrincipal } from "@/practica/comentario";
import type { Entrada } from "./sala";

export interface FilaRespuesta {
  participante_id: string;
  pregunta_id: string;
  entrada: Entrada;
  respuesta: string[];
  aciertos: boolean[];
  acierto: boolean;
}

/** Porcentaje (0-100, redondeado) de alumnos que fallaron cada pulso. */
export function mapaPulsos(rs: FilaRespuesta[], totalPulsos: number): number[] {
  return Array.from({ length: totalPulsos }, (_, i) => {
    if (!rs.length) return 0;
    const fallos = rs.filter((r) => r.aciertos[i] === false).length;
    return Math.round((fallos / rs.length) * 100);
  });
}

/** 0 = verde (hasta 20 % de fallo), 1 = terracota (más del 60 %); entre medias, mezcla lineal. */
export function tonoFallo(pct: number): number {
  if (pct <= 20) return 0;
  if (pct > 60) return 1;
  return (pct - 20) / 40;
}

export const porcentajeAcierto = (rs: FilaRespuesta[]) => (rs.length ? Math.round((rs.filter((r) => r.acierto).length / rs.length) * 100) : 0);

/** Las respuestas equivocadas más repetidas (dos por defecto), con cuántos alumnos las pusieron. */
export function erroresFrecuentes(rs: FilaRespuesta[], n = 2): { muestra: FilaRespuesta; veces: number }[] {
  const grupos = new Map<string, { muestra: FilaRespuesta; veces: number }>();
  for (const r of rs) {
    if (r.acierto) continue;
    const clave = r.entrada.tipo === "error" ? `t${r.entrada.tocado}` : r.respuesta.join(",");
    const g = grupos.get(clave) ?? { muestra: r, veces: 0 };
    g.veces++;
    grupos.set(clave, g);
  }
  return [...grupos.values()].sort((a, b) => b.veces - a.veces).slice(0, n);
}

export interface ResumenClase {
  /** Media de ejercicios bien por alumno, en %. */
  media: number;
  masFallada: { orden: number; pct: number } | null;
  confusion: { puesta: string; esperada: string; veces: number } | null;
  alumnos: { apodo: string; aciertos: number }[];
}

export function resumenClase(
  preguntas: { id: string; orden: number; ej: Ejercicio }[],
  participantes: { id: string; apodo: string }[],
  rs: FilaRespuesta[],
): ResumenClase {
  const alumnos = participantes.map((p) => ({ apodo: p.apodo, aciertos: rs.filter((r) => r.participante_id === p.id && r.acierto).length }));
  const media = participantes.length && preguntas.length ? Math.round((alumnos.reduce((a, x) => a + x.aciertos, 0) / (participantes.length * preguntas.length)) * 100) : 0;
  let masFallada: ResumenClase["masFallada"] = null;
  for (const p of preguntas) {
    const de = rs.filter((r) => r.pregunta_id === p.id);
    if (!de.length) continue;
    const pct = 100 - porcentajeAcierto(de);
    if (pct > 0 && (!masFallada || pct > masFallada.pct)) masFallada = { orden: p.orden, pct };
  }
  const solucion = new Map(preguntas.map((p) => [p.id, p.ej.tipo === "error" ? p.ej.suena! : p.ej.ritmo]));
  const correcciones: Correccion[] = rs
    .filter((r) => r.entrada.tipo !== "error")
    .map((r) => ({ aciertos: r.aciertos, equivalencias: [], acierto: r.acierto, respuesta: r.respuesta, solucion: solucion.get(r.pregunta_id) ?? [] }));
  return { media, masFallada, confusion: confusionPrincipal(correcciones), alumnos };
}

/** Apodos inventados para el modo demo (nunca nombres reales). */
export const APODOS_DEMO = [
  "Corchea veloz", "Metrónomo", "Do grave", "Pandereta", "Clave de sol", "Maraca", "Síncopa",
  "Tresillo", "Calderón", "Fermata", "Allegretto", "Bombo", "Castañuela", "Tambor",
];

/** Pulso de la pregunta donde se concentran los fallos de los alumnos demo: uno con figura de un pulso. */
export function pulsoDificil(ej: Ejercicio, azar: () => number = Math.random): number {
  if (ej.tipo === "error") return ej.errorPulso ?? 0;
  const ps = expandirPulsos(ej.ritmo);
  const candidatos = ps.map((p, i) => ({ p, i })).filter((x) => figura(x.p.figuraId).pulsos === 1).map((x) => x.i);
  return candidatos.length ? candidatos[Math.floor(azar() * candidatos.length)]! : 0;
}

/** Respuesta verosímil de un alumno demo: casi siempre acierta, y cuando falla lo hace en el pulso difícil. */
export function respuestaDemo(ej: Ejercicio, dificil: number, figurasClase: string[], azar: () => number = Math.random): Entrada {
  const falla = azar() < 0.4;
  if (ej.tipo === "cual") {
    if (!falla) return { tipo: "cual", elegida: ej.correcta! };
    const otras = [0, 1, 2].filter((i) => i !== ej.correcta);
    return { tipo: "cual", elegida: otras[Math.floor(azar() * otras.length)]! };
  }
  if (ej.tipo === "error") {
    const total = expandirPulsos(ej.ritmo).length;
    if (!falla) return { tipo: "error", tocado: ej.errorPulso! };
    const vecino = ej.errorPulso! + (azar() < 0.5 ? -1 : 1);
    return { tipo: "error", tocado: Math.min(total - 1, Math.max(0, vecino === ej.errorPulso ? 0 : vecino)) };
  }
  if (!falla) return { tipo: "dictado", ids: ej.ritmo };
  // Cambia la figura de un pulso que ocupa el pulso difícil por otra de un pulso de la clase.
  let p = 0;
  const ids = [...ej.ritmo];
  for (let i = 0; i < ids.length; i++) {
    const f = figura(ids[i]!);
    if (p === dificil && f.pulsos === 1) {
      const pool = figurasClase.filter((id) => id !== ids[i] && figura(id).pulsos === 1);
      if (pool.length) ids[i] = pool[Math.floor(azar() * pool.length)]!;
      break;
    }
    p += f.pulsos;
  }
  return { tipo: "dictado", ids };
}
