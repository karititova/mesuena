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

/** «Clic»: botón secundario pequeño que apaga el metrónomo bajo el ritmo (la entrada suena siempre). */
export function BotonPulso({ activo, onChange }: { activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={activo} onClick={() => onChange(!activo)} className="boton-contorno shrink-0">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 3h6l4 18H5L9 3z" />
        <path d="M12 16l5-9" />
        <path d="M7.5 16h9" />
        {!activo && <path d="M3 3l18 18" />}
      </svg>
      Clic
    </button>
  );
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
