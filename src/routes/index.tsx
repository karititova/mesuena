import { createFileRoute, Link } from "@tanstack/react-router";
import { Baldo } from "@/components/Baldo";
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
        <div className="fondo-mancha" aria-hidden />
        <div className="relative space-y-3">
          <Baldo estado="neutro" className="mx-auto size-24 sm:size-24" />
          <h1 className="text-center font-display text-[56px] leading-none font-bold text-foreground">Me suena</h1>
          <p className="text-center text-lg text-muted-foreground">Entrena el oído rítmico, pulso a pulso.</p>
        </div>
      </header>
      <div className="space-y-3">
        <Link to="/practicar" className="tarjeta-opcion min-h-28">
          <div>
            <p className="font-display text-[26px] font-bold">Practicar</p>
            <p className="text-sm text-muted-foreground">A tu ritmo, cuando quieras.</p>
          </div>
          <span className="ml-auto text-2xl text-muted-foreground" aria-hidden>→</span>
        </Link>
        <Link to="/unirse" className="tarjeta-opcion min-h-28">
          <div>
            <p className="font-display text-[26px] font-bold">Entrar a una clase</p>
            <p className="text-sm text-muted-foreground">Con el código de la clase.</p>
          </div>
          <span className="ml-auto text-2xl text-muted-foreground" aria-hidden>→</span>
        </Link>
      </div>
      <footer className="pt-8 text-center">
        <Link to="/profe" className="text-sm text-muted-foreground underline-offset-2 hover:underline">Soy la profesora</Link>
      </footer>
    </Pantalla>
  );
}
