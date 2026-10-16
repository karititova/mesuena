import { useCallback, useEffect, useState } from "react";
import type { Compas } from "@/musica/compases";
import { parar, reproducir } from "@/audio/motor";

/** Estado de reproducción compartido por los ejercicios: qué suena y en qué pulso va. */
export function useReproductor(c: Compas, ppm: number, numCompases: number) {
  const [sonando, setSonando] = useState<string | null>(null);
  const [pulso, setPulso] = useState<number | null>(null);
  const [conPulso, setConPulso] = useState(true);

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
    }, setPulso, conPulso);
  };

  /** Pulso del ritmo en curso (sin la entrada), para las cápsulas. */
  const progreso = (clave: string) => (sonando === clave && pulso !== null && pulso >= 0 ? pulso : null);
  return { sonando, pulso, conPulso, setConPulso, tocar, detener, progreso };
}

export function BotonPulso({ activo, onChange }: { activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => onChange(!activo)}
      className={activo ? "boton boton-primario px-4" : "boton boton-secundario px-4"}
    >
      Pulso
    </button>
  );
}

/** Contador grande: «1 · 2 · 3 · 4» con el pulso en curso en verde. */
export function Contador({ c, pulso }: { c: Compas; pulso: number | null }) {
  const enEntrada = pulso !== null && pulso < 0;
  const actual = pulso === null ? -1 : ((pulso % c.pulsos) + c.pulsos) % c.pulsos;
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 text-sm text-muted-foreground" aria-live="polite">
      <span>{pulso === null ? "Primero un compás de entrada" : enEntrada ? "Entrada" : "Ahora el ritmo"}</span>
      {pulso !== null && (
        <span className="font-sans text-[28px] leading-none font-bold tabular-nums">
          {Array.from({ length: c.pulsos }, (_, i) => (
            <span key={i} className={i === actual ? "text-primary" : "text-muted-foreground"}>
              {i > 0 && " · "}
              {i + 1}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
