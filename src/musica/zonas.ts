/** Límites musicales: cada pulso acaba en el siguiente ataque de pulso o en la barra. */
export function limitesPulsos(notas: { unidad: number; x: number }[], pulsos: number, unidadesPulso: number, barra: number): number[] {
  return Array.from({ length: pulsos + 1 }, (_, p) => {
    if (p === pulsos) return barra;
    const u = p * unidadesPulso;
    const anterior = notas.filter((n) => n.unidad <= u).at(-1);
    const siguiente = notas.find((n) => n.unidad > u);
    if (!anterior) return notas[0]?.x ?? 0;
    const fin = siguiente ?? { unidad: pulsos * unidadesPulso, x: barra };
    return anterior.x + (fin.x - anterior.x) * (u - anterior.unidad) / (fin.unidad - anterior.unidad);
  });
}