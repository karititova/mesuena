import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { Baldo } from "@/components/Baldo";
import { Partitura } from "@/components/Partitura";
import { BotonPulso, Contador, useReproductor } from "@/components/Reproduccion";
import { compas as getCompas, type Compas } from "@/musica/compases";
import { expandirPulsos } from "@/musica/comprobador";
import { figura } from "@/musica/figuras";
import { silabaVisible } from "@/components/Paleta";
import type { Ejercicio } from "@/practica/ejercicios";
import { anadirDemo, avanzarSala, datosSala, responderDemo } from "@/clase/profe.functions";
import { erroresFrecuentes, mapaPulsos, pulsoDificil, respuestaDemo, resumenClase, tonoFallo, type FilaRespuesta } from "@/clase/agregados";
import { useCambiosSala } from "@/clase/useCambiosSala";

export const Route = createFileRoute("/_authenticated/profe/sala/$id")({
  head: () => ({
    meta: [
      { title: "Sala de clase · Me suena" },
      { name: "description", content: "Sala de la clase en directo: código, alumnos, preguntas y resultados por pulso." },
      { property: "og:title", content: "Sala de clase · Me suena" },
      { property: "og:description", content: "Sala de la clase en directo: código, alumnos, preguntas y resultados por pulso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Sala,
});

type Datos = NonNullable<Awaited<ReturnType<typeof datosSala>>>;

function Ancha({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl space-y-8 px-6 pb-16 pt-6">{children}</main>;
}

function Sala() {
  const { id } = Route.useParams();
  const cargar = useServerFn(datosSala);
  const q = useQuery({ queryKey: ["sala", id], queryFn: () => cargar({ data: { id } }), refetchInterval: 15000 });
  useCambiosSala(id, () => q.refetch());
  const avanzarFn = useServerFn(avanzarSala);
  const [ocupado, setOcupado] = useState(false);
  const avanzar = async (accion: "empezar" | "revelar" | "siguiente" | "terminar") => {
    setOcupado(true);
    try {
      await avanzarFn({ data: { id, accion } });
      await q.refetch();
    } finally {
      setOcupado(false);
    }
  };
  useDemo(q.data ?? null, () => q.refetch());

  if (q.isLoading) return <Ancha><p className="text-xl text-muted-foreground">Cargando…</p></Ancha>;
  if (!q.data) return <Ancha><p className="text-xl">No se encuentra esta clase.</p><Link to="/profe/clases" className="text-primary underline">Mis clases</Link></Ancha>;
  const d = q.data;
  const s = d.sesion;
  const c = getCompas(s.compas);

  return (
    <Ancha>
      <div className="flex items-center justify-between text-lg text-muted-foreground">
        <Link to="/profe/clases">← Mis clases</Link>
        <span>
          Código <strong className="font-sans font-bold tracking-widest text-foreground">{s.codigo}</strong> · {s.compas} · Nivel {s.nivel}
        </span>
      </div>
      {s.estado === "espera" && <Espera d={d} onEmpezar={() => avanzar("empezar")} ocupado={ocupado} />}
      {s.estado === "pregunta" && <Pregunta d={d} c={c} onRevelar={() => avanzar("revelar")} ocupado={ocupado} />}
      {s.estado === "revelada" && <Revelada d={d} c={c} onSeguir={() => avanzar(s.pregunta_actual + 1 >= s.num_preguntas ? "terminar" : "siguiente")} ocupado={ocupado} />}
      {s.estado === "terminada" && <Terminada d={d} />}
    </Ancha>
  );
}

function Espera({ d, onEmpezar, ocupado }: { d: Datos; onEmpezar: () => void; ocupado: boolean }) {
  const demo = useServerFn(anadirDemo);
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(`${window.location.origin}/unirse/${d.sesion.codigo}`), [d.sesion.codigo]);
  const hayDemo = d.participantes.some((p) => p.demo);
  return (
    <section className="relative grid gap-10 md:grid-cols-[1fr_auto]">
      <div className="space-y-6">
        <p className="text-2xl text-muted-foreground">Entra en <strong className="text-foreground">{url.replace(/^https?:\/\//, "").replace(/\/[A-Z]{4}$/, "")}</strong> con el código</p>
        <p className="font-sans text-[140px] leading-none font-bold tracking-[0.12em]" aria-label={`Código ${d.sesion.codigo.split("").join(" ")}`}>
          {d.sesion.codigo}
        </p>
        <div>
          <p className="mb-3 text-2xl font-semibold">{d.participantes.length} {d.participantes.length === 1 ? "alumno" : "alumnos"}</p>
          <ul className="flex flex-wrap gap-2">
            {d.participantes.map((p) => (
              <li key={p.id} className="pildora text-lg">{p.apodo}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={ocupado} onClick={onEmpezar} className="boton boton-primario px-10 text-xl">Empezar</button>
          {!hayDemo && (
            <button type="button" onClick={() => demo({ data: { id: d.sesion.id } })} className="boton boton-secundario px-6">Modo demo</button>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        {url && <div className="tarjeta p-4"><QRCodeSVG value={url} size={260} bgColor="transparent" fgColor="currentColor" /></div>}
        <Baldo estado="espera" className="size-14 sm:size-14 self-end" />
      </div>
    </section>
  );
}

function Reproducir({ c, ppm, n, ids }: { c: Compas; ppm: number; n: number; ids: string[] }) {
  const r = useReproductor(c, ppm, n);
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => (r.sonando ? r.detener() : r.tocar("x", ids))} className="boton boton-secundario px-6 text-lg">
        {r.sonando ? "■ Parar" : "▶ Reproducir aquí"}
      </button>
      <BotonPulso activo={r.conPulso} onChange={r.setConPulso} />
      <Contador c={c} pulso={r.sonando ? r.pulso : null} />
    </div>
  );
}

const actualDe = (d: Datos) => d.preguntas.find((p) => p.orden === d.sesion.pregunta_actual)!;

function Pregunta({ d, c, onRevelar, ocupado }: { d: Datos; c: Compas; onRevelar: () => void; ocupado: boolean }) {
  const p = actualDe(d);
  const respondidas = d.respuestas.filter((r) => r.pregunta_id === p.id).length;
  const suena = p.ej.tipo === "error" ? p.ej.suena! : p.ej.ritmo;
  return (
    <section className="space-y-8">
      <h1 className="font-display text-5xl font-bold">Pregunta {p.orden + 1} de {d.sesion.num_preguntas}</h1>
      {p.ej.tipo !== "dictado" && (
        <div className="tarjeta"><Partitura compas={c} ids={p.ej.ritmo} numCompases={d.sesion.num_compases} silabas={false} etiqueta="Partitura de la pregunta" /></div>
      )}
      <Reproducir c={c} ppm={d.sesion.ppm} n={d.sesion.num_compases} ids={suena} />
      <p className="font-sans text-7xl font-bold tabular-nums">
        {respondidas} <span className="text-4xl font-semibold text-muted-foreground">de {d.participantes.length} han respondido</span>
      </p>
      <button type="button" disabled={ocupado} onClick={onRevelar} className="boton boton-primario px-10 text-xl">Revelar</button>
    </section>
  );
}

function MapaPulsos({ pcts, c }: { pcts: number[]; c: Compas }) {
  return (
    <div className="flex flex-wrap items-end gap-2" role="list" aria-label="Fallos por pulso">
      {pcts.map((pct, i) => (
        <div key={i} role="listitem" className={i > 0 && i % c.pulsos === 0 ? "ml-6" : ""}>
          <div
            className="flex size-20 items-center justify-center rounded-full font-sans text-2xl font-bold text-primary-foreground"
            style={{ background: `color-mix(in oklab, var(--destructive) ${Math.round(tonoFallo(pct) * 100)}%, var(--acierto))` }}
          >
            {pct} %
          </div>
          <p className="mt-1 text-center text-sm text-muted-foreground">pulso {i + 1}</p>
        </div>
      ))}
    </div>
  );
}

function Revelada({ d, c, onSeguir, ocupado }: { d: Datos; c: Compas; onSeguir: () => void; ocupado: boolean }) {
  const p = actualDe(d);
  const rs = d.respuestas.filter((r) => r.pregunta_id === p.id) as FilaRespuesta[];
  const correcta = p.ej.tipo === "error" ? p.ej.suena! : p.ej.ritmo;
  const total = expandirPulsos(correcta).length;
  const ultima = p.orden + 1 >= d.sesion.num_preguntas;
  const errores = erroresFrecuentes(rs);
  return (
    <section className="space-y-8">
      <h1 className="font-display text-5xl font-bold">Pregunta {p.orden + 1} de {d.sesion.num_preguntas}</h1>
      <div className="tarjeta"><Partitura compas={c} ids={correcta} numCompases={d.sesion.num_compases} silabas etiqueta="Solución" /></div>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Fallos por pulso <span className="text-lg font-normal text-muted-foreground">· {rs.length} respuestas</span></h2>
        <MapaPulsos pcts={mapaPulsos(rs, total)} c={c} />
      </div>
      {errores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Respuestas equivocadas más repetidas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {errores.map((g, i) => (
              <div key={i} className="tarjeta space-y-2">
                <p className="text-xl font-semibold">{g.veces} {g.veces === 1 ? "alumno" : "alumnos"}</p>
                <Partitura
                  compas={c}
                  ids={g.muestra.entrada.tipo === "error" ? p.ej.ritmo : g.muestra.respuesta}
                  numCompases={d.sesion.num_compases}
                  silabas={false}
                  compacta
                  estados={g.muestra.entrada.tipo === "error" ? undefined : g.muestra.aciertos.map((ok) => (ok ? null : "fallo"))}
                  seleccionado={g.muestra.entrada.tipo === "error" ? g.muestra.entrada.tocado : null}
                  etiqueta="Respuesta equivocada"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <button type="button" disabled={ocupado} onClick={onSeguir} className="boton boton-primario px-10 text-xl">{ultima ? "Terminar" : "Siguiente"}</button>
    </section>
  );
}

function Terminada({ d }: { d: Datos }) {
  const navigate = useNavigate();
  const r = resumenClase(d.preguntas, d.participantes, d.respuestas as FilaRespuesta[]);
  const nombre = (id: string) => `${figura(id).nombre.toLowerCase()} (${silabaVisible(figura(id).silaba)})`;
  return (
    <section className="space-y-8">
      <h1 className="font-display text-5xl font-bold">Resumen de la clase</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="tarjeta">
          <p className="text-muted-foreground">Aciertos medios</p>
          <p className="font-sans text-6xl font-bold tabular-nums">{r.media} %</p>
        </div>
        <div className="tarjeta">
          <p className="text-muted-foreground">Pregunta más fallada</p>
          <p className="font-sans text-4xl font-bold">{r.masFallada ? `La ${r.masFallada.orden + 1}ª` : "Ninguna"}</p>
          {r.masFallada && <p className="text-muted-foreground">La falló el {r.masFallada.pct} %</p>}
        </div>
        <div className="tarjeta">
          <p className="text-muted-foreground">Lo que más se confunde</p>
          <p className="text-xl font-semibold">{r.confusion ? `${nombre(r.confusion.esperada)} con ${nombre(r.confusion.puesta)}` : "No hay un par claro"}</p>
          {r.confusion && <p className="text-muted-foreground">{r.confusion.veces} veces</p>}
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Alumnos</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {r.alumnos.map((a, i) => (
            <li key={i} className="tarjeta flex items-center justify-between py-3 text-lg">
              <span>{a.apodo}</span>
              <span className="font-sans font-bold tabular-nums">{a.aciertos} de {d.preguntas.length}</span>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={() => navigate({ to: "/profe/clases" })} className="boton boton-primario px-10 text-xl">Cerrar</button>
    </section>
  );
}

/** Modo demo: cada alumno simulado responde a los pocos segundos de abrirse la pregunta. */
function useDemo(d: Datos | null, alResponder: () => void) {
  const responder = useServerFn(responderDemo);
  const programadas = useRef(new Set<string>());
  const preguntaId = d && d.sesion.estado === "pregunta" ? actualDe(d)?.id : null;
  useEffect(() => {
    if (!d || !preguntaId) return;
    const p = actualDe(d);
    const ej: Ejercicio = p.ej;
    const dificil = pulsoDificil(ej);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const al of d.participantes.filter((x) => x.demo)) {
      const clave = `${p.id}:${al.id}`;
      if (programadas.current.has(clave) || d.respuestas.some((r) => r.pregunta_id === p.id && r.participante_id === al.id)) continue;
      programadas.current.add(clave);
      const espera = 2000 + Math.random() * 8000;
      timers.push(
        setTimeout(() => {
          responder({ data: { id: d.sesion.id, participanteId: al.id, tiempoMs: Math.round(espera), entrada: respuestaDemo(ej, dificil, d.sesion.figuras) } }).then(alResponder);
        }, espera),
      );
    }
    return () => timers.forEach(clearTimeout);
    // Se reprograma al cambiar de pregunta o al entrar alumnos demo.
  }, [preguntaId, d?.participantes.length]); // eslint-disable-line react-hooks/exhaustive-deps
}
