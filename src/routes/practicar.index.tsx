import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MiniFigura } from "@/components/Partitura";
import { compas as getCompas } from "@/musica/compases";
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

const S = getCompas("4/4");
const C = getCompas("6/8");
const NIVELES = [
  { nivel: 1 as const, figuras: [["negra", S], ["blanca", S], ["dos_corcheas", S], ["silencio_negra", S], ["negra_puntillo", C], ["tres_corcheas", C]] as const },
  { nivel: 2 as const, figuras: [["cuatro_semis", S], ["corchea_dos_semis", S], ["dos_semis_corchea", S], ["negra_corchea", C], ["corchea_negra", C]] as const },
];

function Practicar() {
  const [ultima, setUltima] = useState<TandaGuardada | null>(null);
  useEffect(() => setUltima(ultimaTanda()), []);
  return (
    <Pantalla>
      <Cabecera titulo="¿Qué nivel?" contexto="Paso 1 de 4" volver={<Link to="/">← Me suena</Link>} />
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
            <div className="w-full space-y-1">
              <p className="font-display text-[26px] leading-tight font-bold">Nivel {n.nivel}</p>
              <div className="flex flex-wrap items-center gap-x-1">
                {n.figuras.map(([id, c]) => (
                  <MiniFigura key={id} id={id} compas={c} pequeña />
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Pantalla>
  );
}
