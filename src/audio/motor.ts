// Motor de sonido: todo programado con Tone.Transport + Tone.Part (nunca setTimeout).
import type * as ToneNS from "tone";
import { figura } from "@/musica/figuras";
import type { Compas } from "@/musica/compases";

type ToneT = typeof ToneNS;
let Tone: ToneT | null = null;
let ritmoSynth: ToneNS.MembraneSynth | null = null;
let metroSynth: ToneNS.MembraneSynth | null = null;
let parte: ToneNS.Part | null = null;

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
    ritmoSynth = new Tone.MembraneSynth({
      pitchDecay: 0.006,
      octaves: 1.5,
      envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.02 },
    }).toDestination();
    ritmoSynth.volume.value = -4;
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
}

interface Evento {
  time: number;
  tipo: "ritmo" | "metro";
  vel: number;
  fuerte?: boolean;
}

export function eventosDe(c: Compas, ids: string[], ppm: number, numCompases: number): { eventos: Evento[]; fin: number } {
  const segPulso = 60 / ppm;
  const segUnidad = segPulso / c.unidadesPulso;
  const compasesEntrada = c.pulsos === 2 ? 2 : 1;
  const pulsosEntrada = compasesEntrada * c.pulsos;
  const offset = pulsosEntrada * segPulso;
  const eventos: Evento[] = [];
  const totalPulsos = pulsosEntrada + numCompases * c.pulsos;
  for (let p = 0; p < totalPulsos; p++) {
    const enEntrada = p < pulsosEntrada;
    const fuerte = p % c.pulsos === 0;
    eventos.push({ time: p * segPulso, tipo: "metro", fuerte, vel: enEntrada ? (fuerte ? 1 : 0.6) : fuerte ? 0.35 : 0.2 });
  }
  let u = 0;
  for (const id of ids) {
    for (const d of figura(id).duraciones) {
      if (!d.silencio) eventos.push({ time: offset + u * segUnidad, tipo: "ritmo", vel: 0.9 });
      u += d.unidades;
    }
  }
  return { eventos, fin: totalPulsos * segPulso };
}

export async function reproducir(
  c: Compas,
  ids: string[],
  ppm: number,
  numCompases: number,
  alTerminar?: () => void,
) {
  await iniciarAudio();
  if (!Tone) return;
  parar();
  const T = Tone;
  const { eventos, fin } = eventosDe(c, ids, ppm, numCompases);
  parte = new T.Part<Evento>((time, ev) => {
    if (ev.tipo === "ritmo") ritmoSynth!.triggerAttackRelease("A5", 0.05, time, ev.vel);
    else metroSynth!.triggerAttackRelease(ev.fuerte ? "E3" : "C3", 0.04, time, ev.vel);
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
