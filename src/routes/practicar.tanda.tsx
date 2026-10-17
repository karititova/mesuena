import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Baldo } from "@/components/Baldo";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { EjercicioVista } from "@/components/Ejercicios";
import { ResultadoEjercicio } from "@/components/ResultadoEjercicio";
import { compas as getCompas, TEMPOS } from "@/musica/compases";
import { figurasDisponibles, type Nivel } from "@/musica/figuras";
import { Partitura } from "@/components/Partitura";
import { Segmentado } from "@/components/Segmentado";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { comentarioTanda } from "@/practica/comentario";
import { guardarTanda } from "@/practica/almacen";
import { busquedaDe, configDe, leerBusqueda } from "@/practica/busqueda";
import {
  aciertosTanda,
  baldoResumen,
  crearEjercicio,
  EJERCICIOS,
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

/** Aplica tempo, compases y nivel; al cambiar de nivel ajusta las figuras a las del nuevo nivel. */
function conAjustes(cfg: Config, ppm: number, numCompases: number, nivel: Nivel): Config {
  if (nivel === cfg.nivel) return { ...cfg, ppm, numCompases };
  const disp = figurasDisponibles(getCompas(cfg.compas).tipo, nivel).map((f) => f.id);
  const quedan = cfg.figuras.filter((id) => disp.includes(id));
  const figuras = nivel > cfg.nivel ? disp : quedan.length >= 2 ? quedan : disp;
  return { ...cfg, ppm, numCompases, nivel, figuras };
}

function TandaEn({ cfg: cfgInicial }: { cfg: Config }) {
  const clave = JSON.stringify(cfgInicial);
  const [cfg, setCfg] = useState(cfgInicial);
  const [cfgs, setCfgs] = useState<Config[]>([]);
  const [ajustes, setAjustes] = useState(false);
  const c = getCompas(cfg.compas);
  const [ejercicios, setEjercicios] = useState<Ejercicio[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [correcciones, setCorrecciones] = useState<Correccion[]>([]);
  const [vuelta, setVuelta] = useState(0); // fuerza estado limpio en cada ejercicio

  const empezar = (ejs: Ejercicio[], conCfg: Config = cfg) => {
    setEjercicios(ejs);
    setCfgs(ejs.map(() => conCfg));
    setIndice(0);
    setCorrecciones([]);
    setVuelta((v) => v + 1);
  };
  // Aleatorio solo en el navegador para no desajustar el SSR.
  useEffect(() => {
    setCfg(cfgInicial);
    empezar(nuevaTanda(cfgInicial), cfgInicial);
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps

  const nombre = EJERCICIOS.find((e) => e.id === cfg.ejercicio)!.nombre;
  const terminado = correcciones.length === TANDA && indice >= TANDA;
  const contexto = `Nivel ${cfg.nivel} · ${cfg.compas} · ${terminado ? "Resumen" : `${Math.min(indice + 1, TANDA)} de ${TANDA}`}`;
  const actual = ejercicios?.[indice];
  const cfgActual = cfgs[indice] ?? cfg;
  const aplicarAjustes = (n: Config) => {
    setCfg(n);
    // Desde el siguiente ejercicio: los ya hechos y el actual no cambian.
    setEjercicios((prev) => prev && prev.map((e, i) => (i > indice ? crearEjercicio(n) : e)));
    setCfgs((prev) => prev.map((x, i) => (i > indice ? n : x)));
  };
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
      <div className="relative">
        <Cabecera titulo={nombre} contexto={contexto} volver={<Link to="/practicar/ejercicio" search={busquedaDe(cfg)}>← Ejercicio</Link>} />
        <button type="button" onClick={() => setAjustes(true)} className="boton-contorno absolute right-0 bottom-2 min-h-9">
          Ajustes
        </button>
      </div>
      <Ajustes abierto={ajustes} onCerrar={() => setAjustes(false)} cfg={cfg} onAplicar={aplicarAjustes} />
      {!terminado && (
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: TANDA }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                correcciones[i] ? (correcciones[i]!.acierto ? "bg-acierto" : "bg-destructive") : i === indice ? "bg-acento" : "bg-marron-claro",
              )}
            />
          ))}
        </div>
      )}

      {actual && !terminado && (
        <div key={`${vuelta}-${indice}`} className="space-y-5">
          <EjercicioVista
            ej={actual}
            cfg={cfgActual}
            compas={c}
            correccion={correccion}
            onCorregir={(x) => setCorrecciones((prev) => {
              const out = [...prev];
              out[indice] = x;
              return out;
            })}
            resultado={correccion && <ResultadoEjercicio compas={c} numCompases={cfgActual.numCompases} correccion={correccion} onSiguiente={siguiente} ultimo={indice === TANDA - 1} />}
          />
        </div>
      )}

      {terminado && <div className="fondo-mancha" aria-hidden />}
      {terminado && ejercicios && <Resumen cfg={cfg} correcciones={correcciones} onRepetir={() => empezar(ejercicios)} onOtra={() => empezar(nuevaTanda(cfg))} />}
    </Pantalla>
  );
}

function Resumen({ cfg, correcciones, onRepetir, onOtra }: { cfg: Config; correcciones: Correccion[]; onRepetir: () => void; onOtra: () => void }) {
  const bien = aciertosTanda(correcciones);
  const comentario = comentarioTanda(correcciones, cfg);
  const [abierto, setAbierto] = useState<number | null>(null);
  const c = getCompas(cfg.compas);
  return (
    <section className="tarjeta space-y-5">
      <div className="flex items-center gap-4">
        <Baldo estado={baldoResumen(bien)} className="size-24 sm:size-24" />
        <p className="font-sans text-3xl leading-tight font-bold tabular-nums">
          {bien} de {TANDA} ejercicios bien
        </p>
      </div>
      <div className="space-y-2 text-[15px] leading-relaxed">
        {comentario.map((f, i) => (
          <p key={i}>{f}</p>
        ))}
      </div>
      <ol className="space-y-1.5">
        {correcciones.map((x, i) => {
          const visible = abierto === i;
          const n = x.aciertos.length / c.pulsos;
          return (
            <li key={i} className="rounded-[12px] bg-background text-sm">
              <button type="button" aria-expanded={visible} onClick={() => setAbierto(visible ? null : i)} className="flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left">
                <span className={cn("size-3 rounded-full", x.acierto ? "bg-acierto" : "bg-destructive")} aria-label={x.acierto ? "Bien" : "Con fallos"} />
                <span className="font-semibold">Ejercicio {i + 1}</span>
                <span className="ml-auto text-muted-foreground" aria-hidden>{visible ? "▴" : "▾"}</span>
              </button>
              {visible && (
                <div className="space-y-2 px-3 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tu respuesta</p>
                  <Partitura compas={c} ids={x.respuesta} numCompases={n} silabas={false} estados={x.aciertos.map((ok) => (ok ? null : "fallo"))} etiqueta="Tu respuesta" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solución</p>
                  <Partitura compas={c} ids={x.solucion} numCompases={n} silabas={false} estados={x.aciertos.map((ok) => (ok ? null : "fallo"))} etiqueta="Solución" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="grid gap-2">
        <button type="button" onClick={onRepetir} className="boton boton-primario">
          Repetir estos ritmos
        </button>
        <button type="button" onClick={onOtra} className="boton boton-secundario">
          Nuevos ritmos
        </button>
        <Link to="/practicar/ejercicio" search={busquedaDe(cfg)} className="boton boton-secundario">
          Cambiar de ejercicio
        </Link>
      </div>
    </section>
  );
}

function Ajustes({ abierto, onCerrar, cfg, onAplicar }: { abierto: boolean; onCerrar: () => void; cfg: Config; onAplicar: (c: Config) => void }) {
  const [ppm, setPpm] = useState(cfg.ppm);
  const [n, setN] = useState(cfg.numCompases);
  const [nivel, setNivel] = useState<Nivel>(cfg.nivel);
  useEffect(() => {
    if (!abierto) return;
    setPpm(cfg.ppm);
    setN(cfg.numCompases);
    setNivel(cfg.nivel);
  }, [abierto, cfg]);
  return (
    <Sheet open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent side="bottom" className="mx-auto max-w-[720px] rounded-t-[16px] bg-card">
        <SheetHeader>
          <SheetTitle className="font-display text-[24px]">Ajustes</SheetTitle>
          <p className="text-sm text-muted-foreground">Se aplican desde el siguiente ejercicio.</p>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <Segmentado etiqueta="Tempo" opciones={TEMPOS.map((t) => ({ valor: t.ppm as number, texto: t.nombre }))} valor={ppm} onChange={setPpm} />
          <Segmentado etiqueta="Compases" opciones={[{ valor: 1, texto: "1" }, { valor: 2, texto: "2" }]} valor={n} onChange={setN} />
          <Segmentado etiqueta="Nivel" opciones={[{ valor: 1 as Nivel, texto: "Nivel 1" }, { valor: 2 as Nivel, texto: "Nivel 2" }]} valor={nivel} onChange={setNivel} />
          <button
            type="button"
            className="boton boton-primario w-full"
            onClick={() => {
              onAplicar(conAjustes(cfg, ppm, n, nivel));
              onCerrar();
            }}
          >
            Guardar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
