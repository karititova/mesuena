import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { Segmentado } from "@/components/Segmentado";
import { TEMPOS } from "@/musica/compases";
import { leerBusqueda } from "@/practica/busqueda";
import { EJERCICIOS, type TipoEjercicio } from "@/practica/ejercicios";

export const Route = createFileRoute("/practicar/ejercicio")({
  validateSearch: leerBusqueda,
  head: () => ({
    meta: [
      { title: "Elige ejercicio · Me suena" },
      { name: "description", content: "¿Cuál suena?, Dictado o Encuentra el error, con el tempo que prefieras." },
      { property: "og:title", content: "Elige ejercicio · Me suena" },
      { property: "og:description", content: "¿Cuál suena?, Dictado o Encuentra el error, con el tempo que prefieras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ElegirEjercicio,
});

function ElegirEjercicio() {
  const s = Route.useSearch();
  const { nivel = 1, compas = "2/4", figuras = "" } = s;
  const [ejercicio, setEjercicio] = useState<TipoEjercicio>(s.ejercicio ?? "dictado");
  const [ppm, setPpm] = useState<number>(s.ppm ?? 60);
  const [n, setN] = useState<number>(s.n ?? 2);
  return (
    <Pantalla>
      <Cabecera titulo="Elige ejercicio" contexto={`Nivel ${nivel} · ${compas} · Paso 4 de 4`} volver={<Link to="/practicar/figuras" search={{ nivel, compas }}>← Figuras</Link>} />
      <div className="space-y-3">
        {EJERCICIOS.map((e) => (
          <button key={e.id} type="button" aria-pressed={ejercicio === e.id} onClick={() => setEjercicio(e.id)} className="tarjeta-opcion">
            <div>
              <p className="font-display text-[22px] leading-tight font-bold">{e.nombre}</p>
              <p className="text-sm text-muted-foreground">{e.frase}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="tarjeta space-y-4">
        <Segmentado etiqueta="Tempo" opciones={TEMPOS.map((t) => ({ valor: t.ppm as number, texto: t.nombre }))} valor={ppm} onChange={setPpm} />
        <Segmentado etiqueta="Compases" opciones={[{ valor: 1, texto: "1" }, { valor: 2, texto: "2" }]} valor={n} onChange={setN} />
      </div>
      <Link to="/practicar/tanda" search={{ nivel, compas, figuras, ejercicio, ppm, n }} className="boton boton-primario w-full">
        Empezar tanda
      </Link>
    </Pantalla>
  );
}
