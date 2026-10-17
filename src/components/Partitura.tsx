import { useEffect, useRef, useState } from "react";
import type { Compas } from "@/musica/compases";
import type { EstadoPulso } from "@/musica/partitura";

function leerColores() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return { tinta: v("--foreground"), secundario: v("--muted-foreground"), ok: v("--acierto"), curso: v("--primary"), fallo: v("--destructive"), vacio: v("--marron-claro"), seleccion: v("--primario-claro") };
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
  /** Respuesta compacta (máx. 110 px de alto). */
  compacta?: boolean;
  seleccionado?: number | null;
  /** Pulso que suena ahora: se resalta con el mismo rectángulo que la selección. */
  marca?: number | null;
  /** Con esta función cada pulso es una zona táctil (alto del pentagrama × ancho del pulso). */
  onTocarPulso?: ((pulso: number) => void) | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { compas, ids, numCompases, silabas, estados, pulsoActivo, progreso, seleccionado, compacta, marca } = props;
  const tocar = useRef(props.onTocarPulso);
  tocar.current = props.onTocarPulso;
  const tactil = !!props.onTocarPulso;
  const filas = useEstrecho();
  const dibujos = useRef(0);
  useEffect(() => {
    let vivo = true;
    const turno = ++dibujos.current;
    import("@/musica/partitura").then(({ dibujarPartitura }) => {
      if (!vivo || turno !== dibujos.current || !ref.current) return;
      try {
        const zonas = dibujarPartitura(ref.current, { compas, ids, numCompases, silabas, estados, filas: filas && !compacta, pulsoActivo, progreso, seleccionado: marca ?? seleccionado, colores: leerColores() });
        const svg = ref.current.querySelector("svg");
        if (tactil && svg) {
          for (const z of zonas) {
            const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            Object.entries({ x: z.x, y: z.y, width: z.w, height: z.h, fill: "transparent", stroke: "none", role: "button", "aria-label": `Pulso ${z.pulso + 1}` }).forEach(([k, v]) => r.setAttribute(k, String(v)));
            r.style.cursor = "pointer";
            r.addEventListener("click", () => tocar.current?.(z.pulso));
            svg.appendChild(r);
          }
        }
      } catch (e) {
        console.error("Error dibujando partitura", e);
      }
    });
    return () => {
      vivo = false;
    };
  }, [compas, ids, numCompases, silabas, estados, filas, pulsoActivo, progreso, seleccionado, marca, compacta, tactil]);
  return <div ref={ref} role="img" aria-label={props.etiqueta} className={compacta ? "partitura-caja partitura-compacta w-full" : "partitura-caja w-full min-h-24"} />;
}

export function MiniFigura({ id, compas, desactivada, pequeña, className }: { id: string; compas: Compas; desactivada?: boolean; pequeña?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    import("@/musica/partitura").then(({ dibujarMiniFigura }) => {
      if (!ref.current) return;
      const c = leerColores();
      dibujarMiniFigura(ref.current, id, compas, desactivada ? c.secundario : c.tinta);
    });
  }, [id, compas, desactivada]);
  return <div ref={ref} aria-hidden className={className ?? (pequeña ? "w-14" : "w-24")} />;
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
