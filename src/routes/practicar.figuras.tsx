import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { silabaVisible } from "@/components/Paleta";
import { MiniFigura } from "@/components/Partitura";
import { compas as getCompas } from "@/musica/compases";
import { figurasDisponibles } from "@/musica/figuras";
import { figurasGuardadas, guardarFiguras } from "@/practica/almacen";
import { leerBusqueda } from "@/practica/busqueda";
import { seleccionValida } from "@/practica/ejercicios";

export const Route = createFileRoute("/practicar/figuras")({
  validateSearch: leerBusqueda,
  head: () => ({
    meta: [
      { title: "Elige figuras · Me suena" },
      { name: "description", content: "Decide qué figuras entran en tus ejercicios de ritmo." },
      { property: "og:title", content: "Elige figuras · Me suena" },
      { property: "og:description", content: "Decide qué figuras entran en tus ejercicios de ritmo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ElegirFiguras,
});

function ElegirFiguras() {
  const { nivel = 1, compas = "2/4" } = Route.useSearch();
  const navigate = useNavigate();
  const c = getCompas(compas);
  const todas = figurasDisponibles(c.tipo, nivel);
  const [marcadas, setMarcadas] = useState<string[]>(todas.map((f) => f.id));

  useEffect(() => {
    const g = figurasGuardadas(nivel, compas)?.filter((id) => todas.some((f) => f.id === id));
    if (g && seleccionValida(g)) setMarcadas(g);
  }, [nivel, compas]); // eslint-disable-line react-hooks/exhaustive-deps

  const valida = seleccionValida(marcadas);
  const alternar = (id: string) => setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const seguir = () => {
    const orden = todas.map((f) => f.id).filter((id) => marcadas.includes(id));
    guardarFiguras(nivel, compas, orden);
    navigate({ to: "/practicar/ejercicio", search: { nivel, compas, figuras: orden.join(",") } });
  };

  return (
    <Pantalla>
      <Cabecera titulo="¿Qué figuras entran?" contexto={`Nivel ${nivel} · ${compas} · Paso 3 de 4`} volver={<Link to="/practicar/compas" search={{ nivel }}>← Compás</Link>} />
      <p className="text-sm text-muted-foreground">Toca para quitar las que no quieras. Mínimo dos, y al menos una de un pulso.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {todas.map((f) => (
          <button key={f.id} type="button" aria-pressed={marcadas.includes(f.id)} onClick={() => alternar(f.id)} className="boton-figura" aria-label={f.nombre}>
            <MiniFigura id={f.id} compas={c} />
            <span className="text-xs font-semibold text-muted-foreground">{silabaVisible(f.silaba)}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={seguir} disabled={!valida} className="boton boton-primario w-full">
        {valida ? "Seguir" : "Elige al menos dos, una de un pulso"}
      </button>
    </Pantalla>
  );
}
