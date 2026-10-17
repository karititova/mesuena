// Motor de sonido: todo programado con Tone.Transport + Tone.Part (nunca setTimeout).
import type * as ToneNS from "tone";
import { figura } from "@/musica/figuras";
import type { Compas } from "@/musica/compases";

type ToneT = typeof ToneNS;
let Tone: ToneT | null = null;
let ritmoSynth: ToneNS.PolySynth<ToneNS.MembraneSynth> | null = null;
let metroSynth: ToneNS.MembraneSynth | null = null;
let parte: ToneNS.Part | null = null;
let limitador: ToneNS.Limiter | null = null;
let escuchaVisible = false;

/** Hueco de silencio antes de la nota siguiente (s). */
export const HUECO = 0.04;
/** Refuerzo de la primera nota de cada pulso (~2,5 dB). */
export const VEL_PULSO = 1;
export const VEL_NOTA = Math.pow(10, -2.5 / 20);

/**
 * Voz del ritmo: bloque de madera. Altura y timbre de la primera versión del laboratorio (La5); siempre la misma duración corta;
 * polifónico para que ningún ataque se solape con el anterior; sin deslizamiento de altura.
 * El acento de la primera nota de cada pulso es solo de volumen.
 */
export const RITMO_VOZ = {
  nota: "A5",
  golpe: 0.05,
  pitchDecay: 0.006,
  octaves: 1.5,
  envolvente: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 },
  volumen: 10,
};

let compresor: ToneNS.Compressor | null = null;

function crearSintes(T: ToneT) {
  ritmoSynth?.dispose();
  metroSynth?.dispose();
  compresor?.dispose();
  limitador?.dispose();
  // Compresor (sube el volumen percibido) + limitador a -0,5 dB: suena fuerte sin distorsión.
  limitador = new T.Limiter(-0.5).toDestination();
  compresor = new T.Compressor({ threshold: -24, ratio: 4 }).connect(limitador);
  ritmoSynth = new T.PolySynth(T.MembraneSynth, {
    pitchDecay: RITMO_VOZ.pitchDecay,
    octaves: RITMO_VOZ.octaves,
    envelope: RITMO_VOZ.envolvente,
  }).connect(compresor!);
  ritmoSynth.volume.value = RITMO_VOZ.volumen;
  metroSynth = new T.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
  }).connect(compresor!);
  metroSynth.volume.value = 4;
}

const estado = (T: ToneT) => T.getContext().rawContext.state as string;

async function esperarActivo(T: ToneT, ms = 600) {
  const fin = performance.now() + ms;
  while (estado(T) !== "running" && performance.now() < fin) {
    try {
      await T.start();
      await (T.getContext().rawContext as AudioContext).resume();
    } catch {
      /* se reintenta */
    }
    if (estado(T) !== "running") await new Promise((r) => requestAnimationFrame(() => r(null)));
  }
  return estado(T) === "running";
}

/** Debe llamarse desde un gesto del usuario (iPhone). Recupera el audio tras bloquear o cambiar de app. */
export async function iniciarAudio(): Promise<{ audioSession: boolean }> {
  if (!Tone) Tone = await import("tone");
  const T = Tone;
  // lookAhead mayor en móvil: el primer golpe no sale cortado tras cargar.
  T.getContext().lookAhead = 0.2;
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  let audioSession = false;
  if (nav.audioSession) {
    try {
      nav.audioSession.type = "playback";
      audioSession = true;
    } catch {
      /* no soportado */
    }
  }
  if (!escuchaVisible) {
    escuchaVisible = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && estado(T) !== "running") {
        (T.getContext().rawContext as AudioContext).resume?.().catch(() => {});
      }
    });
  }
  let nuevo = false;
  if (!(await esperarActivo(T))) {
    // «interrupted» o «closed»: contexto nuevo y sintetizadores nuevos.
    parte?.dispose();
    parte = null;
    T.setContext(new T.Context());
    nuevo = true;
    await esperarActivo(T);
  }
  if (!ritmoSynth || nuevo) {
    crearSintes(T);
    // «Calienta» el sintetizador con una nota silenciosa antes del primer clic.
    try {
      ritmoSynth!.triggerAttackRelease(RITMO_VOZ.nota, 0.02, T.now(), 0);
    } catch {
      /* sin gesto aún */
    }
  }
  return { audioSession };
}

export function parar() {
  if (!Tone) return;
  const t = Tone.getTransport();
  t.stop();
  t.cancel(0);
  t.position = 0;
  parte?.dispose();
  parte = null;
}

export interface Evento {
  time: number;
  tipo: "ritmo" | "metro";
  vel: number;
  /** Duración sonora de la nota de ritmo (s). */
  dur?: number;
  fuerte?: boolean;
  /** Pulso relativo al inicio del ritmo (negativo durante la entrada). */
  pulso?: number;
}

export function eventosDe(
  c: Compas,
  ids: string[],
  ppm: number,
  numCompases: number,
): { eventos: Evento[]; fin: number } {
  const segPulso = 60 / ppm;
  const segUnidad = segPulso / c.unidadesPulso;
  const pulsosEntrada = c.pulsos; // siempre 1 compás de entrada
  const offset = pulsosEntrada * segPulso;
  const eventos: Evento[] = [];
  const totalPulsos = pulsosEntrada + numCompases * c.pulsos;
  for (let p = 0; p < totalPulsos; p++) {
    const enEntrada = p < pulsosEntrada;
    const fuerte = p % c.pulsos === 0;
    // Tras la entrada el evento sigue existiendo (mueve el marcador) pero no suena.
    const vel = enEntrada ? (fuerte ? 1 : 0.6) : 0;
    eventos.push({ time: p * segPulso, tipo: "metro", fuerte, vel, pulso: p - pulsosEntrada });
  }
  // Notas: cada una dura hasta la siguiente nota o silencio, menos el hueco.
  const notas: { u: number; silencio: boolean }[] = [];
  let u = 0;
  for (const id of ids) {
    for (const d of figura(id).duraciones) {
      notas.push({ u, silencio: !!d.silencio });
      u += d.unidades;
    }
  }
  notas.forEach((n, i) => {
    if (n.silencio) return;
    const sig = i + 1 < notas.length ? notas[i + 1]!.u : u;
    const inicioPulso = n.u % c.unidadesPulso === 0;
    eventos.push({
      time: offset + n.u * segUnidad,
      tipo: "ritmo",
      dur: Math.max(0.03, (sig - n.u) * segUnidad - HUECO),
      vel: inicioPulso ? VEL_PULSO : VEL_NOTA,
    });
  });
  return { eventos, fin: totalPulsos * segPulso };
}

export async function reproducir(
  c: Compas,
  ids: string[],
  ppm: number,
  numCompases: number,
  alTerminar?: () => void,
  alPulso?: (pulso: number) => void,
) {
  await iniciarAudio();
  if (!Tone) return;
  parar();
  const T = Tone;
  const { eventos, fin } = eventosDe(c, ids, ppm, numCompases);
  parte = new T.Part<Evento>((time, ev) => {
    if (ev.tipo === "ritmo") ritmoSynth!.triggerAttackRelease(RITMO_VOZ.nota, RITMO_VOZ.golpe, time, ev.vel);
    else {
      if (ev.vel > 0) metroSynth!.triggerAttackRelease(ev.fuerte ? "E2" : "C2", 0.04, time, ev.vel);
      if (alPulso && ev.pulso !== undefined) {
        const p = ev.pulso;
        T.getDraw().schedule(() => alPulso(p), time);
      }
    }
  }, eventos);
  parte.start(0);
  const transport = T.getTransport();
  transport.scheduleOnce((time) => {
    T.getDraw().schedule(() => {
      parar();
      alTerminar?.();
    }, time);
  }, fin + 0.3);
  transport.start("+0.2");
}
