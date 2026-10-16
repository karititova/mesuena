import { cn } from "@/lib/utils";
import neutro from "@/assets/baldo-neutro.png.asset.json";
import acierto from "@/assets/baldo-acierto.png.asset.json";
import fallo from "@/assets/baldo-fallo.png.asset.json";
import espera from "@/assets/baldo-espera.png.asset.json";
import celebracion from "@/assets/baldo-celebracion.png.asset.json";

export type EstadoBaldo = "neutro" | "acierto" | "fallo" | "espera" | "celebracion";

const IMAGENES: Record<EstadoBaldo, string> = {
  neutro: neutro.url,
  acierto: acierto.url,
  fallo: fallo.url,
  espera: espera.url,
  celebracion: celebracion.url,
};

/** Tamaño por defecto 120 px (móvil) / 160 px (ancho); ajustable con className (p. ej. "size-20"). */
export function Baldo({ estado = "neutro", className }: { estado?: EstadoBaldo; className?: string }) {
  return (
    <div
      className={cn("baldo relative size-[120px] shrink-0 sm:size-[160px]", className)}
      data-estado={estado}
      role="img"
      aria-label={`Baldo, ${estado}`}
    >
      <div className="baldo-halo absolute -inset-[15%] rounded-full" aria-hidden />
      {(Object.keys(IMAGENES) as EstadoBaldo[]).map((e) => (
        <img
          key={e}
          src={IMAGENES[e]}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 size-full object-contain mix-blend-multiply transition-opacity duration-300 ease-out",
            e === estado ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}
