import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Baldo } from "@/components/Baldo";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { Partitura } from "@/components/Partitura";
import { useReproductor } from "@/components/Reproduccion";
import { compas as getCompas, type Compas } from "@/musica/compases";
import { idDispositivo } from "@/practica/almacen";
import { busquedaDe } from "@/practica/busqueda";
import { datosRepaso, explicacionAlumno, type PreguntaRepaso, type VistaRepaso } from "@/ia/ia.functions";
import { figurasRepaso } from "@/clase/repaso";
import { normalizarCodigo } from "@/clase/sala";

export const Route = createFileRoute("/repaso/$codigo")({
  head: () => ({
    meta: [
      { title: "Tu repaso · Me suena" },
      { name: "description", content: "Repasa las preguntas de la clase, escucha la solución y practica lo que fallaste." },
      { property: "og:title", content: "Tu repaso · Me suena" },
      { property: "og:description", content: "Repasa las preguntas de la clase, escucha la solución y practica lo que fallaste." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Repaso,
});

function Repaso() {
  const codigo = normalizarCodigo(Route.useParams().codigo);
  const [dispositivo, setDispositivo] = useState<string | null>(null);
  useEffect(() => setDispositivo(idDispositivo()), []);
  const cargar = useServerFn(datosRepaso);
  const q = useQuery({ queryKey: ["repaso", codigo, dispositivo], queryFn: () => cargar({ data: { codigo, dispositivo: dispositivo! } }), enabled: !!dispositivo });
  const volver = <Link to="/">← Me suena</Link>;
  const v = q.data;

  if (!v) return <Pantalla><Cabecera titulo="Tu repaso" volver={volver} /><p className="text-muted-foreground">Cargando…</p></Pantalla>;
  if (v.estado !== "ok")
    return (
      <Pantalla>
        <Cabecera titulo="Tu repaso" volver={volver} />
        <section className="tarjeta flex flex-col items-center gap-4 py-8 text-center">
          <Baldo estado="espera" className="size-24 sm:size-24" />
          <p className="text-muted-foreground">
            {v.estado === "noexiste" && "No hay ninguna clase con este código."}
            {v.estado === "abierta" && "La clase sigue en marcha. El repaso estará aquí cuando termine."}
            {v.estado === "sinrespuestas" && "No tienes respuestas en esta clase desde este dispositivo, así que no hay nada que repasar."}
          </p>
          <Link to="/practicar" className="boton boton-primario px-8">Practicar</Link>
        </section>
      </Pantalla>
    );
  return <Contenido v={v} codigo={codigo} dispositivo={dispositivo!} volver={volver} />;
}

function useExplicacion(codigo: string, dispositivo: string, preguntaId: string | undefined, activo: boolean) {
  const pedir = useServerFn(explicacionAlumno);
  return useQuery({
    queryKey: ["explicacion", codigo, dispositivo, preguntaId ?? "todo"],
    queryFn: () => pedir({ data: { codigo, dispositivo, preguntaId } }).catch(() => ({ texto: null })),
    enabled: activo,
    staleTime: Infinity,
    retry: false,
  });
}

function Contenido({ v, codigo, dispositivo, volver }: { v: VistaRepaso; codigo: string; dispositivo: string; volver: React.ReactNode }) {
  const cfg = v.cfg!;
  const c = getCompas(cfg.compas);
  const total = v.preguntas!.length;
  const fallos = v.preguntas!.filter((p) => p.correccion && !p.correccion.acierto);
  const resumen = useExplicacion(codigo, dispositivo, undefined, fallos.length > 0);
  const [abierta, setAbierta] = useState<string | null>(null);
  const correcciones = v.preguntas!.map((p) => p.correccion).filter((x): x is NonNullable<typeof x> => !!x);
  const figuras = figurasRepaso(correcciones, cfg.compas, cfg.nivel, cfg.figuras);
  const busqueda = busquedaDe({ ...cfg, figuras, ppm: cfg.ppm, numCompases: cfg.numCompases === 1 ? 1 : 2 });

  return (
    <Pantalla>
      <Cabecera titulo="Tu repaso" volver={volver} />
      <section className="flex items-center gap-4">
        <Baldo estado={v.bien! >= Math.ceil(total * 0.8) ? "celebracion" : "neutro"} className="size-24 shrink-0 sm:size-24" />
        <div className="space-y-1">
          <p className="font-sans text-3xl font-bold tabular-nums">{v.bien} de {total}</p>
          <p className="text-muted-foreground">preguntas bien</p>
          {resumen.data?.texto && <p className="text-sm">{resumen.data.texto}</p>}
        </div>
      </section>
      <ul className="space-y-2">
        {v.preguntas!.map((p) => (
          <li key={p.id} className="tarjeta p-0">
            <button type="button" onClick={() => setAbierta(abierta === p.id ? null : p.id)} aria-expanded={abierta === p.id} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
              <span className={`size-3 rounded-full ${!p.correccion ? "bg-muted" : p.correccion.acierto ? "bg-acierto" : "bg-destructive"}`} aria-hidden />
              <span className="flex-1 font-medium">Ronda {p.ronda} · Pregunta {p.numero}</span>
              <span className="text-sm text-muted-foreground">{!p.correccion ? "Sin respuesta" : p.correccion.acierto ? "Bien" : "Fallada"}</span>
            </button>
            {abierta === p.id && <Detalle p={p} c={getCompas(p.cfg.compas)} ppm={p.cfg.ppm} n={p.cfg.numCompases} codigo={codigo} dispositivo={dispositivo} />}
          </li>
        ))}
      </ul>
      <Link to="/practicar/tanda" search={busqueda} className="boton boton-primario w-full">Practicar lo que fallé</Link>
    </Pantalla>
  );
}

function Detalle({ p, c, ppm, n, codigo, dispositivo }: { p: PreguntaRepaso; c: Compas; ppm: number; n: number; codigo: string; dispositivo: string }) {
  const r = useReproductor(c, ppm, n);
  const cor = p.correccion;
  const exp = useExplicacion(codigo, dispositivo, p.id, !!cor && !cor.acierto);
  if (!cor) return <p className="px-4 pb-4 text-sm text-muted-foreground">No respondiste esta pregunta.</p>;
  const estados = cor.aciertos.map((ok) => (ok ? null : ("fallo" as const)));
  return (
    <div className="space-y-3 px-4 pb-4">
      <Partitura compas={c} ids={cor.respuesta} numCompases={n} silabas={false} estados={estados} etiqueta="Tu respuesta" compacta />
      <Partitura compas={c} ids={cor.solucion} numCompases={n} silabas estados={estados} marca={r.marca} etiqueta="Solución" />
      <button type="button" onClick={() => (r.sonando ? r.detener() : r.tocar("sol", cor.solucion))} className="boton boton-secundario px-5">
        {r.sonando ? "■ Parar" : "▶ Oír la solución"}
      </button>
      {exp.data?.texto && <p className="text-sm">{exp.data.texto}</p>}
    </div>
  );
}
