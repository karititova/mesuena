// Funciones de la profesora: requieren sesión; los permisos de la base limitan todo a sus clases.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { crearEjercicio, seleccionValida, type TipoEjercicio } from "@/practica/ejercicios";
import { APODOS_DEMO } from "./agregados";
import { corregirEntrada, ejercicioDe, entradaValida, generarCodigo, PREGUNTAS_MAX, PREGUNTAS_MIN, type Entrada } from "./sala";
import { configuracionPregunta, puedeAnadirRonda } from "./rondas";

const cfgSchema = z.object({
  nivel: z.union([z.literal(1), z.literal(2)]),
  compas: z.enum(["2/4", "3/4", "4/4", "6/8", "9/8", "12/8"]),
  figuras: z.array(z.string()).min(2).max(20),
  ejercicio: z.enum(["cual", "dictado", "error"]),
  ppm: z.union([z.literal(50), z.literal(60), z.literal(70)]),
  numCompases: z.union([z.literal(1), z.literal(2)]),
  numPreguntas: z.number().int().min(PREGUNTAS_MIN).max(PREGUNTAS_MAX),
});

export const crearSesion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => cfgSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!seleccionValida(data.figuras)) throw new Error("Selección de figuras no válida");
    let sesionId: string | null = null;
    for (let i = 0; i < 10 && !sesionId; i++) {
      const { data: s, error } = await supabase
        .from("sesiones")
        .insert({
          codigo: generarCodigo(),
          profesora_id: userId,
          nivel: data.nivel,
          compas: data.compas,
          figuras: data.figuras,
          ejercicio: data.ejercicio,
          ppm: data.ppm,
          num_compases: data.numCompases,
          num_preguntas: data.numPreguntas,
          preguntas_ronda: data.numPreguntas,
        })
        .select("id")
        .single();
      if (s) sesionId = s.id;
      else if (error && error.code !== "23505") throw new Error(error.message);
    }
    if (!sesionId) throw new Error("No se pudo crear la clase");
    const id = sesionId;
    const cfg = { ...data, ejercicio: data.ejercicio as TipoEjercicio };
    const filas = Array.from({ length: data.numPreguntas }, (_, orden) => {
      const ej = crearEjercicio(cfg);
      return { sesion_id: id, orden, configuracion: cfg, ritmo: ej.ritmo, opciones: ej.opciones ?? null, correcta: ej.correcta ?? null, suena: ej.suena ?? null, error_pulso: ej.errorPulso ?? null };
    });
    const { error } = await supabase.from("preguntas").insert(filas);
    if (error) throw new Error(error.message);
    return { id: sesionId };
  });

export const misSesiones = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: ss } = await supabase.from("sesiones").select("id, codigo, nivel, compas, ejercicio, estado, num_preguntas, ronda, uso_demo, creada").order("creada", { ascending: false });
    const ids = (ss ?? []).map((s) => s.id);
    if (!ids.length) return [];
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from("participantes").select("sesion_id").in("sesion_id", ids),
      supabase.from("respuestas").select("sesion_id, acierto").in("sesion_id", ids),
    ]);
    return (ss ?? []).map((s) => {
      const alumnos = (ps ?? []).filter((p) => p.sesion_id === s.id).length;
      const bien = (rs ?? []).filter((r) => r.sesion_id === s.id && r.acierto).length;
      const posibles = alumnos * s.num_preguntas;
      return { ...s, alumnos, media: posibles ? Math.round((bien / posibles) * 100) : null };
    });
  });

export const datosSala = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: s } = await supabase.from("sesiones").select("*").eq("id", data.id).maybeSingle();
    if (!s) return null;
    const [{ data: qs }, { data: ps }, { data: rs }] = await Promise.all([
      supabase.from("preguntas").select("*").eq("sesion_id", s.id).order("orden"),
      supabase.from("participantes").select("id, apodo, demo, creado").eq("sesion_id", s.id).order("creado"),
      supabase.from("respuestas").select("participante_id, pregunta_id, entrada, respuesta, aciertos, acierto").eq("sesion_id", s.id),
    ]);
    return {
      sesion: s,
      preguntas: (qs ?? []).map((q) => {
        const cfg = configuracionPregunta(q.configuracion, { nivel: s.nivel as 1 | 2, compas: s.compas, figuras: s.figuras, ejercicio: s.ejercicio as TipoEjercicio, ppm: s.ppm, numCompases: s.num_compases });
        return { id: q.id, orden: q.orden, ronda: q.ronda, cfg, ej: ejercicioDe(cfg.ejercicio, q) };
      }),
      participantes: ps ?? [],
      respuestas: (rs ?? []).map((r) => ({ ...r, entrada: r.entrada as Entrada })),
    };
  });

export const avanzarSala = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), accion: z.enum(["empezar", "revelar", "siguiente", "terminar"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: s } = await supabase.from("sesiones").select("estado, pregunta_actual, num_preguntas").eq("id", data.id).single();
    if (!s) throw new Error("Clase no encontrada");
    let cambio: { estado: string; pregunta_actual?: number } | null = null;
    if (data.accion === "empezar" && s.estado === "espera") cambio = { estado: "pregunta", pregunta_actual: 0 };
    if (data.accion === "revelar" && s.estado === "pregunta") cambio = { estado: "revelada" };
    if (data.accion === "siguiente" && s.estado === "revelada" && s.pregunta_actual + 1 < s.num_preguntas) cambio = { estado: "pregunta", pregunta_actual: s.pregunta_actual + 1 };
    if (data.accion === "terminar" && s.estado !== "terminada") cambio = { estado: "terminada" };
    if (cambio) {
      const { error } = await supabase.from("sesiones").update(cambio).eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const anadirDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { count } = await supabase.from("participantes").select("id", { count: "exact", head: true }).eq("sesion_id", data.id).eq("demo", true);
    if (count) return { ok: true };
    const filas = APODOS_DEMO.map((apodo, i) => ({ sesion_id: data.id, apodo, demo: true, dispositivo: `demo-${i}-${crypto.randomUUID()}` }));
    const { error } = await supabase.from("participantes").insert(filas);
    if (error) throw new Error(error.message);
    const { error: marcaError } = await supabase.from("sesiones").update({ uso_demo: true }).eq("id", data.id);
    if (marcaError) throw new Error(marcaError.message);
    return { ok: true };
  });

export const responderDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      participanteId: z.string().uuid(),
      tiempoMs: z.number().int().min(0),
      entrada: z.discriminatedUnion("tipo", [
        z.object({ tipo: z.literal("dictado"), ids: z.array(z.string()).max(64) }),
        z.object({ tipo: z.literal("cual"), elegida: z.number().int() }),
        z.object({ tipo: z.literal("error"), tocado: z.number().int() }),
      ]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: s } = await supabase.from("sesiones").select("*").eq("id", data.id).single();
    if (!s || s.estado !== "pregunta") return { ok: false };
    const { data: q } = await supabase.from("preguntas").select("*").eq("sesion_id", s.id).eq("orden", s.pregunta_actual).single();
    if (!q) return { ok: false };
    const ej = ejercicioDe(s.ejercicio as TipoEjercicio, q);
    const entrada = data.entrada as Entrada;
    if (!entradaValida(ej, entrada)) return { ok: false };
    const c = corregirEntrada(ej, entrada);
    const { error } = await supabase.from("respuestas").insert({
      sesion_id: s.id,
      participante_id: data.participanteId,
      pregunta_id: q.id,
      entrada,
      respuesta: c.respuesta,
      aciertos: c.aciertos,
      equivalencias: c.equivalencias,
      acierto: c.acierto,
      tiempo_ms: data.tiempoMs,
    });
    if (error && error.code !== "23505") console.error(error);
    return { ok: true };
  });

export const borrarSesiones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid().optional(), soloDemo: z.boolean() }).refine((v) => v.soloDemo || !!v.id).parse(d))
  .handler(async ({ data, context }) => {
    const { data: n, error } = await context.supabase.rpc("borrar_clases", { ...(data.id ? { _id: data.id } : {}), _solo_demo: data.soloDemo });
    if (error) throw new Error("No se han podido borrar las clases");
    return { borradas: n };
  });

export const anadirRonda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => cfgSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: s } = await context.supabase.from("sesiones").select("estado, pregunta_actual, num_preguntas").eq("id", data.id).single();
    if (!s || !puedeAnadirRonda(s.estado, s.pregunta_actual, s.num_preguntas)) throw new Error("La ronda no ha terminado");
    if (!seleccionValida(data.figuras)) throw new Error("Selección de figuras no válida");
    const { id, numPreguntas, ...cfg } = data;
    const preguntas = Array.from({ length: numPreguntas }, () => {
      const ej = crearEjercicio(cfg);
      return { ritmo: ej.ritmo, opciones: ej.opciones ?? null, correcta: ej.correcta ?? null, suena: ej.suena ?? null, error_pulso: ej.errorPulso ?? null };
    });
    const { error } = await context.supabase.rpc("anadir_ronda", { _id: id, _cfg: cfg, _preguntas: preguntas });
    if (error) throw new Error("No se ha podido añadir la ronda");
    return { id };
  });
