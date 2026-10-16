import { createFileRoute, Link } from "@tanstack/react-router";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { COMPASES } from "@/musica/compases";
import { leerBusqueda } from "@/practica/busqueda";

export const Route = createFileRoute("/practicar/compas")({
  validateSearch: leerBusqueda,
  head: () => ({
    meta: [
      { title: "Elige compás · Me suena" },
      { name: "description", content: "Compases simples (el pulso se divide en dos) y compuestos (en tres)." },
      { property: "og:title", content: "Elige compás · Me suena" },
      { property: "og:description", content: "Compases simples (el pulso se divide en dos) y compuestos (en tres)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ElegirCompas,
});

function ElegirCompas() {
  const { nivel = 1 } = Route.useSearch();
  const grupo = (tipo: "simple" | "compuesto", texto: string) => (
    <section className="space-y-2">
      <p className="text-sm text-muted-foreground">{texto}</p>
      <div className="grid grid-cols-3 gap-2">
        {COMPASES.filter((c) => c.tipo === tipo).map((c) => (
          <Link
            key={c.id}
            to="/practicar/figuras"
            search={{ nivel, compas: c.id }}
            className="flex min-h-20 items-center justify-center rounded-full bg-card font-sans text-[28px] font-bold shadow-[var(--shadow-tarjeta)] active:scale-[0.98]"
          >
            {c.id}
          </Link>
        ))}
      </div>
    </section>
  );
  return (
    <Pantalla>
      <Cabecera titulo="Elige compás" contexto={`Nivel ${nivel} · Paso 2 de 4`} volver={<Link to="/practicar">← Nivel</Link>} />
      {grupo("simple", "Simples: el pulso se divide en dos.")}
      {grupo("compuesto", "Compuestos: el pulso se divide en tres.")}
    </Pantalla>
  );
}
