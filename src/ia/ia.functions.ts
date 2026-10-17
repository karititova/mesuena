// Funciones de servidor de la IA y de «Tu repaso». La IA solo redacta; los textos se guardan y se reutilizan.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Correccion, TipoEjercicio } from "@/practica/ejercicios";
import { confusionPrincipal } from "@/practica/comentario";
import { figura } from "@/musica/figuras";
import { ejercicioDe, PREGUNTAS_MAX, PREGUNTAS_MIN, type Entrada } from "@/clase/sala";
import { erroresFrecuentes, mapaPulsos, type FilaRespuesta } from "@/clase/agregados";
import { falloPrincipal } from "@/clase/repaso";
import { PROMPT_CONFIGURAR_CLASE, PROMPT_EXPLICAR, PROMPT_RESUMIR_CLASE } from "./prompts";
import { entradaFallo, entradaFallos, ESQUEMA_CLASE, MAX_EXPLICACION, MAX_RESUMEN, sanear, validarCfg, valoresValidos, type CfgClase } from "./texto";

const base = z.object({ codigo: z.string().regex(/^[A-Z]{4}$/), dispositivo: z.string().min(8).max(64) });

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Devuelve el texto guardado o lo genera una vez y lo guarda. Null si la IA falla. */
async function cacheado(clave: string, sesionId: string, generar: () => Promise<string | null>): Promise<string | null> {
  const sb = await admin();
  const { data: ya } = await sb.from("explicaciones").select("texto").eq("clave", clave).maybeSingle();
  if (ya) return ya.texto;
  const texto = await generar();
  if (!texto) return null;
  const { error } = await sb.from("explicaciones").insert({ clave, sesion_id: sesionId, texto });
  if (error && error.code !== "23505") console.error(error);
  return texto;
}

async function pedir(instrucciones: string, entrada: string, max: number) {
  const { pedirIA } = await import("./gateway.server");
  return sanear(await pedirIA({ instrucciones, entrada }), max);
}

export interface PreguntaRepaso {
  id: string;
  orden: number;
  correccion: Correccion | null;
}
export interface VistaRepaso {
  estado: "noexiste" | "abierta" | "sinrespuestas" | "ok";
  cfg?: { nivel: 1 | 2; compas: string; figuras: string[]; ejercicio: TipoEjercicio; ppm: number; numCompases: number };
  preguntas?: PreguntaRepaso[];
  bien?: number;
}

async function cargarAlumno(codigo: string, dispositivo: string) {
  const sb = await admin();
  const { data: s } = await sb.from("sesiones").select("*").eq("codigo", codigo).maybeSingle();
  if (!s) return null;
  const { data: yo } = await sb.from("participantes").select("id").eq("sesion_id", s.id).eq("dispositivo", dispositivo).maybeSingle();
  const [{ data: qs }, { data: rs }] = await Promise.all([
    sb.from("preguntas").select("*").eq("sesion_id", s.id).order("orden"),
    yo ? sb.from("respuestas").select("*").eq("participante_id", yo.id) : Promise.resolve({ data: [] as never[] }),
  ]);
  const preguntas: PreguntaRepaso[] = (qs ?? []).map((q) => {
    const ej = ejercicioDe(s.ejercicio as TipoEjercicio, q);
    const r = (rs ?? []).find((x) => x.pregunta_id === q.id);
    return {
      id: q.id,
      orden: q.orden,
      correccion: r
        ? { aciertos: r.aciertos, equivalencias: r.equivalencias as (string | null)[], acierto: r.acierto, respuesta: r.respuesta, solucion: ej.tipo === "error" ? ej.suena! : ej.ritmo }
        : null,
    };
  });
  return { s, yo, preguntas };
}

export const datosRepaso = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => base.parse(d))
  .handler(async ({ data }): Promise<VistaRepaso> => {
    const a = await cargarAlumno(data.codigo, data.dispositivo);
    if (!a) return { estado: "noexiste" };
    if (a.s.estado !== "terminada") return { estado: "abierta" };
    const cfg = { nivel: a.s.nivel as 1 | 2, compas: a.s.compas, figuras: a.s.figuras, ejercicio: a.s.ejercicio as TipoEjercicio, ppm: a.s.ppm, numCompases: a.s.num_compases };
    if (!a.yo || !a.preguntas.some((p) => p.correccion)) return { estado: "sinrespuestas", cfg };
    return { estado: "ok", cfg, preguntas: a.preguntas, bien: a.preguntas.filter((p) => p.correccion?.acierto).length };
  });

/** Uso A: explicación de una pregunta fallada (preguntaId) o frase de conjunto del alumno (sin preguntaId). */
export const explicacionAlumno = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => base.extend({ preguntaId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data }): Promise<{ texto: string | null }> => {
    try {
      const a = await cargarAlumno(data.codigo, data.dispositivo);
      if (!a || !a.yo || a.s.estado !== "terminada") return { texto: null };
      const { s, yo } = a;
      if (data.preguntaId) {
        const c = a.preguntas.find((p) => p.id === data.preguntaId)?.correccion;
        const f = c && !c.acierto ? falloPrincipal(c) : null;
        if (!f) return { texto: null };
        return { texto: await cacheado(`A:${yo.id}:${data.preguntaId}`, s.id, () => pedir(PROMPT_EXPLICAR, entradaFallo(s.compas, s.nivel, f), MAX_EXPLICACION)) };
      }
      const fs = a.preguntas.map((p) => (p.correccion ? falloPrincipal(p.correccion) : null)).filter((f): f is NonNullable<typeof f> => !!f);
      if (!fs.length) return { texto: null };
      return { texto: await cacheado(`A:${yo.id}:todo`, s.id, () => pedir(PROMPT_EXPLICAR, entradaFallos(s.compas, s.nivel, fs), MAX_EXPLICACION)) };
    } catch (e) {
      console.error(e);
      return { texto: null };
    }
  });

const nombre = (id: string) => {
  const f = figura(id);
  return `${f.nombre.toLowerCase()} (${f.silaba === "(silencio)" ? "silencio" : f.silaba})`;
};

/** Uso B: resumen de la clase para la profesora, una vez por sesión terminada. */
export const resumenClaseIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ texto: string | null }> => {
    try {
      const { supabase } = context;
      const { data: s } = await supabase.from("sesiones").select("*").eq("id", data.id).maybeSingle();
      if (!s || s.estado !== "terminada") return { texto: null };
      const generar = async () => {
        const [{ data: qs }, { data: rs }] = await Promise.all([
          supabase.from("preguntas").select("*").eq("sesion_id", s.id).order("orden"),
          supabase.from("respuestas").select("participante_id, pregunta_id, entrada, respuesta, aciertos, acierto, equivalencias").eq("sesion_id", s.id),
        ]);
        if (!rs?.length) return null;
        const lineas: string[] = [`Compás ${s.compas}, nivel ${s.nivel}. Figuras de la clase: ${s.figuras.map(nombre).join(", ")}.`];
        const correcciones: Correccion[] = [];
        let equivalencias = 0;
        for (const q of qs ?? []) {
          const ej = ejercicioDe(s.ejercicio as TipoEjercicio, q);
          const sol = ej.tipo === "error" ? ej.suena! : ej.ritmo;
          const de = rs.filter((r) => r.pregunta_id === q.id).map((r) => ({ ...r, entrada: r.entrada as Entrada })) as (FilaRespuesta & { equivalencias: unknown })[];
          if (!de.length) continue;
          const fallo = Math.round((de.filter((r) => !r.acierto).length / de.length) * 100);
          const pulsos = mapaPulsos(de, sol.length ? de[0]!.aciertos.length : 0);
          const frec = erroresFrecuentes(de).map((e) => (e.muestra.entrada.tipo === "error" ? `tocó el pulso ${e.muestra.entrada.tocado + 1}` : e.muestra.respuesta.map(nombre).join(" + ")) + ` (${e.veces})`);
          lineas.push(`Pregunta ${q.orden + 1}: solución ${sol.map(nombre).join(" + ")}; fallo ${fallo} %; fallo por pulso ${pulsos.map((p) => p + " %").join(", ")}${frec.length ? `; respuestas equivocadas más repetidas: ${frec.join("; ")}` : ""}.`);
          for (const r of de) {
            const eqs = (r.equivalencias as (string | null)[]) ?? [];
            equivalencias += eqs.filter(Boolean).length;
            if (r.entrada.tipo !== "error") correcciones.push({ aciertos: r.aciertos, equivalencias: eqs, acierto: r.acierto, respuesta: r.respuesta, solucion: sol });
          }
        }
        const conf = confusionPrincipal(correcciones);
        if (conf) lineas.push(`Par más confundido: pusieron ${nombre(conf.puesta)} donde iba ${nombre(conf.esperada)} (${conf.veces} veces).`);
        lineas.push(`Equivalencias «suena igual»: ${equivalencias}.`);
        return pedir(PROMPT_RESUMIR_CLASE, lineas.join("\n"), MAX_RESUMEN);
      };
      return { texto: await cacheado(`B:${s.id}`, s.id, generar) };
    } catch (e) {
      console.error(e);
      return { texto: null };
    }
  });

/** Convierte una descripción libre en la configuración de la clase. Null si no es válida. */
export const interpretarClase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ texto: z.string().trim().min(3).max(400) }).parse(d))
  .handler(async ({ data }): Promise<{ cfg: CfgClase | null }> => {
    try {
      const { pedirIA } = await import("./gateway.server");
      const out = await pedirIA({
        instrucciones: `${PROMPT_CONFIGURAR_CLASE}\n\nValores válidos:\n${valoresValidos(PREGUNTAS_MIN, PREGUNTAS_MAX)}`,
        entrada: data.texto,
        esquema: ESQUEMA_CLASE,
      });
      if (!out) return { cfg: null };
      return { cfg: validarCfg(JSON.parse(out), PREGUNTAS_MIN, PREGUNTAS_MAX) };
    } catch (e) {
      console.error(e);
      return { cfg: null };
    }
  });
