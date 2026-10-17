import { useState } from "react";
import { Baldo } from "@/components/Baldo";
import { Partitura } from "@/components/Partitura";
import type { Compas } from "@/musica/compases";
import { figura } from "@/musica/figuras";
import type { Correccion } from "@/practica/ejercicios";

/** Resultado integrado bajo la respuesta: Baldo, «X de N pulsos», «Ver solución» y «Siguiente». */
export function ResultadoEjercicio({ compas: c, numCompases, correccion, onSiguiente, ultimo }: { compas: Compas; numCompases: number; correccion: Correccion; onSiguiente?: () => void; ultimo?: boolean }) {
  const [ver, setVer] = useState(false);
  const bien = correccion.aciertos.filter(Boolean).length;
  const total = correccion.aciertos.length;
  const estadosSol = correccion.aciertos.map((ok) => (ok ? null : ("fallo" as const)));
  const equivalencias = correccion.equivalencias.map((e, i) => ({ e, i })).filter((x) => x.e);

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <Baldo estado={correccion.acierto ? "acierto" : "fallo"} className="size-14 sm:size-14" />
        <div>
          <p className="font-sans text-3xl leading-none font-bold tabular-nums">
            {bien} de {total} pulsos
          </p>
          <button type="button" onClick={() => setVer(!ver)} className="mt-1 text-sm font-medium text-primary underline underline-offset-2">
            {ver ? "Ocultar solución" : "Ver solución"}
          </button>
        </div>
      </div>
      {equivalencias.length > 0 && (
        <ul className="space-y-1.5">
          {equivalencias.map(({ e, i }) => (
            <li key={i} className="pulso pulso-ok">
              <span>Suena igual: aquí iba {figura(e!).nombre.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      )}
      {ver && <Partitura compas={c} ids={correccion.solucion} numCompases={numCompases} silabas estados={estadosSol} etiqueta="Solución" />}
      {onSiguiente && <button type="button" onClick={onSiguiente} className="boton boton-primario w-full">
        {ultimo ? "Ver resumen" : "Siguiente"}
      </button>}
    </div>
  );
}
