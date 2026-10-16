import { useEffect, useRef } from "react";
import type { Compas } from "@/musica/compases";
import type { EstadoPulso } from "@/musica/partitura";

function leerColores() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return { tinta: v("--foreground"), secundario: v("--muted-foreground"), ok: v("--primary"), fallo: v("--destructive"), vacio: v("--marron-claro") };
}

export function Partitura(props: {
  compas: Compas;
  ids: string[];
  numCompases: number;
  silabas: boolean;
  estados?: EstadoPulso[] | undefined;
  etiqueta: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { compas, ids, numCompases, silabas, estados } = props;
  useEffect(() => {
    let vivo = true;
    import("@/musica/partitura").then(({ dibujarPartitura }) => {
      if (!vivo || !ref.current) return;
      try {
        dibujarPartitura(ref.current, { compas, ids, numCompases, silabas, estados, colores: leerColores() });
      } catch (e) {
        console.error("Error dibujando partitura", e);
      }
    });
    return () => {
      vivo = false;
    };
  }, [compas, ids, numCompases, silabas, estados]);
  return <div ref={ref} role="img" aria-label={props.etiqueta} className="w-full min-h-24" />;
}

export function MiniFigura({ id, compas, desactivada }: { id: string; compas: Compas; desactivada?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    import("@/musica/partitura").then(({ dibujarMiniFigura }) => {
      if (!ref.current) return;
      const c = leerColores();
      dibujarMiniFigura(ref.current, id, compas, desactivada ? c.secundario : c.tinta);
    });
  }, [id, compas, desactivada]);
  return <div ref={ref} aria-hidden className="w-24" />;
}
