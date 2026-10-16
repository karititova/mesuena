import { cn } from "@/lib/utils";

export function Segmentado<T extends string | number>({
  etiqueta,
  opciones,
  valor,
  onChange,
}: {
  etiqueta: string;
  opciones: { valor: T; texto: string }[];
  valor: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => (
          <button
            key={String(o.valor)}
            type="button"
            aria-pressed={o.valor === valor}
            onClick={() => onChange(o.valor)}
            className={cn(
              "min-h-11 min-w-14 rounded-[12px] border px-3 text-sm font-medium transition-colors",
              o.valor === valor
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-accent",
            )}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
