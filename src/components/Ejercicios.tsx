import { useState, type ReactNode } from "react";
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
  /** Resultado que se integra al final del bloque, bajo la respuesta. */
  resultado?: ReactNode;
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

/** Durante la entrada, el contador ocupa el sitio de los marcadores. */
function ZonaPulsos({ c, pulso, children }: { c: Compas; pulso: number | null; children: ReactNode }) {
  return pulso !== null && pulso < 0 ? <div className="flex h-12 items-center justify-center"><Contador c={c} pulso={pulso} /></div> : <>{children}</>;
}

function CualSuena({ ej, cfg, compas: c, correccion, onCorregir, resultado }: Props) {
  const r = useReproductor(c, cfg.ppm, cfg.numCompases);
  const [silabas, setSilabas] = useState(false);
  const [elegida, setElegida] = useState<number | null>(null);
  const revelado = correccion !== null;
  return (
    <section className="tarjeta space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[24px] leading-none font-semibold">¿Cuál suena así?</h2>
        <InterruptorSilabas valor={silabas} onChange={setSilabas} />
      </div>
      <Partitura compas={c} ids={ej.ritmo} numCompases={cfg.numCompases} silabas={silabas} estados={estadosDe(correccion)} etiqueta="Partitura" />
      <div className="min-h-10"><Contador c={c} pulso={r.sonando ? r.pulso : null} /></div>
      <div className="space-y-2" role="radiogroup" aria-label="Opciones">
        {ej.opciones!.map((ids, i) => {
          const esCorrecta = i === ej.correcta;
          const marcada = elegida === i;
          const elegir = () => !revelado && setElegida(i);
          return (
            <div
              key={i}
              role="radio"
              aria-checked={marcada}
              tabIndex={revelado ? -1 : 0}
              onClick={elegir}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), elegir())}
              className={cn(
                "flex min-h-16 cursor-pointer items-center gap-3 rounded-[16px] border-2 bg-card p-2 pr-4",
                revelado && esCorrecta
                  ? "border-acierto bg-verde-claro"
                  : revelado && marcada
                    ? "border-destructive bg-error-claro"
                    : marcada
                      ? "border-primary"
                      : "border-marron-claro",
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (r.sonando === `op${i}`) r.detener();
                  else r.tocar(`op${i}`, ids);
                }}
                disabled={r.sonando !== null && r.sonando !== `op${i}`}
                className="boton boton-secundario min-h-12 px-4"
                aria-label={`Escuchar opción ${i + 1}`}
              >
                {r.sonando === `op${i}` ? "■" : "▶"}
              </button>
              <span className="flex-1 font-semibold">Opción {i + 1}</span>
              {revelado && esCorrecta && <span className="text-sm text-muted-foreground">Era esta</span>}
              <span
                aria-hidden
                className={cn(
                  "flex size-6 items-center justify-center rounded-[6px] border-2 text-sm font-bold",
                  marcada ? "border-primary bg-primary text-primary-foreground" : "border-marron-claro",
                )}
              >
                {marcada && "✓"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        {!revelado ? (
          <button
            type="button"
            disabled={elegida === null}
            onClick={() => {
              r.detener();
              onCorregir(corregirCual(elegida!, ej));
            }}
            className="boton boton-primario"
          >
            Comprobar
          </button>
        ) : (
          <span />
        )}
        <BotonPulso activo={r.conPulso} onChange={r.setConPulso} />
      </div>
      {resultado}
    </section>
  );
}

function Dictado({ ej, cfg, compas: c, correccion, onCorregir, resultado }: Props) {
  const r = useReproductor(c, cfg.ppm, cfg.numCompases);
  const [respuesta, setRespuesta] = useState<string[]>([]);
  const total = c.pulsos * cfg.numCompases;
  const puestos = respuesta.reduce((a, id) => a + figura(id).pulsos, 0);
  const bloqueado = correccion !== null;
  return (
    <section className="tarjeta divide-y divide-marron-claro p-3 [&>*]:py-2.5 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
      <ZonaPulsos c={c} pulso={r.sonando === "ritmo" ? r.pulso : null}>
        <Marcadores compas={c} ids={ej.ritmo} numCompases={cfg.numCompases} progreso={r.progreso("ritmo")} />
      </ZonaPulsos>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => (r.sonando === "ritmo" ? r.detener() : r.tocar("ritmo", ej.ritmo))}
          disabled={r.sonando === "resp"}
          className="boton boton-primario min-h-11 flex-1"
        >
          {r.sonando === "ritmo" ? "■ Parar" : "▶ Escuchar"}
        </button>
        <BotonPulso activo={r.conPulso} onChange={r.setConPulso} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Tu respuesta</span>
          <span className="font-sans font-bold tabular-nums text-muted-foreground">
            {puestos}/{total}
          </span>
        </div>
        {r.sonando === "resp" && r.pulso !== null && r.pulso < 0 && <Contador c={c} pulso={r.pulso} />}
        <Partitura
          compas={c}
          ids={respuesta}
          numCompases={cfg.numCompases}
          silabas={false}
          compacta
          estados={estadosDe(correccion)}
          progreso={r.progreso("resp")}
          etiqueta="Partitura de tu respuesta"
        />
      </div>
      {!bloqueado && (
        <>
          <Paleta ids={cfg.figuras} compas={c} respuesta={respuesta} numCompases={cfg.numCompases} onAñadir={(id) => setRespuesta([...respuesta, id])} />
          <div className="grid grid-cols-4 gap-1.5">
            <button type="button" onClick={() => setRespuesta(respuesta.slice(0, -1))} disabled={!respuesta.length} className="boton boton-secundario min-h-11 px-1 text-sm">
              Deshacer
            </button>
            <button type="button" onClick={() => setRespuesta([])} disabled={!respuesta.length} className="boton boton-secundario min-h-11 px-1 text-sm">
              Borrar
            </button>
            <button
              type="button"
              onClick={() => (r.sonando === "resp" ? r.detener() : r.tocar("resp", respuesta))}
              disabled={!respuesta.length || r.sonando === "ritmo"}
              className="boton boton-secundario min-h-11 px-1 text-sm leading-tight"
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
              className="boton boton-primario min-h-11 px-1 text-sm"
            >
              Comprobar
            </button>
          </div>
        </>
      )}
      {resultado}
    </section>
  );
}

function EncuentraError({ ej, cfg, compas: c, correccion, onCorregir, resultado }: Props) {
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
      <p className="text-sm text-muted-foreground">Toca en la partitura el pulso que suena distinto.</p>
      <Partitura
        compas={c}
        ids={ej.ritmo}
        numCompases={cfg.numCompases}
        silabas={silabas}
        estados={estados}
        seleccionado={correccion ? null : tocado}
        onTocarPulso={correccion ? undefined : setTocado}
        etiqueta="Partitura escrita"
      />
      <div className="min-h-10"><Contador c={c} pulso={r.sonando ? r.pulso : null} /></div>
      <div className="flex gap-2">
        <button type="button" onClick={() => (r.sonando ? r.detener() : r.tocar("suena", ej.suena!))} className="boton boton-secundario flex-1 text-lg">
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
          Comprobar
        </button>
      )}
      {resultado}
    </section>
  );
}
