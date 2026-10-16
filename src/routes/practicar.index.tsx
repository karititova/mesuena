import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Baldo } from "@/components/Baldo";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { ultimaTanda, type TandaGuardada } from "@/practica/almacen";
import { EJERCICIOS, TANDA } from "@/practica/ejercicios";

export const Route = createFileRoute("/practicar/")({
  head: () => ({
    meta: [
      { title: "Practicar · Me suena" },
      { name: "description", content: "Elige nivel, compás y figuras, y practica ritmo en tandas de cinco ejercicios." },
      { property: "og:title", content: "Practicar · Me suena" },
      { property: "og:description", content: "Elige nivel, compás y figuras, y practica ritmo en tandas de cinco ejercicios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Practicar,
});

const NIVELES = [
  { nivel: 1 as const, nombre: "Pulso y división", frase: "El pulso se divide en dos o en tres.", baldo: "neutro" as const },
  { nivel: 2 as const, nombre: "Rellenar el pulso", frase: "Un pulso se rellena de muchas formas.", baldo: "neutro" as const },
];

function Practicar() {
  const [ultima, setUltima] = useState<TandaGuardada | null>(null);
  useEffect(() => setUltima(ultimaTanda()), []);
  return (
    <Pantalla>
      <Cabecera titulo="Elige nivel" contexto="Paso 1 de 4" volver={<Link to="/">← Me suena</Link>} />
      {ultima && (
        <div className="tarjeta flex items-center justify-between gap-3 py-3">
          <p className="text-sm text-muted-foreground">
            Última vez: Nivel {ultima.nivel} · {ultima.compas} · {EJERCICIOS.find((e) => e.id === ultima.ejercicio)?.nombre} · {ultima.bien} de {TANDA}
          </p>
          <Link
            to="/practicar/tanda"
            search={{ nivel: ultima.nivel, compas: ultima.compas, figuras: ultima.figuras.join(","), ejercicio: ultima.ejercicio, ppm: ultima.ppm, n: ultima.numCompases }}
            className="boton boton-primario shrink-0 px-4"
          >
            Continuar
          </Link>
        </div>
      )}
      <div className="space-y-3">
        {NIVELES.map((n) => (
          <Link key={n.nivel} to="/practicar/compas" search={{ nivel: n.nivel }} className="tarjeta-opcion">
            <Baldo estado={n.baldo} className="size-20 sm:size-20" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nivel {n.nivel}</p>
              <p className="font-display text-[24px] leading-tight font-bold">{n.nombre}</p>
              <p className="text-sm text-muted-foreground">{n.frase}</p>
            </div>
          </Link>
        ))}
      </div>
    </Pantalla>
  );
}
