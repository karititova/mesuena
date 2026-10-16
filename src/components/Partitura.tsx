import { useEffect, useRef, useState } from "react";
import type { Compas } from "@/musica/compases";
import type { EstadoPulso } from "@/musica/partitura";

function leerColores() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return { tinta: v("--foreground"), secundario: v("--muted-foreground"), ok: v("--acierto"), curso: v("--primary"), fallo: v("--destructive"), vacio: v("--marron-claro") };
}

export function Partitura(props: {
  compas: Compas;
  ids: string[];
  numCompases: number;
  silabas: boolean;
  estados?: EstadoPulso[] | undefined;
  etiqueta: string;
  pulsoActivo?: number | null;
  progreso?: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { compas, ids, numCompases, silabas, estados, pulsoActivo, progreso } = props;
  const filas = useEstrecho();
  const dibujos = useRef(0);
  useEffect(() => {
    let vivo = true;
    const turno = ++dibujos.current;
    import("@/musica/partitura").then(({ dibujarPartitura }) => {
      if (!vivo || turno !== dibujos.current || !ref.current) return;
      try {
        dibujarPartitura(ref.current, { compas, ids, numCompases, silabas, estados, filas, pulsoActivo, progreso, colores: leerColores() });
      } catch (e) {
        console.error("Error dibujando partitura", e);
      }
    });
    return () => {
      vivo = false;
    };
  }, [compas, ids, numCompases, silabas, estados, filas, pulsoActivo, progreso]);
  return <div ref={ref} role="img" aria-label={props.etiqueta} className="partitura-caja w-full min-h-24" />;
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

/** true en pantallas de menos de 600 px (móvil vertical); se actualiza al girar. */
function useEstrecho() {
  const [estrecho, setEstrecho] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 599px)");
    const f = () => setEstrecho(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return estrecho;
}
