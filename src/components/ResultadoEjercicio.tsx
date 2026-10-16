import { useState } from "react";
import { Baldo } from "@/components/Baldo";
import { Partitura } from "@/components/Partitura";
import type { Compas } from "@/musica/compases";
import { figura } from "@/musica/figuras";
import type { Correccion } from "@/practica/ejercicios";

/** Corrección común a los tres ejercicios: Baldo, «X de N pulsos», solución alineada y «Siguiente». */
export function ResultadoEjercicio({ compas: c, numCompases, correccion, onSiguiente, ultimo }: { compas: Compas; numCompases: number; correccion: Correccion; onSiguiente: () => void; ultimo: boolean }) {
  const [ver, setVer] = useState(false);
  const bien = correccion.aciertos.filter(Boolean).length;
  const total = correccion.aciertos.length;
  const estadosResp = correccion.aciertos.map((ok) => (ok ? ("ok" as const) : ("fallo" as const)));
  const estadosSol = correccion.aciertos.map((ok) => (ok ? null : ("fallo" as const)));
  const equivalencias = correccion.equivalencias.map((e, i) => ({ e, i })).filter((x) => x.e);

  return (
    <section className="tarjeta space-y-4" aria-live="polite">
      <div className="flex items-center gap-4">
        <Baldo estado={correccion.acierto ? "acierto" : "fallo"} className="size-[72px] sm:size-[72px]" />
        <div>
          <p className="font-sans text-4xl font-bold tabular-nums">
            {bien} de {total}
          </p>
          <p className="text-sm text-muted-foreground">pulsos</p>
        </div>
      </div>
      {equivalencias.length > 0 && (
        <ul className="space-y-1.5">
          {equivalencias.map(({ e, i }) => (
            <li key={i} className="pulso pulso-ok">
              <span className="font-semibold">Pulso {i + 1}</span>
              <span>Suena igual: aquí iba {figura(e!).nombre.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      )}
      {ver && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tu respuesta</p>
          <Partitura compas={c} ids={correccion.respuesta} numCompases={numCompases} silabas={false} estados={estadosResp} etiqueta="Tu respuesta corregida" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solución</p>
          <Partitura compas={c} ids={correccion.solucion} numCompases={numCompases} silabas estados={estadosSol} etiqueta="Solución" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setVer(!ver)} className="boton boton-secundario">
          {ver ? "Ocultar solución" : "Ver solución"}
        </button>
        <button type="button" onClick={onSiguiente} className="boton boton-primario">
          {ultimo ? "Ver resumen" : "Siguiente"}
        </button>
      </div>
    </section>
  );
}
