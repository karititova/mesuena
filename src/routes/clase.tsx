import { createFileRoute, Link } from "@tanstack/react-router";
import { Baldo } from "@/components/Baldo";
import { Cabecera, Pantalla } from "@/components/Cabecera";

export const Route = createFileRoute("/clase")({
  head: () => ({
    meta: [
      { title: "Entrar a una clase · Me suena" },
      { name: "description", content: "Muy pronto podrás unirte a la clase de tu profesor desde Me suena." },
      { property: "og:title", content: "Entrar a una clase · Me suena" },
      { property: "og:description", content: "Muy pronto podrás unirte a la clase de tu profesor desde Me suena." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Clase,
});

function Clase() {
  return (
    <Pantalla>
      <Cabecera titulo="Entrar a una clase" volver={<Link to="/">← Me suena</Link>} />
      <section className="tarjeta flex flex-col items-center gap-4 py-10 text-center">
        <Baldo estado="espera" />
        <p className="font-display text-[28px] font-bold">Pronto</p>
        <p className="text-muted-foreground">Las clases llegarán en la próxima versión. Mientras, puedes practicar por tu cuenta.</p>
        <Link to="/practicar" className="boton boton-primario px-8">
          Practicar
        </Link>
      </section>
    </Pantalla>
  );
}
