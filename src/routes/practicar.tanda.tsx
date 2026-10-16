import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Baldo } from "@/components/Baldo";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { EjercicioVista } from "@/components/Ejercicios";
import { ResultadoEjercicio } from "@/components/ResultadoEjercicio";
import { compas as getCompas } from "@/musica/compases";
import { guardarTanda } from "@/practica/almacen";
import { busquedaDe, configDe, leerBusqueda } from "@/practica/busqueda";
import {
  aciertosTanda,
  baldoResumen,
  crearEjercicio,
  EJERCICIOS,
  pulsosMasFallados,
  TANDA,
  type Config,
  type Correccion,
  type Ejercicio,
} from "@/practica/ejercicios";

export const Route = createFileRoute("/practicar/tanda")({
  validateSearch: leerBusqueda,
  head: () => ({
    meta: [
      { title: "Tanda de práctica · Me suena" },
      { name: "description", content: "Cinco ejercicios de ritmo seguidos, con corrección pulso a pulso." },
      { property: "og:title", content: "Tanda de práctica · Me suena" },
      { property: "og:description", content: "Cinco ejercicios de ritmo seguidos, con corrección pulso a pulso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tanda,
});

const nuevaTanda = (cfg: Config) => Array.from({ length: TANDA }, () => crearEjercicio(cfg));

function Tanda() {
  const cfg = configDe(Route.useSearch());
  if (!cfg) {
    return (
      <Pantalla>
        <Cabecera titulo="Falta la configuración" volver={<Link to="/practicar">← Practicar</Link>} />
        <Link to="/practicar" className="boton boton-primario w-full">
          Empezar de nuevo
        </Link>
      </Pantalla>
    );
  }
  return <TandaEn cfg={cfg} />;
}

function TandaEn({ cfg }: { cfg: Config }) {
  const c = getCompas(cfg.compas);
  const clave = JSON.stringify(cfg);
  const [ejercicios, setEjercicios] = useState<Ejercicio[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [correcciones, setCorrecciones] = useState<Correccion[]>([]);
  const [vuelta, setVuelta] = useState(0); // fuerza estado limpio en cada ejercicio

  const empezar = (ejs: Ejercicio[]) => {
    setEjercicios(ejs);
    setIndice(0);
    setCorrecciones([]);
    setVuelta((v) => v + 1);
  };
  // Aleatorio solo en el navegador para no desajustar el SSR.
  useEffect(() => empezar(nuevaTanda(cfg)), [clave]); // eslint-disable-line react-hooks/exhaustive-deps

  const nombre = EJERCICIOS.find((e) => e.id === cfg.ejercicio)!.nombre;
  const terminado = correcciones.length === TANDA && indice >= TANDA;
  const contexto = `Nivel ${cfg.nivel} · ${cfg.compas} · ${terminado ? "Resumen" : `${Math.min(indice + 1, TANDA)} de ${TANDA}`}`;
  const actual = ejercicios?.[indice];
  const correccion = correcciones[indice] ?? null;

  const siguiente = () => {
    const n = indice + 1;
    setIndice(n);
    if (n >= TANDA) {
      guardarTanda({
        nivel: cfg.nivel,
        compas: cfg.compas,
        ejercicio: cfg.ejercicio,
        figuras: cfg.figuras,
        ppm: cfg.ppm,
        numCompases: cfg.numCompases,
        aciertos: correcciones.map((x) => x.aciertos),
        bien: aciertosTanda(correcciones),
      });
    }
    window.scrollTo({ top: 0 });
  };

  return (
    <Pantalla>
      <Cabecera titulo={nombre} contexto={contexto} volver={<Link to="/practicar/ejercicio" search={busquedaDe(cfg)}>← Ejercicio</Link>} />
      {!terminado && (
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: TANDA }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                correcciones[i] ? (correcciones[i]!.acierto ? "bg-primary" : "bg-destructive") : i === indice ? "bg-foreground/40" : "bg-marron-claro",
              )}
            />
          ))}
        </div>
      )}

      {actual && !terminado && (
        <div key={`${vuelta}-${indice}`} className="space-y-5">
          <EjercicioVista
            ej={actual}
            cfg={cfg}
            compas={c}
            correccion={correccion}
            onCorregir={(x) => setCorrecciones((prev) => {
              const out = [...prev];
              out[indice] = x;
              return out;
            })}
          />
          {correccion && <ResultadoEjercicio compas={c} numCompases={cfg.numCompases} correccion={correccion} onSiguiente={siguiente} ultimo={indice === TANDA - 1} />}
        </div>
      )}

      {terminado && ejercicios && <Resumen cfg={cfg} correcciones={correcciones} onRepetir={() => empezar(ejercicios)} onOtra={() => empezar(nuevaTanda(cfg))} />}
    </Pantalla>
  );
}

function Resumen({ cfg, correcciones, onRepetir, onOtra }: { cfg: Config; correcciones: Correccion[]; onRepetir: () => void; onOtra: () => void }) {
  const bien = aciertosTanda(correcciones);
  const fallados = pulsosMasFallados(correcciones.map((x) => x.aciertos));
  return (
    <section className="tarjeta space-y-5">
      <div className="flex items-center gap-4">
        <Baldo estado={baldoResumen(bien)} className="size-24 sm:size-24" />
        <div>
          <p className="font-sans text-5xl font-bold tabular-nums">
            {bien} de {TANDA}
          </p>
          <p className="text-sm text-muted-foreground">ejercicios bien</p>
        </div>
      </div>
      <ol className="space-y-1.5">
        {correcciones.map((x, i) => {
          const ok = x.aciertos.filter(Boolean).length;
          return (
            <li key={i} className="flex items-center gap-3 rounded-[12px] bg-background px-3 py-2.5 text-sm">
              <span className={cn("size-3 rounded-full", x.acierto ? "bg-primary" : "bg-destructive")} aria-label={x.acierto ? "Bien" : "Con fallos"} />
              <span className="font-semibold">Ejercicio {i + 1}</span>
              <span className="ml-auto tabular-nums text-muted-foreground">
                {ok} de {x.aciertos.length} pulsos
              </span>
            </li>
          );
        })}
      </ol>
      {fallados.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Pulsos más fallados: {fallados.map((f) => `pulso ${f.pulso} (${f.veces} ${f.veces === 1 ? "vez" : "veces"})`).join(", ")}.
        </p>
      )}
      <div className="grid gap-2">
        <button type="button" onClick={onRepetir} className="boton boton-primario">
          Repetir esta tanda
        </button>
        <button type="button" onClick={onOtra} className="boton boton-secundario">
          Otra tanda igual
        </button>
        <Link to="/practicar/ejercicio" search={busquedaDe(cfg)} className="boton boton-secundario">
          Cambiar ejercicio
        </Link>
      </div>
    </section>
  );
}
