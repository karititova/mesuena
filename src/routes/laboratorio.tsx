import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Baldo, type EstadoBaldo } from "@/components/Baldo";
import { MiniFigura, Partitura } from "@/components/Partitura";
import { Segmentado } from "@/components/Segmentado";
import { COMPASES, TEMPOS, cabe, compas as getCompas } from "@/musica/compases";
import { comprobar, type ResultadoPulso } from "@/musica/comprobador";
import { figura, figurasDisponibles, type Nivel } from "@/musica/figuras";
import { generarRitmo } from "@/musica/generador";
import { iniciarAudio, parar, reproducir } from "@/audio/motor";

export const Route = createFileRoute("/laboratorio")({
  head: () => ({
    meta: [
      { title: "Laboratorio rítmico · Me suena" },
      { name: "description", content: "Genera ritmos, escúchalos a tempo y practica montándolos con figuras." },
      { property: "og:title", content: "Laboratorio rítmico · Me suena" },
      { property: "og:description", content: "Genera ritmos, escúchalos a tempo y practica montándolos con figuras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Laboratorio,
});

const AVISO_KEY = "me-suena-aviso-silencio";
const AVISO_DURACION_KEY = "me-suena-aviso-duracion";

function Laboratorio() {
  const [compasId, setCompasId] = useState("2/4");
  const [nivel, setNivel] = useState<Nivel>(1);
  const [numCompases, setNumCompases] = useState(1);
  const [ppm, setPpm] = useState<number>(60);
  const [silabas, setSilabas] = useState(false);
  const [pulso, setPulso] = useState<number | null>(null);
  const [ritmo, setRitmo] = useState<string[]>([]);
  const [respuesta, setRespuesta] = useState<string[]>([]);
  const [resultado, setResultado] = useState<ResultadoPulso[] | null>(null);
  const [sonando, setSonando] = useState<null | "ritmo" | "respuesta">(null);
  const [aviso, setAviso] = useState(false);
  const [avisoDuracion, setAvisoDuracion] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(AVISO_DURACION_KEY)) {
      localStorage.setItem(AVISO_DURACION_KEY, "1");
      setAvisoDuracion(true);
    }
  }, []);

  const c = getCompas(compasId);
  const paleta = figurasDisponibles(c.tipo, nivel);
  const totalPulsos = c.pulsos * numCompases;
  const pulsosRespuesta = respuesta.reduce((a, id) => a + figura(id).pulsos, 0);

  const generar = () => {
    parar();
    setSonando(null);
    setRitmo(generarRitmo(c, nivel, numCompases));
    setRespuesta([]);
    setResultado(null);
  };

  useEffect(generar, [compasId, nivel, numCompases]); // eslint-disable-line react-hooks/exhaustive-deps

  const tocar = async (cual: "ritmo" | "respuesta") => {
    const { audioSession } = await iniciarAudio();
    if (!audioSession && !localStorage.getItem(AVISO_KEY)) {
      localStorage.setItem(AVISO_KEY, "1");
      setAviso(true);
    }
    setSonando(cual);
    setPulso(null);
    await reproducir(
      c,
      cual === "ritmo" ? ritmo : respuesta,
      ppm,
      numCompases,
      () => {
        setSonando(null);
        setPulso(null);
      },
      setPulso,
    );
  };

  const detener = () => {
    parar();
    setSonando(null);
    setPulso(null);
  };

  const estados = useMemo(() => resultado?.map((r) => (r.correcto ? ("ok" as const) : ("fallo" as const))), [resultado]);
  const aciertos = resultado?.filter((r) => r.correcto).length ?? 0;
  const baldo: EstadoBaldo = !resultado
    ? sonando
      ? "espera"
      : "neutro"
    : aciertos === resultado.length
      ? "acierto"
      : "fallo";

  // Durante la entrada se encienden los puntos del primer compás; luego siguen el pulso en curso.
  const marca = pulso === null ? null : pulso < 0 ? pulso + c.pulsos : null;
  const progreso = pulso !== null && pulso >= 0 ? pulso : null;

  const cambiarRespuesta = (r: string[]) => {
    setRespuesta(r);
    setResultado(null);
  };

  return (
    <main className="mx-auto max-w-3xl overflow-x-hidden space-y-5 px-4 pb-16 pt-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Me suena
          </Link>
          <h1 className="font-display text-[36px] leading-tight font-bold text-foreground">Laboratorio</h1>
        </div>
        <div className="flex items-center gap-2">
          {avisoDuracion && (
            <p role="status" className="max-w-[16rem] text-right text-xs text-muted-foreground">
              Las notas largas se ven: la barra se estira. El silencio queda vacío
            </p>
          )}
          <Baldo estado="neutro" className="size-20 shrink-0" />
        </div>
      </header>

      <section className="tarjeta space-y-4">
        <Segmentado etiqueta="Compás" opciones={COMPASES.map((x) => ({ valor: x.id, texto: x.id }))} valor={compasId} onChange={setCompasId} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Segmentado etiqueta="Nivel" opciones={[{ valor: 1 as Nivel, texto: "1" }, { valor: 2 as Nivel, texto: "2" }]} valor={nivel} onChange={setNivel} />
          <Segmentado etiqueta="Compases" opciones={[{ valor: 1, texto: "1" }, { valor: 2, texto: "2" }]} valor={numCompases} onChange={setNumCompases} />
          <Segmentado etiqueta="Tempo" opciones={TEMPOS.map((t) => ({ valor: t.ppm as number, texto: t.nombre }))} valor={ppm} onChange={setPpm} />
        </div>
        <button type="button" onClick={generar} className="boton boton-primario w-full">
          Generar ritmo
        </button>
      </section>

      {aviso && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-[12px] bg-accent px-4 py-3 text-sm text-accent-foreground">
          <span>Si no oyes nada, quita el modo silencio del móvil.</span>
          <button type="button" onClick={() => setAviso(false)} className="font-semibold" aria-label="Cerrar aviso">
            ✕
          </button>
        </div>
      )}

      <section className="tarjeta space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[26px] leading-none font-semibold">Ritmo</h2>
          <label className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={silabas} onChange={(e) => setSilabas(e.target.checked)} className="size-5 accent-primary" />
            Sílabas
          </label>
        </div>
        {ritmo.length > 0 && (
          <Partitura
            compas={c}
            ids={ritmo}
            numCompases={numCompases}
            silabas={silabas}
            pulsoActivo={sonando === "ritmo" ? marca : null}
            progreso={sonando === "ritmo" ? progreso : null}
            etiqueta="Partitura del ritmo"
          />
        )}
        <Entrada c={c} pulso={sonando ? pulso : null} />
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <button type="button" onClick={() => tocar("ritmo")} disabled={sonando !== null} className="boton boton-primario whitespace-nowrap px-3">
            ▶ Reproducir
          </button>
          <button type="button" onClick={detener} className="boton boton-secundario whitespace-nowrap px-4">
            ■ Parar
          </button>
        </div>
      </section>

      <section className="tarjeta space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[26px] leading-none font-semibold">Tu respuesta</h2>
          <span className="text-lg font-bold text-muted-foreground">
            {pulsosRespuesta}/{totalPulsos}
          </span>
        </div>
        <Partitura compas={c} ids={respuesta} numCompases={numCompases} silabas={silabas} estados={estados} pulsoActivo={sonando === "respuesta" ? marca : null} progreso={sonando === "respuesta" ? progreso : null} etiqueta="Partitura de tu respuesta" />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {paleta.map((f) => {
            const ok = cabe(f.id, respuesta, c, numCompases);
            return (
              <button
                key={f.id}
                type="button"
                disabled={!ok}
                onClick={() => cambiarRespuesta([...respuesta, f.id])}
                aria-label={`Añadir ${f.nombre}`}
                className="boton-paleta"
              >
                <MiniFigura id={f.id} compas={c} desactivada={!ok} />
                <span className="text-xs font-semibold text-muted-foreground">{f.silaba === "(silencio)" ? "silencio" : f.silaba}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => cambiarRespuesta(respuesta.slice(0, -1))} disabled={!respuesta.length} className="boton boton-secundario">
            Deshacer
          </button>
          <button type="button" onClick={() => cambiarRespuesta([])} disabled={!respuesta.length} className="boton boton-secundario">
            Borrar
          </button>
          <button type="button" onClick={() => setResultado(comprobar(respuesta, ritmo))} disabled={!respuesta.length} className="boton boton-primario">
            Comprobar
          </button>
          <button type="button" onClick={() => tocar("respuesta")} disabled={!respuesta.length || sonando !== null} className="boton boton-secundario">
            Oír mi respuesta
          </button>
        </div>
      </section>

      {resultado && (
        <section className="tarjeta space-y-3" aria-live="polite">
          <div className="flex items-center gap-4">
            <Baldo estado={baldo} className="size-24" />
            <div>
              <p className="font-sans text-4xl font-bold tabular-nums">
                {aciertos}/{resultado.length}
              </p>
              <p className="text-sm text-muted-foreground">{aciertos === resultado.length ? "¡Todos los pulsos bien!" : "Revisa los pulsos marcados."}</p>
            </div>
          </div>
          <ol className="space-y-1.5">
            {resultado.map((r) => (
              <li key={r.pulso} className={r.correcto ? "pulso pulso-ok" : "pulso pulso-fallo"}>
                <span className="font-semibold">Pulso {r.pulso + 1}</span>
                <span className="text-right">
                  {r.equivalencia ? (
                    <>Suena igual: aquí iba {figura(r.esperado.figuraId).nombre.toLowerCase()}</>
                  ) : r.correcto ? (
                    describir(r.esperado)
                  ) : (
                    <>
                      Pusiste <b>{r.respuesta ? describir(r.respuesta) : "nada"}</b> · iba <b>{describir(r.esperado)}</b>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}

function describir(p: { figuraId: string; indice: number }) {
  const n = figura(p.figuraId).nombre.toLowerCase();
  return p.indice === 0 ? n : `${n} (continuación)`;
}

function Entrada({ c, pulso }: { c: { pulsos: number }; pulso: number | null }) {
  const enEntrada = pulso !== null && pulso < 0;
  const actual = pulso === null ? -1 : (((pulso % c.pulsos) + c.pulsos) % c.pulsos);
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 text-sm text-muted-foreground" aria-live="polite">
      <span>{pulso !== null && !enEntrada ? "Ahora el ritmo" : "Entrada: 1 compás de clic y después el ritmo"}</span>
      {pulso !== null && (
        <span className="font-sans text-[28px] leading-none font-bold tabular-nums">
          {Array.from({ length: c.pulsos }, (_, i) => (
            <span key={i} className={i === actual ? "text-primary" : "text-muted-foreground"}>
              {i > 0 && " · "}
              {i + 1}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
