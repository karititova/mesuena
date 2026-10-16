import { createFileRoute, Link } from "@tanstack/react-router";
import { Baldo } from "@/components/Baldo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Me suena · Aprende ritmo musical" },
      { name: "description", content: "Aprende a leer y sentir el ritmo, en clase y practicando a tu ritmo." },
      { property: "og:title", content: "Me suena · Aprende ritmo musical" },
      { property: "og:description", content: "Aprende a leer y sentir el ritmo, en clase y practicando a tu ritmo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <Baldo estado="neutro" className="size-40" />
      <h1 className="font-display text-5xl font-semibold text-foreground">Me suena</h1>
      <p className="text-lg text-muted-foreground">Ritmo musical para adultos que empiezan: escucha, lee y monta cada compás pulso a pulso.</p>
      <Link to="/laboratorio" className="boton boton-primario px-8">
        Entrar al laboratorio
      </Link>
    </main>
  );
}
