import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { silabaVisible } from "@/components/Paleta";
import { MiniFigura } from "@/components/Partitura";
import { Segmentado } from "@/components/Segmentado";
import { COMPASES, compas as getCompas, TEMPOS } from "@/musica/compases";
import { figurasDisponibles, type Nivel } from "@/musica/figuras";
import { EJERCICIOS, seleccionValida, type TipoEjercicio } from "@/practica/ejercicios";
import { crearSesion } from "@/clase/profe.functions";
import { PREGUNTAS_DEFECTO, PREGUNTAS_MAX, PREGUNTAS_MIN } from "@/clase/sala";

export const Route = createFileRoute("/_authenticated/profe/nueva")({
  head: () => ({
    meta: [
      { title: "Nueva clase · Me suena" },
      { name: "description", content: "Elige nivel, compás, figuras, ejercicio, tempo y número de preguntas para tu clase." },
      { property: "og:title", content: "Nueva clase · Me suena" },
      { property: "og:description", content: "Elige nivel, compás, figuras, ejercicio, tempo y número de preguntas para tu clase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NuevaClase,
});

function NuevaClase() {
  const navigate = useNavigate();
  const crear = useServerFn(crearSesion);
  const [nivel, setNivel] = useState<Nivel>(1);
  const [compas, setCompas] = useState("2/4");
  const c = getCompas(compas);
  const todas = figurasDisponibles(c.tipo, nivel);
  const [marcadas, setMarcadas] = useState<string[]>(todas.map((f) => f.id));
  const [ejercicio, setEjercicio] = useState<TipoEjercicio>("dictado");
  const [ppm, setPpm] = useState<50 | 60 | 70>(60);
  const [n, setN] = useState<1 | 2>(2);
  const [preguntas, setPreguntas] = useState(PREGUNTAS_DEFECTO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (nv: Nivel, cp: string) => {
    setNivel(nv);
    setCompas(cp);
    setMarcadas(figurasDisponibles(getCompas(cp).tipo, nv).map((f) => f.id));
  };
  const elegidas = todas.map((f) => f.id).filter((id) => marcadas.includes(id));
  const valida = seleccionValida(elegidas);

  const abrir = async () => {
    setEnviando(true);
    setError(null);
    try {
      const { id } = await crear({ data: { nivel, compas: compas as "2/4", figuras: elegidas, ejercicio, ppm, numCompases: n, numPreguntas: preguntas } });
      navigate({ to: "/profe/sala/$id", params: { id } });
    } catch {
      setError("No se ha podido crear la clase. Inténtalo de nuevo.");
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <Cabecera titulo="Nueva clase" volver={<Link to="/profe/clases">← Mis clases</Link>} />
      <div className="tarjeta space-y-5">
        <Segmentado etiqueta="Nivel" opciones={[{ valor: 1 as Nivel, texto: "Nivel 1" }, { valor: 2 as Nivel, texto: "Nivel 2" }]} valor={nivel} onChange={(v) => cambiar(v, compas)} />
        <Segmentado etiqueta="Compás" opciones={COMPASES.map((x) => ({ valor: x.id, texto: x.id }))} valor={compas} onChange={(v) => cambiar(nivel, v)} />
      </div>
      <div className="tarjeta space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Figuras</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {todas.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={marcadas.includes(f.id)}
              onClick={() => setMarcadas((m) => (m.includes(f.id) ? m.filter((x) => x !== f.id) : [...m, f.id]))}
              className="boton-figura"
            >
              <MiniFigura id={f.id} compas={c} />
              <span className="text-xs text-muted-foreground">{silabaVisible(f.silaba)}</span>
            </button>
          ))}
        </div>
        {!valida && <p className="text-sm text-destructive">Mínimo dos figuras, y al menos una de un pulso.</p>}
      </div>
      <div className="tarjeta space-y-5">
        <Segmentado etiqueta="Ejercicio" opciones={EJERCICIOS.map((e) => ({ valor: e.id, texto: e.nombre }))} valor={ejercicio} onChange={setEjercicio} />
        <Segmentado etiqueta="Tempo" opciones={TEMPOS.map((t) => ({ valor: t.ppm as 50 | 60 | 70, texto: t.nombre }))} valor={ppm} onChange={setPpm} />
        <Segmentado etiqueta="Compases" opciones={[{ valor: 1 as const, texto: "1" }, { valor: 2 as const, texto: "2" }]} valor={n} onChange={setN} />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preguntas</p>
          <div className="flex items-center gap-3">
            <button type="button" className="boton boton-secundario min-h-11 w-12" disabled={preguntas <= PREGUNTAS_MIN} onClick={() => setPreguntas(preguntas - 1)} aria-label="Menos preguntas">−</button>
            <span className="w-10 text-center font-sans text-2xl font-bold tabular-nums">{preguntas}</span>
            <button type="button" className="boton boton-secundario min-h-11 w-12" disabled={preguntas >= PREGUNTAS_MAX} onClick={() => setPreguntas(preguntas + 1)} aria-label="Más preguntas">+</button>
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="button" disabled={!valida || enviando} onClick={abrir} className="boton boton-primario w-full">
        {enviando ? "Abriendo…" : "Abrir sala"}
      </button>
    </Pantalla>
  );
}
