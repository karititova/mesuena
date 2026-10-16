import { MiniFigura } from "@/components/Partitura";
import { cabe, type Compas } from "@/musica/compases";
import { figura } from "@/musica/figuras";

export const silabaVisible = (s: string) => (s === "(silencio)" ? "silencio" : s);

/** Paleta compacta: botones de 48 px, tres o cuatro por fila, mini partitura y sílaba en pequeño. */
export function Paleta({ ids, compas: c, respuesta, numCompases, onAñadir }: { ids: string[]; compas: Compas; respuesta: string[]; numCompases: number; onAñadir: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4">
      {ids.map((id) => {
        const f = figura(id);
        const ok = cabe(id, respuesta, c, numCompases);
        return (
          <button
            key={id}
            type="button"
            disabled={!ok}
            onClick={() => onAñadir(id)}
            aria-label={`Añadir ${f.nombre}`}
            className="flex h-12 items-center justify-center gap-0.5 overflow-hidden rounded-[12px] border border-marron-claro bg-card px-1 transition-transform active:scale-[0.97] active:bg-primario-claro disabled:opacity-40"
          >
            <MiniFigura id={id} compas={c} desactivada={!ok} pequeña />
            <span className="truncate text-[10px] font-semibold text-muted-foreground">{silabaVisible(f.silaba)}</span>
          </button>
        );
      })}
    </div>
  );
}
