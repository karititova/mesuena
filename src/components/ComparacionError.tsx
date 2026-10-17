import { Partitura } from "@/components/Partitura";
import type { Compas } from "@/musica/compases";
import { expandirPulsos } from "@/musica/comprobador";

/** Pulso en el que dos ritmos dejan de coincidir (para «Encuentra el error» cuando no se conoce errorPulso). */
export function pulsoDiferente(escrito: string[], sonado: string[]): number {
  const a = expandirPulsos(escrito);
  const b = expandirPulsos(sonado);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]?.figuraId !== b[i]?.figuraId) return i;
  }
  return -1;
}

/**
 * «Encuentra el error» al revelar: «Lo escrito» y «Lo que sonó» una debajo de otra,
 * con el pulso que difiere marcado en terracota en las dos.
 */
export function ComparacionError({ compas, escrito, sonado, pulso, numCompases, compacta }: { compas: Compas; escrito: string[]; sonado: string[]; pulso: number; numCompases: number; compacta?: boolean }) {
  const total = expandirPulsos(escrito).length;
  const estados = Array.from({ length: total }, (_, i) => (i === pulso ? ("fallo" as const) : null));
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-muted-foreground">Lo escrito</p>
        <Partitura compas={compas} ids={escrito} numCompases={numCompases} silabas={false} estados={estados} etiqueta="Lo escrito" compacta={compacta} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-muted-foreground">Lo que sonó</p>
        <Partitura compas={compas} ids={sonado} numCompases={numCompases} silabas={false} estados={estados} etiqueta="Lo que sonó" compacta={compacta} />
      </div>
    </div>
  );
}
