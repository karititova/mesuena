import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profe/")({
  head: () => ({
    meta: [
      { title: "Acceso de la profesora · Me suena" },
      { name: "description", content: "Entra para crear clases de ritmo en directo con tus alumnos." },
      { property: "og:title", content: "Acceso de la profesora · Me suena" },
      { property: "og:description", content: "Entra para crear clases de ritmo en directo con tus alumnos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Acceso,
});

function Acceso() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/profe/clases", replace: true }));
  }, [navigate]);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave });
    setEnviando(false);
    if (error) setError("El email o la contraseña no coinciden.");
    else navigate({ to: "/profe/clases" });
  };

  return (
    <Pantalla>
      <Cabecera titulo="Soy la profesora" volver={<Link to="/">← Me suena</Link>} />
      <form onSubmit={entrar} className="tarjeta space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Contraseña</span>
          <input type="password" required autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} className="campo" />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={enviando} className="boton boton-primario w-full">
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </Pantalla>
  );
}
