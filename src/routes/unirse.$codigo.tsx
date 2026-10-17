import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Baldo } from "@/components/Baldo";
import { Cabecera, Pantalla } from "@/components/Cabecera";
import { ComparacionError } from "@/components/ComparacionError";
import { EjercicioVista } from "@/components/Ejercicios";
import { Partitura } from "@/components/Partitura";
import { ResultadoEjercicio } from "@/components/ResultadoEjercicio";
import { compas as getCompas } from "@/musica/compases";
import { idDispositivo } from "@/practica/almacen";
import { enviarRespuesta, estadoSala, unirse, type VistaAlumno } from "@/clase/alumno.functions";
import { codigoValido, entradaDe, normalizarCodigo } from "@/clase/sala";
import { useCambiosSala } from "@/clase/useCambiosSala";
import { numeroRonda } from "@/clase/rondas";

export const Route = createFileRoute("/unirse/$codigo")({
  head: () => ({
    meta: [
      { title: "Clase en directo · Me suena" },
      { name: "description", content: "Únete a la clase de ritmo con tu apodo y responde desde el móvil." },
      { property: "og:title", content: "Clase en directo · Me suena" },
      { property: "og:description", content: "Únete a la clase de ritmo con tu apodo y responde desde el móvil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClaseAlumno,
});

const K_APODO = "me-suena-apodo";

function ClaseAlumno() {
  const codigo = normalizarCodigo(Route.useParams().codigo);
  const [dispositivo, setDispositivo] = useState<string | null>(null);
  useEffect(() => setDispositivo(idDispositivo()), []);
  const cargar = useServerFn(estadoSala);
  const q = useQuery({
    queryKey: ["clase", codigo, dispositivo],
    queryFn: () => cargar({ data: { codigo, dispositivo: dispositivo! } }),
    enabled: !!dispositivo && codigoValido(codigo),
    refetchInterval: 15000,
  });
  useCambiosSala(q.data?.sesionId, () => q.refetch());
  const v = q.data;

  const volver = <Link to="/unirse">← Otro código</Link>;
  if (!codigoValido(codigo) || (v && !v.existe))
    return (
      <Pantalla>
        <Cabecera titulo="Código no encontrado" volver={volver} />
        <p className="tarjeta text-lg">No hay ninguna clase con el código {codigo}. Revisa las letras con tu profesora.</p>
      </Pantalla>
    );
  if (!v) return <Pantalla><p className="pt-10 text-muted-foreground">Conectando…</p></Pantalla>;
  if (!v.yo) {
    if (v.estado === "terminada")
      return (
        <Pantalla>
          <Cabecera titulo="Clase terminada" volver={volver} />
          <p className="tarjeta text-lg">Esta clase ya ha terminado.</p>
        </Pantalla>
      );
    return <Apodo codigo={codigo} dispositivo={dispositivo!} alEntrar={() => q.refetch()} />;
  }
  const contexto = `${v.yo.apodo} · ${codigo}`;

  if (v.estado === "espera")
    return (
      <Pantalla>
        <Cabecera titulo="Esperando a que empiece" contexto={contexto} />
        <section className="tarjeta flex flex-col items-center gap-4 text-center">
          <Baldo estado="espera" className="size-24 sm:size-24" />
          <p className="text-muted-foreground">{v.apodos!.length} en la clase</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {v.apodos!.map((a, i) => <li key={i} className="pildora">{a}</li>)}
          </ul>
        </section>
      </Pantalla>
    );

  if (v.estado === "terminada")
    return (
      <Pantalla>
        <Cabecera titulo="Clase terminada" contexto={contexto} />
        <section className="tarjeta flex flex-col items-center gap-4 text-center">
          <Baldo estado={v.misAciertos! >= Math.ceil(v.total! * 0.8) ? "celebracion" : "neutro"} className="size-24 sm:size-24" />
          <p className="font-sans text-5xl font-bold tabular-nums">{v.misAciertos} de {v.total}</p>
          <p className="text-muted-foreground">preguntas bien</p>
          <Link to="/repaso/$codigo" params={{ codigo }} className="boton boton-primario w-full">Tu repaso</Link>
        </section>
      </Pantalla>
    );

  return <PreguntaAlumno key={`${v.actual}-${v.estado}`} v={v} codigo={codigo} dispositivo={dispositivo!} contexto={contexto} alEnviar={() => q.refetch()} />;
}

function Apodo({ codigo, dispositivo, alEntrar }: { codigo: string; dispositivo: string; alEntrar: () => void }) {
  const entrar = useServerFn(unirse);
  const [apodo, setApodo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => setApodo(localStorage.getItem(K_APODO) ?? ""), []);
  return (
    <Pantalla>
      <Cabecera titulo="¿Cómo te llamamos?" contexto={`Clase ${codigo}`} volver={<Link to="/unirse">← Otro código</Link>} />
      <form
        className="tarjeta space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const a = apodo.trim();
          if (!a) return;
          setEnviando(true);
          const r = await entrar({ data: { codigo, dispositivo, apodo: a } });
          setEnviando(false);
          if (r.ok) {
            localStorage.setItem(K_APODO, a);
            alEntrar();
          } else setError(r.motivo === "terminada" ? "Esta clase ya ha terminado." : r.motivo === "noexiste" ? "Este código no existe." : "No se ha podido entrar. Inténtalo otra vez.");
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Apodo</span>
          <input value={apodo} onChange={(e) => setApodo(e.target.value.slice(0, 24))} maxLength={24} autoComplete="nickname" className="campo" />
          <span className="block text-sm text-muted-foreground">Es lo que verá la clase. No hace falta tu nombre real.</span>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={!apodo.trim() || enviando} className="boton boton-primario w-full">Entrar</button>
      </form>
    </Pantalla>
  );
}

function PreguntaAlumno({ v, codigo, dispositivo, contexto, alEnviar }: { v: VistaAlumno; codigo: string; dispositivo: string; contexto: string; alEnviar: () => void }) {
  const enviar = useServerFn(enviarRespuesta);
  const inicio = useRef(Date.now());
  const [enviada, setEnviada] = useState(!!v.enviada);
  const cfg = v.cfg!;
  const c = getCompas(cfg.compas);
  const nr = numeroRonda(v.actual ?? 0, v.inicioRonda ?? 0, v.preguntasRonda ?? v.total ?? 0, v.ronda ?? 1);
  const titulo = `Ronda ${nr.ronda} · Pregunta ${nr.pregunta} de ${nr.total}`;
  const ej = v.ejercicio;
  if (!ej) return <Pantalla><Cabecera titulo={titulo} contexto={contexto} /></Pantalla>;

  if (v.estado === "revelada") {
    const solucion = ej.tipo === "error" ? ej.suena! : ej.ritmo;
    return (
      <Pantalla>
        <Cabecera titulo={titulo} contexto={contexto} />
        <section className="tarjeta space-y-4">
          {v.correccion ? (
            <>
              {ej.tipo === "cual" && <p className="text-sm font-medium">Era la {(ej.correcta ?? 0) + 1}.</p>}
              {ej.tipo === "error" ? (
                <ComparacionError compas={c} escrito={ej.ritmo} sonado={ej.suena!} pulso={ej.errorPulso!} numCompases={cfg.numCompases} compacta />
              ) : (
                <Partitura
                  compas={c}
                  ids={v.correccion.respuesta}
                  numCompases={cfg.numCompases}
                  silabas={false}
                  estados={v.correccion.aciertos.map((ok) => (ok ? "ok" : "fallo"))}
                  etiqueta="Tu respuesta"
                />
              )}
              <ResultadoEjercicio compas={c} numCompases={cfg.numCompases} ppm={cfg.ppm} correccion={v.correccion} />
            </>
          ) : (
            <>
              <p className="text-muted-foreground">No enviaste respuesta a esta pregunta. Esta era la solución:</p>
              <Partitura compas={c} ids={solucion} numCompases={cfg.numCompases} silabas etiqueta="Solución" />
            </>
          )}
          <p className="font-medium">Lo puso bien el {v.pctClase} % de la clase.</p>
        </section>
      </Pantalla>
    );
  }

  if (enviada)
    return (
      <Pantalla>
        <Cabecera titulo={titulo} contexto={contexto} />
        <section className="tarjeta flex flex-col items-center gap-4 py-10 text-center">
          <Baldo estado="espera" className="size-24 sm:size-24" />
          <p className="font-display text-[26px] font-bold">Enviado, espera a la profesora</p>
        </section>
      </Pantalla>
    );

  return (
    <Pantalla>
      <Cabecera titulo={titulo} contexto={contexto} />
      {nr.ronda > 1 && nr.pregunta === 1 && <p role="status" className="text-primary">Nueva ronda: {cfg.compas}, nivel {cfg.nivel}</p>}
      <EjercicioVista
        ej={ej}
        cfg={{ ...cfg, ejercicio: ej.tipo }}
        compas={c}
        correccion={null}
        accion="Enviar"
        onCorregir={async (corr) => {
          setEnviada(true);
          // En «Encuentra el error» y «¿Cuál suena?» la corrección local no conoce la solución: solo se envía lo elegido.
          const entrada = entradaDe(corr, { ...ej, errorPulso: ej.errorPulso ?? -1, correcta: ej.correcta ?? -1 });
          const r = await enviar({ data: { codigo, dispositivo, entrada, tiempoMs: Date.now() - inicio.current } });
          if (!r.ok && r.motivo !== "cerrada") setEnviada(false);
          alEnviar();
        }}
      />
    </Pantalla>
  );
}
