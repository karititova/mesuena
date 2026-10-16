import { cn } from "@/lib/utils";

export type EstadoBaldo = "neutro" | "acierto" | "fallo" | "espera" | "celebracion";

/** Imágenes PNG (fondo blanco) que se conectarán más adelante. */
const IMAGENES: Partial<Record<EstadoBaldo, string>> = {};

const ETIQUETA: Record<EstadoBaldo, string> = {
  neutro: "Baldo",
  acierto: "¡Bien!",
  fallo: "Casi",
  espera: "…",
  celebracion: "¡Genial!",
};

export function Baldo({ estado = "neutro", className }: { estado?: EstadoBaldo; className?: string }) {
  const img = IMAGENES[estado];
  return (
    <div className={cn("baldo relative grid size-32 place-items-center", className)} data-estado={estado}>
      <div className="baldo-halo absolute -inset-6 rounded-full" aria-hidden />
      {img ? (
        <img src={img} alt={`Baldo, ${estado}`} className="relative size-full object-contain mix-blend-multiply" />
      ) : (
        <div
          className="relative grid size-24 place-items-center rounded-full border-2 border-dashed border-marron/40 bg-card/60 font-display text-sm text-marron"
          role="img"
          aria-label={`Baldo, ${estado}`}
        >
          {ETIQUETA[estado]}
        </div>
      )}
    </div>
  );
}
