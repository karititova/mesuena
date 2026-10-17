import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { supabase } from "@/integrations/supabase/client";
import { misSesiones } from "@/clase/profe.functions";
import { EJERCICIOS } from "@/practica/ejercicios";

export const Route = createFileRoute("/_authenticated/profe/clases")({
  head: () => ({
    meta: [
      { title: "Mis clases · Me suena" },
      { name: "description", content: "Tus clases de ritmo en directo: crea una nueva o revisa las anteriores." },
      { property: "og:title", content: "Mis clases · Me suena" },
      { property: "og:description", content: "Tus clases de ritmo en directo: crea una nueva o revisa las anteriores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MisClases,
});

const fecha = (s: string) => new Date(s).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function MisClases() {
  const cargar = useServerFn(misSesiones);
  const { data, isLoading } = useQuery({ queryKey: ["mis-sesiones"], queryFn: () => cargar() });
  const qc = useQueryClient();
  const navigate = useNavigate();

  const salir = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/profe", replace: true });
  };

  return (
    <Pantalla>
      <Cabecera titulo="Mis clases" volver={<button type="button" onClick={salir} className="underline-offset-2 hover:underline">Cerrar sesión</button>} />
      <Link to="/profe/nueva" className="boton boton-primario w-full">Nueva clase</Link>
      {isLoading && <p className="text-muted-foreground">Cargando…</p>}
      {data && !data.length && <p className="text-muted-foreground">Todavía no has dado ninguna clase.</p>}
      <ul className="space-y-2">
        {data?.map((s) => (
          <li key={s.id}>
            <Link to="/profe/sala/$id" params={{ id: s.id }} className="tarjeta-opcion min-h-20">
              <div className="flex-1">
                <p className="font-semibold">{fecha(s.creada)} · {s.compas} · Nivel {s.nivel}</p>
                <p className="text-sm text-muted-foreground">
                  {EJERCICIOS.find((e) => e.id === s.ejercicio)?.nombre} · {s.alumnos} alumnos
                  {s.media !== null && ` · ${s.media} % de aciertos`}
                  {s.estado !== "terminada" && " · Abierta"}
                </p>
              </div>
              <span className="text-2xl text-muted-foreground" aria-hidden>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </Pantalla>
  );
}
