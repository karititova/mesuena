import { useState } from "react";
import { Baldo } from "@/components/Baldo";
import { Partitura } from "@/components/Partitura";
import { useReproductor } from "@/components/Reproduccion";
import type { Compas } from "@/musica/compases";
import { figura } from "@/musica/figuras";
import type { Correccion } from "@/practica/ejercicios";

/** Resultado integrado bajo la respuesta: Baldo, «Ver solución» (con «Oír la solución») y «Siguiente». */
export function ResultadoEjercicio({ compas: c, numCompases, ppm, correccion, onSiguiente, ultimo }: { compas: Compas; numCompases: number; ppm: number; correccion: Correccion; onSiguiente?: () => void; ultimo?: boolean }) {
  const [ver, setVer] = useState(false);
  const r = useReproductor(c, ppm, numCompases);
  const estadosSol = correccion.aciertos.map((ok) => (ok ? null : ("fallo" as const)));
  const equivalencias = correccion.equivalencias.map((e, i) => ({ e, i })).filter((x) => x.e);

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <Baldo estado={correccion.acierto ? "acierto" : "fallo"} className="size-14 sm:size-14" />
        <button type="button" onClick={() => setVer(!ver)} className="text-sm font-medium text-primary underline underline-offset-2">
          {ver ? "Ocultar solución" : "Ver solución"}
        </button>
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
      {ver && (
        <div className="space-y-2">
          <Partitura compas={c} ids={correccion.solucion} numCompases={numCompases} silabas estados={estadosSol} marca={r.marca} etiqueta="Solución" />
          <button type="button" onClick={() => (r.sonando ? r.detener() : r.tocar("sol", correccion.solucion))} className="boton boton-secundario px-5">
            {r.sonando ? "■ Parar" : "▶ Oír la solución"}
          </button>
        </div>
      )}
      {onSiguiente && <button type="button" onClick={onSiguiente} className="boton boton-primario w-full">
        {ultimo ? "Ver resumen" : "Siguiente"}
      </button>}
    </div>
  );
}
