import { cn } from "@/lib/utils";
import type { Compas } from "@/musica/compases";
import { repartirEnCompases } from "@/musica/compases";
import { esSilencio, figura } from "@/musica/figuras";

export type EstadoMarcador = "ok" | "fallo" | null;

/**
 * Marcadores de pulso en HTML (sin partitura). Durante la reproducción muestran la duración:
 * una nota enciende su punto y crece como cápsula pulso a pulso; un silencio es un aro vacío.
 * Un pulso con varias notas cortas es un solo punto. Con `onTocar` cada pulso es un botón.
 */
export function Marcadores(props: {
  compas: Compas;
  ids: string[];
  numCompases: number;
  progreso?: number | null;
  estados?: EstadoMarcador[];
  onTocar?: (pulso: number) => void;
  seleccionado?: number | null;
}) {
  const { compas: c, ids, numCompases, progreso, estados, onTocar, seleccionado } = props;
  const compases = repartirEnCompases(ids, c);
  let global = 0;
  return (
    <div className="space-y-2" aria-label="Marcadores de pulso">
      {Array.from({ length: numCompases }, (_, m) => {
        const figs = compases[m] ?? [];
        const usados = figs.reduce((a, id) => a + figura(id).pulsos, 0);
        const bloques = [
          ...figs.map((id) => ({ id: id as string | null, pulsos: figura(id).pulsos })),
          ...Array.from({ length: Math.max(0, c.pulsos - usados) }, () => ({ id: null as string | null, pulsos: 1 })),
        ];
        const fila = (
          <div key={m} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${c.pulsos}, minmax(0, 1fr))` }}>
            {bloques.map((b, k) => {
              const p0 = global;
              global += b.pulsos;
              const enCurso = progreso != null && b.id !== null && progreso >= p0;
              const silencio = b.id !== null && esSilencio(figura(b.id));
              const llenos = enCurso ? Math.min(b.pulsos, progreso! - p0 + 1) : 0;
              return (
                <div key={k} className="relative flex h-12 items-center" style={{ gridColumn: `span ${b.pulsos}` }}>
                  {enCurso && !silencio && (
                    <span
                      className="absolute left-[calc(50%/var(--n))] h-4 rounded-full bg-primary transition-[width] duration-150"
                      style={{ ["--n" as string]: b.pulsos, width: `calc(${(llenos - 1) / b.pulsos} * 100% + 1rem)`, transform: "translateX(-0.5rem)" }}
                    />
                  )}
                  {Array.from({ length: b.pulsos }, (_, i) => {
                    const idx = p0 + i;
                    const est = estados?.[idx] ?? null;
                    const aro = enCurso && silencio;
                    const tapado = enCurso && !silencio;
                    const punto = (
                      <span
                        className={cn(
                          "block rounded-full transition-all",
                          aro
                            ? "size-4 border-2 border-primary bg-transparent"
                            : tapado
                              ? "size-4 bg-transparent"
                              : est === "ok"
                                ? "size-4 bg-primary"
                                : est === "fallo"
                                  ? "size-4 bg-destructive"
                                  : seleccionado === idx
                                    ? "size-5 bg-foreground"
                                    : "size-2.5 bg-muted-foreground/50",
                        )}
                      />
                    );
                    return (
                      <div key={i} className="flex flex-1 justify-center">
                        {onTocar ? (
                          <button
                            type="button"
                            onClick={() => onTocar(idx)}
                            aria-label={`Pulso ${idx + 1}`}
                            aria-pressed={seleccionado === idx}
                            className={cn(
                              "flex size-12 items-center justify-center rounded-full",
                              seleccionado === idx ? "bg-marron-claro" : "",
                            )}
                          >
                            {punto}
                          </button>
                        ) : (
                          punto
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
        return fila;
      })}
    </div>
  );
}
