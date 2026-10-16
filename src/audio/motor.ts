// Motor de sonido: todo programado con Tone.Transport + Tone.Part (nunca setTimeout).
import type * as ToneNS from "tone";
import { figura } from "@/musica/figuras";
import type { Compas } from "@/musica/compases";

type ToneT = typeof ToneNS;
let Tone: ToneT | null = null;
let ritmoSynth: ToneNS.Synth | null = null;
let metroSynth: ToneNS.MembraneSynth | null = null;
let parte: ToneNS.Part | null = null;

/** Hueco de silencio antes de la nota siguiente (s). */
export const HUECO = 0.04;
/** Refuerzo de la primera nota de cada pulso (~2,5 dB). */
export const VEL_PULSO = 1;
export const VEL_NOTA = Math.pow(10, -2.5 / 20);

/**
 * Voz del ritmo: percusión afinada tipo marimba/piano suave.
 * Ataque redondo y corto, resonancia que se apaga sola (sustain bajo).
 */
export const RITMO_VOZ = {
  nota: "A4", // La4 = 440 Hz
  oscilan: "triangle" as const,
  filtroHz: 1800,
  envolvente: { attack: 0.005, decay: 1.2, sustain: 0.15, release: 0.06 },
  volumen: -8,
};

/** Debe llamarse desde un gesto del usuario (iPhone). Devuelve false si no hay audioSession. */
export async function iniciarAudio(): Promise<{ audioSession: boolean }> {
  if (!Tone) Tone = await import("tone");
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
  await Tone.start();
  if (!ritmoSynth) {
    const reverb = new Tone.Reverb({ decay: 0.8, wet: 0.2 }).toDestination();
    const filtro = new Tone.Filter(RITMO_VOZ.filtroHz, "lowpass").connect(reverb);
    ritmoSynth = new Tone.Synth({
      oscillator: { type: RITMO_VOZ.oscilan },
      envelope: RITMO_VOZ.envolvente,
    }).connect(filtro);
    ritmoSynth.volume.value = RITMO_VOZ.volumen;
    metroSynth = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
    }).toDestination();
    metroSynth.volume.value = -8;
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
  ritmoSynth?.triggerRelease();
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
  conPulso = true,
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
    // Sin «Pulso» el evento sigue existiendo (mueve el contador) pero no suena.
    const vel = enEntrada ? (fuerte ? 1 : 0.6) : conPulso ? (fuerte ? 0.35 : 0.2) : 0;
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
  conPulso = true,
) {
  await iniciarAudio();
  if (!Tone) return;
  parar();
  const T = Tone;
  const { eventos, fin } = eventosDe(c, ids, ppm, numCompases, conPulso);
  parte = new T.Part<Evento>((time, ev) => {
    if (ev.tipo === "ritmo") ritmoSynth!.triggerAttackRelease(RITMO_VOZ.nota, ev.dur!, time, ev.vel);
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
  transport.start("+0.1");
}
