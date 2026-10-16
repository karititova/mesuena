import { MiniFigura } from "@/components/Partitura";
import { cabe, type Compas } from "@/musica/compases";
import { figura } from "@/musica/figuras";

export const silabaVisible = (s: string) => (s === "(silencio)" ? "silencio" : s);

/** Paleta para montar una respuesta con las figuras elegidas. */
export function Paleta({ ids, compas: c, respuesta, numCompases, onAñadir }: { ids: string[]; compas: Compas; respuesta: string[]; numCompases: number; onAñadir: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ids.map((id) => {
        const f = figura(id);
        const ok = cabe(id, respuesta, c, numCompases);
        return (
          <button key={id} type="button" disabled={!ok} onClick={() => onAñadir(id)} aria-label={`Añadir ${f.nombre}`} className="boton-paleta">
            <MiniFigura id={id} compas={c} desactivada={!ok} />
            <span className="text-xs font-semibold text-muted-foreground">{silabaVisible(f.silaba)}</span>
          </button>
        );
      })}
    </div>
  );
}
