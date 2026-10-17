import { useCallback, useEffect, useState } from "react";
import type { Compas } from "@/musica/compases";
import { parar, reproducir } from "@/audio/motor";

/** Estado de reproducción compartido por los ejercicios: qué suena y en qué pulso va. */
export function useReproductor(c: Compas, ppm: number, numCompases: number) {
  const [sonando, setSonando] = useState<string | null>(null);
  const [pulso, setPulso] = useState<number | null>(null);

  const detener = useCallback(() => {
    parar();
    setSonando(null);
    setPulso(null);
  }, []);

  useEffect(() => () => parar(), []);

  const tocar = async (clave: string, ids: string[]) => {
    setSonando(clave);
    setPulso(null);
    await reproducir(c, ids, ppm, numCompases, () => {
      setSonando(null);
      setPulso(null);
    }, setPulso);
  };

  /** Pulso del ritmo en curso (sin la entrada), para las cápsulas. */
  const progreso = (clave: string) => (sonando === clave && pulso !== null && pulso >= 0 ? pulso : null);
  /** Pulso en curso (sin la entrada) de lo que suene, para el rectángulo de la partitura. */
  const marca = sonando !== null && pulso !== null && pulso >= 0 ? pulso : null;
  return { marca, sonando, pulso, tocar, detener, progreso };
}

/** Contador grande «1 · 2 · 3 · 4»: solo durante el compás de entrada. */
export function Contador({ c, pulso }: { c: Compas; pulso: number | null }) {
  if (pulso === null || pulso >= 0) return null;
  const actual = ((pulso % c.pulsos) + c.pulsos) % c.pulsos;
  return (
    <div className="flex min-h-10 items-center justify-center font-sans text-[28px] leading-none font-bold tabular-nums" aria-live="polite">
      {Array.from({ length: c.pulsos }, (_, i) => (
        <span key={i} className={i === actual ? "text-primary" : "text-muted-foreground"}>
          {i > 0 && " · "}
          {i + 1}
        </span>
      ))}
    </div>
  );
}
