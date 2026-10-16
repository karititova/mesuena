import { useState } from "react";
import { cn } from "@/lib/utils";
import { Marcadores } from "@/components/Marcadores";
import { Paleta } from "@/components/Paleta";
import { Partitura } from "@/components/Partitura";
import { BotonPulso, Contador, useReproductor } from "@/components/Reproduccion";
import type { Compas } from "@/musica/compases";
import { figura } from "@/musica/figuras";
import { corregirCual, corregirDictado, corregirError, type Config, type Correccion, type Ejercicio } from "@/practica/ejercicios";

interface Props {
  ej: Ejercicio;
  cfg: Config;
  compas: Compas;
  correccion: Correccion | null;
  onCorregir: (c: Correccion) => void;
}

const estadosDe = (c: Correccion | null) => c?.aciertos.map((ok) => (ok ? ("ok" as const) : ("fallo" as const)));

function InterruptorSilabas({ valor, onChange }: { valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
      <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-primary" />
      Sílabas
    </label>
  );
}

export function EjercicioVista(p: Props) {
  if (p.ej.tipo === "cual") return <CualSuena {...p} />;
  if (p.ej.tipo === "error") return <EncuentraError {...p} />;
  return <Dictado {...p} />;
}

function CualSuena({ ej, cfg, compas: c, correccion, onCorregir }: Props) {
  const r = useReproductor(c, cfg.ppm, cfg.numCompases);
  const [silabas, setSilabas] = useState(false);
  const [elegida, setElegida] = useState<number | null>(null);
  const elegir = (i: number) => {
    r.detener();
    setElegida(i);
    onCorregir(corregirCual(i, ej));
  };
  return (
    <section className="tarjeta space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[24px] leading-none font-semibold">¿Cuál suena así?</h2>
        <InterruptorSilabas valor={silabas} onChange={setSilabas} />
      </div>
      <Partitura compas={c} ids={ej.ritmo} numCompases={cfg.numCompases} silabas={silabas} estados={estadosDe(correccion)} etiqueta="Partitura" />
      <Contador c={c} pulso={r.sonando ? r.pulso : null} />
      <div className="grid grid-cols-3 gap-2">
        {ej.opciones!.map((ids, i) => {
          const revelado = correccion !== null;
          const esCorrecta = i === ej.correcta;
          return (
            <div
              key={i}
              className={cn(
                "space-y-2 rounded-[16px] border-2 p-2",
                revelado && esCorrecta ? "border-primary bg-verde-claro" : revelado && elegida === i ? "border-destructive bg-error-claro" : "border-marron-claro",
              )}
            >
              <button
                type="button"
                onClick={() => (r.sonando === `op${i}` ? r.detener() : r.tocar(`op${i}`, ids))}
                disabled={r.sonando !== null && r.sonando !== `op${i}`}
                className="boton boton-primario w-full font-sans text-2xl font-bold"
                aria-label={`Escuchar el ${i + 1}`}
              >
                {r.sonando === `op${i}` ? "■" : `▶ ${i + 1}`}
              </button>
              <button type="button" disabled={revelado} onClick={() => elegir(i)} className="boton boton-secundario w-full">
                {revelado && esCorrecta ? "Era este" : "Este"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <BotonPulso activo={r.conPulso} onChange={r.setConPulso} />
      </div>
    </section>
  );
}

function Dictado({ ej, cfg, compas: c, correccion, onCorregir }: Props) {
  const r = useReproductor(c, cfg.ppm, cfg.numCompases);
  const [respuesta, setRespuesta] = useState<string[]>([]);
  const total = c.pulsos * cfg.numCompases;
  const puestos = respuesta.reduce((a, id) => a + figura(id).pulsos, 0);
  const bloqueado = correccion !== null;
  return (
    <>
      <section className="tarjeta space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={() => (r.sonando === "ritmo" ? r.detener() : r.tocar("ritmo", ej.ritmo))}
            disabled={r.sonando === "resp"}
            className="boton boton-primario text-lg"
          >
            {r.sonando === "ritmo" ? "■ Parar" : "▶ Escuchar"}
          </button>
          <BotonPulso activo={r.conPulso} onChange={r.setConPulso} />
        </div>
        <Contador c={c} pulso={r.sonando ? r.pulso : null} />
        <Marcadores compas={c} ids={ej.ritmo} numCompases={cfg.numCompases} progreso={r.progreso("ritmo")} />
      </section>

      <section className="tarjeta space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[24px] leading-none font-semibold">Tu respuesta</h2>
          <span className="font-sans text-lg font-bold tabular-nums text-muted-foreground">
            {puestos}/{total}
          </span>
        </div>
        <Partitura
          compas={c}
          ids={respuesta}
          numCompases={cfg.numCompases}
          silabas={false}
          estados={estadosDe(correccion)}
          progreso={r.progreso("resp")}
          etiqueta="Partitura de tu respuesta"
        />
        {!bloqueado && (
          <>
            <Paleta ids={cfg.figuras} compas={c} respuesta={respuesta} numCompases={cfg.numCompases} onAñadir={(id) => setRespuesta([...respuesta, id])} />
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRespuesta(respuesta.slice(0, -1))} disabled={!respuesta.length} className="boton boton-secundario">
                Deshacer
              </button>
              <button type="button" onClick={() => setRespuesta([])} disabled={!respuesta.length} className="boton boton-secundario">
                Borrar
              </button>
              <button
                type="button"
                onClick={() => (r.sonando === "resp" ? r.detener() : r.tocar("resp", respuesta))}
                disabled={!respuesta.length || r.sonando === "ritmo"}
                className="boton boton-secundario"
              >
                {r.sonando === "resp" ? "■ Parar" : "Oír mi respuesta"}
              </button>
              <button
                type="button"
                onClick={() => {
                  r.detener();
                  onCorregir(corregirDictado(respuesta, ej));
                }}
                disabled={puestos < total}
                className="boton boton-primario"
              >
                Comprobar
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}

function EncuentraError({ ej, cfg, compas: c, correccion, onCorregir }: Props) {
  const r = useReproductor(c, cfg.ppm, cfg.numCompases);
  const [silabas, setSilabas] = useState(false);
  const [tocado, setTocado] = useState<number | null>(null);
  const estados = correccion
    ? correccion.aciertos.map((ok, i) => (i === ej.errorPulso ? "ok" : !ok ? "fallo" : null) as "ok" | "fallo" | null)
    : undefined;
  return (
    <section className="tarjeta space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[24px] leading-none font-semibold">¿Dónde no coincide?</h2>
        <InterruptorSilabas valor={silabas} onChange={setSilabas} />
      </div>
      <Partitura compas={c} ids={ej.ritmo} numCompases={cfg.numCompases} silabas={silabas} etiqueta="Partitura escrita" />
      <Marcadores
        compas={c}
        ids={ej.ritmo}
        numCompases={cfg.numCompases}
        estados={estados}
        seleccionado={tocado}
        onTocar={correccion ? undefined : setTocado}
      />
      <Contador c={c} pulso={r.sonando ? r.pulso : null} />
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button type="button" onClick={() => (r.sonando ? r.detener() : r.tocar("suena", ej.suena!))} className="boton boton-secundario text-lg">
          {r.sonando ? "■ Parar" : "▶ Escuchar"}
        </button>
        <BotonPulso activo={r.conPulso} onChange={r.setConPulso} />
      </div>
      {!correccion && (
        <button
          type="button"
          disabled={tocado === null}
          onClick={() => {
            r.detener();
            onCorregir(corregirError(tocado!, ej));
          }}
          className="boton boton-primario w-full"
        >
          {tocado === null ? "Toca el pulso que no coincide" : `Comprobar pulso ${tocado + 1}`}
        </button>
      )}
    </section>
  );
}
