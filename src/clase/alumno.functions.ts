// Funciones del alumno (sin cuenta). Cada una comprueba código de sala + id de dispositivo en el servidor.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Correccion, Ejercicio, TipoEjercicio } from "@/practica/ejercicios";
import { corregirEntrada, ejercicioDe, ejercicioPublico, entradaValida, type EstadoSala, type Entrada } from "./sala";

const base = z.object({ codigo: z.string().regex(/^[A-Z]{4}$/), dispositivo: z.string().min(8).max(64) });
const entradaSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("dictado"), ids: z.array(z.string().max(40)).max(64) }),
  z.object({ tipo: z.literal("cual"), elegida: z.number().int() }),
  z.object({ tipo: z.literal("error"), tocado: z.number().int() }),
]);

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface VistaAlumno {
  existe: boolean;
  sesionId?: string;
  estado?: EstadoSala;
  actual?: number;
  total?: number;
  ronda?: number;
  inicioRonda?: number;
  preguntasRonda?: number;
  cfg?: { nivel: 1 | 2; compas: string; figuras: string[]; ejercicio: TipoEjercicio; ppm: number; numCompases: number };
  apodos?: string[];
  yo?: { apodo: string } | null;
  ejercicio?: Ejercicio;
  enviada?: boolean;
  correccion?: Correccion;
  pctClase?: number;
  misAciertos?: number;
}

export const estadoSala = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => base.parse(d))
  .handler(async ({ data }): Promise<VistaAlumno> => {
    const sb = await db();
    const { data: s } = await sb.from("sesiones").select("*").eq("codigo", data.codigo).maybeSingle();
    if (!s) return { existe: false };
    const { data: ps } = await sb.from("participantes").select("id, apodo, dispositivo").eq("sesion_id", s.id).order("creado");
    const yo = (ps ?? []).find((p) => p.dispositivo === data.dispositivo) ?? null;
    const vista: VistaAlumno = {
      existe: true,
      sesionId: s.id,
      estado: s.estado as EstadoSala,
      actual: s.pregunta_actual,
      total: s.num_preguntas,
      ronda: s.ronda,
      inicioRonda: s.inicio_ronda,
      preguntasRonda: s.preguntas_ronda,
      cfg: { nivel: s.nivel as 1 | 2, compas: s.compas, figuras: s.figuras, ejercicio: s.ejercicio as TipoEjercicio, ppm: s.ppm, numCompases: s.num_compases },
      apodos: (ps ?? []).map((p) => p.apodo),
      yo: yo ? { apodo: yo.apodo } : null,
    };
    if (!yo) return vista;
    if (s.estado === "pregunta" || s.estado === "revelada") {
      const { data: q } = await sb.from("preguntas").select("*").eq("sesion_id", s.id).eq("orden", s.pregunta_actual).single();
      if (!q) return vista;
      const ej = ejercicioDe(s.ejercicio as TipoEjercicio, q);
      vista.ejercicio = s.estado === "pregunta" ? ejercicioPublico(ej) : ej;
      const { data: mia } = await sb.from("respuestas").select("*").eq("participante_id", yo.id).eq("pregunta_id", q.id).maybeSingle();
      vista.enviada = !!mia;
      if (s.estado === "revelada") {
        if (mia) {
          vista.correccion = {
            aciertos: mia.aciertos,
            equivalencias: mia.equivalencias as (string | null)[],
            acierto: mia.acierto,
            respuesta: mia.respuesta,
            solucion: ej.tipo === "error" ? ej.suena! : ej.ritmo,
          };
        }
        const { data: todas } = await sb.from("respuestas").select("acierto").eq("pregunta_id", q.id);
        const n = todas?.length ?? 0;
        vista.pctClase = n ? Math.round(((todas ?? []).filter((r) => r.acierto).length / n) * 100) : 0;
      }
    }
    if (s.estado === "terminada") {
      const { count } = await sb.from("respuestas").select("id", { count: "exact", head: true }).eq("participante_id", yo.id).eq("acierto", true);
      vista.misAciertos = count ?? 0;
    }
    return vista;
  });

export const unirse = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => base.extend({ apodo: z.string().trim().min(1).max(24) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: s } = await sb.from("sesiones").select("id, estado").eq("codigo", data.codigo).maybeSingle();
    if (!s) return { ok: false as const, motivo: "noexiste" as const };
    const { data: ya } = await sb.from("participantes").select("id").eq("sesion_id", s.id).eq("dispositivo", data.dispositivo).maybeSingle();
    if (ya) return { ok: true as const };
    if (s.estado === "terminada") return { ok: false as const, motivo: "terminada" as const };
    const { error } = await sb.from("participantes").insert({ sesion_id: s.id, apodo: data.apodo, dispositivo: data.dispositivo });
    if (error) {
      console.error(error);
      return { ok: false as const, motivo: "error" as const };
    }
    return { ok: true as const };
  });

export const enviarRespuesta = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => base.extend({ entrada: entradaSchema, tiempoMs: z.number().int().min(0).max(3_600_000) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: s } = await sb.from("sesiones").select("*").eq("codigo", data.codigo).maybeSingle();
    if (!s || s.estado !== "pregunta") return { ok: false as const, motivo: "cerrada" };
    const { data: yo } = await sb.from("participantes").select("id").eq("sesion_id", s.id).eq("dispositivo", data.dispositivo).maybeSingle();
    if (!yo) return { ok: false as const, motivo: "fuera" };
    const { data: q } = await sb.from("preguntas").select("*").eq("sesion_id", s.id).eq("orden", s.pregunta_actual).single();
    if (!q) return { ok: false as const, motivo: "cerrada" };
    const ej = ejercicioDe(s.ejercicio as TipoEjercicio, q);
    const entrada = data.entrada as Entrada;
    if (!entradaValida(ej, entrada)) return { ok: false as const, motivo: "invalida" };
    const c = corregirEntrada(ej, entrada);
    const { error } = await sb.from("respuestas").insert({
      sesion_id: s.id,
      participante_id: yo.id,
      pregunta_id: q.id,
      entrada,
      respuesta: c.respuesta,
      aciertos: c.aciertos,
      equivalencias: c.equivalencias,
      acierto: c.acierto,
      tiempo_ms: data.tiempoMs,
    });
    // Una sola respuesta por pregunta: un segundo envío choca con la clave única y se ignora.
    if (error && error.code !== "23505") {
      console.error(error);
      return { ok: false as const, motivo: "error" };
    }
    return { ok: true as const };
  });
