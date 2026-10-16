import { createFileRoute, Link } from "@tanstack/react-router";
import { Pantalla } from "@/components/Cabecera";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Me suena · Aprende ritmo musical" },
      { name: "description", content: "Ritmo musical para adultos que empiezan: escucha, lee y monta cada compás pulso a pulso." },
      { property: "og:title", content: "Me suena · Aprende ritmo musical" },
      { property: "og:description", content: "Ritmo musical para adultos que empiezan: escucha, lee y monta cada compás pulso a pulso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Pantalla>
      <header className="relative pb-4 pt-16">
        <div className="cabecera-halo pointer-events-none absolute -inset-x-24 top-0 h-72" aria-hidden />
        <div className="relative space-y-3">
          <h1 className="font-display text-[56px] leading-none font-bold text-foreground">Me suena</h1>
          <p className="text-lg text-muted-foreground">Escucha, lee y monta el ritmo pulso a pulso.</p>
        </div>
      </header>
      <div className="space-y-3">
        <Link to="/practicar" className="tarjeta-opcion min-h-28">
          <div>
            <p className="font-display text-[26px] font-bold">Practicar</p>
            <p className="text-sm text-muted-foreground">Tandas cortas a tu ritmo.</p>
          </div>
          <span className="ml-auto text-2xl text-muted-foreground" aria-hidden>→</span>
        </Link>
        <Link to="/clase" className="tarjeta-opcion min-h-28">
          <div>
            <p className="font-display text-[26px] font-bold">Entrar a una clase</p>
            <p className="text-sm text-muted-foreground">Con el código de tu profesora.</p>
          </div>
          <span className="ml-auto text-2xl text-muted-foreground" aria-hidden>→</span>
        </Link>
      </div>
    </Pantalla>
  );
}
