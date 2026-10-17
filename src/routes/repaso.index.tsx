import { createFileRoute, Link } from "@tanstack/react-router";
import { Baldo } from "@/components/Baldo";
import { Cabecera, Pantalla } from "@/components/Cabecera";

export const Route = createFileRoute("/repaso/")({
  head: () => ({
    meta: [
      { title: "Tu repaso · Me suena" },
      { name: "description", content: "Pronto podrás repasar los ritmos que fallaste en clase." },
      { property: "og:title", content: "Tu repaso · Me suena" },
      { property: "og:description", content: "Pronto podrás repasar los ritmos que fallaste en clase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Repaso,
});

function Repaso() {
  return (
    <Pantalla>
      <Cabecera titulo="Tu repaso" volver={<Link to="/">← Me suena</Link>} />
      <section className="tarjeta flex flex-col items-center gap-4 py-10 text-center">
        <Baldo estado="espera" className="size-[130px]" />
        <p className="font-display text-[28px] font-bold">Pronto</p>
        <p className="text-muted-foreground">Aquí repasarás los ritmos que fallaste en clase. Mientras, puedes practicar por tu cuenta.</p>
        <Link to="/practicar" className="boton boton-primario px-8">Practicar</Link>
      </section>
    </Pantalla>
  );
}
