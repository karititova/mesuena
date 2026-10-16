import type { ReactNode } from "react";

/** Cabecera de pantalla: halo difuminado, titular en Fraunces y píldora de contexto. */
export function Cabecera({ titulo, contexto, volver }: { titulo: string; contexto?: string; volver?: ReactNode }) {
  return (
    <header className="relative pb-2 pt-4">
      <div className="cabecera-halo pointer-events-none absolute -inset-x-24 -top-24 h-64" aria-hidden />
      <div className="relative space-y-2">
        {volver && <div className="min-h-6 text-sm font-medium text-muted-foreground">{volver}</div>}
        <h1 className="font-display text-[34px] leading-tight font-bold text-foreground">{titulo}</h1>
        {contexto && <span className="pildora">{contexto}</span>}
      </div>
    </header>
  );
}

/** Contenedor de pantalla: centrado, 720 px máximo. */
export function Pantalla({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[720px] space-y-5 overflow-x-hidden px-4 pb-16">{children}</main>;
}
