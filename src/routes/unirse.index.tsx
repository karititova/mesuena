import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { codigoValido, normalizarCodigo } from "@/clase/sala";

export const Route = createFileRoute("/unirse/")({
  head: () => ({
    meta: [
      { title: "Entrar a una clase · Me suena" },
      { name: "description", content: "Escribe el código de la clase para unirte desde el móvil." },
      { property: "og:title", content: "Entrar a una clase · Me suena" },
      { property: "og:description", content: "Escribe el código de la clase para unirte desde el móvil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Unirse,
});

function Unirse() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  return (
    <Pantalla>
      <Cabecera titulo="Entrar a una clase" volver={<Link to="/">← Me suena</Link>} />
      <form
        className="tarjeta space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (codigoValido(codigo)) navigate({ to: "/unirse/$codigo", params: { codigo } });
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Código de la clase</span>
          <input
            value={codigo}
            onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="ABCD"
            className="campo text-center font-sans text-4xl font-bold tracking-[0.3em]"
          />
        </label>
        <button type="submit" disabled={!codigoValido(codigo)} className="boton boton-primario w-full">Seguir</button>
      </form>
    </Pantalla>
  );
}
