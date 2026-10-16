// Dibujo de partituras rítmicas con VexFlow 4.2. Solo navegador (importar dinámicamente).
import { BarlineType, Beam, Dot, Formatter, Fraction, GhostNote, Renderer, Stave, StaveNote, Voice } from "vexflow";
import type { StemmableNote } from "vexflow";
import { repartirEnCompases, type Compas } from "./compases";
import { figura } from "./figuras";

export type EstadoPulso = "ok" | "fallo" | null;

export interface OpcionesPartitura {
  compas: Compas;
  ids: string[];
  numCompases: number;
  silabas: boolean;
  estados?: EstadoPulso[] | undefined;
  /** Dibuja cada compás en su propia fila (móvil vertical). */
  filas?: boolean;
  /** Índice global del punto de pulso encendido (reproducción). */
  pulsoActivo?: number | null | undefined;
  /** Pulso del ritmo en curso durante la reproducción: muestra la duración (cápsula / aro). */
  progreso?: number | null | undefined;
  /** Pulso marcado (Encuentra el error): rectángulo redondeado detrás. */
  seleccionado?: number | null | undefined;
  colores: { tinta: string; secundario: string; ok: string; curso: string; seleccion: string; fallo: string; vacio: string };
}

const DUR_SIMPLE: Record<number, string> = { 16: "w", 12: "hd", 8: "h", 4: "q", 2: "8", 1: "16" };
const DUR_COMP: Record<number, string> = { 12: "hd", 6: "qd", 4: "q", 2: "8", 1: "16" };

function notasDeFigura(id: string, c: Compas, color?: string): StaveNote[] {
  const tabla = c.tipo === "simple" ? DUR_SIMPLE : DUR_COMP;
  return figura(id).duraciones.map((d) => {
    const dur = tabla[d.unidades]!;
    const nota = new StaveNote({
      keys: ["b/4"],
      duration: dur + (d.silencio ? "r" : ""),
      stem_direction: 1,
      clef: "percussion",
    });
    if (dur.endsWith("d")) Dot.buildAndAttach([nota], { all: true });
    if (color) {
      const st = { fillStyle: color, strokeStyle: color };
      nota.setStyle(st);
      nota.setStemStyle(st);
      nota.setFlagStyle(st);
      nota.getModifiers().forEach((m) => m.setStyle(st));
    }
    return nota;
  });
}

function crearSvg(div: HTMLDivElement, w: number, h: number) {
  div.innerHTML = "";
  const renderer = new Renderer(div, Renderer.Backends.SVG);
  renderer.resize(w, h);
  const ctx = renderer.getContext();
  const svg = div.querySelector("svg")!;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";
  return ctx;
}

const soloLineaCentral = (s: Stave) =>
  s.setConfigForLines([0, 1, 2, 3, 4].map((i) => ({ visible: i === 2 })));

const ANCHO_LETRA = 0.7;
let lienzo: CanvasRenderingContext2D | null | undefined;
function medir(t: string, tam: number): number {
  if (lienzo === undefined) lienzo = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  if (!lienzo) return t.length * tam * ANCHO_LETRA;
  lienzo.font = `600 ${tam}px Inter, sans-serif`;
  return lienzo.measureText(t).width + 2;
}

/** Agrupa las partes (separadas por guion) en n líneas lo más equilibradas posible. */
function agrupar(partes: string[], n: number, tam: number): string[] {
  if (n >= partes.length) return partes.map((p, i) => (i < partes.length - 1 ? p + "-" : p));
  let mejor: string[] = [];
  let mejorAncho = Infinity;
  const rec = (inicio: number, resto: number, acc: string[]) => {
    if (resto === 1) {
      const lineas = [...acc, partes.slice(inicio).join("-")];
      const a = Math.max(...lineas.map((l) => medir(l, tam)));
      if (a < mejorAncho) { mejorAncho = a; mejor = lineas; }
      return;
    }
    for (let fin = inicio + 1; fin <= partes.length - resto + 1 - 1 + 1 && fin < partes.length; fin++) {
      rec(fin, resto - 1, [...acc, partes.slice(inicio, fin).join("-") + "-"]);
    }
  };
  rec(0, n, []);
  return mejor;
}

/** Ajusta una sílaba al ancho de su pulso: baja hasta 11 px y, si no cabe, la parte por guiones en 2 o 3 líneas. */
export function ajustarSilaba(texto: string, ancho: number): { tam: number; lineas: string[] } {
  const cabe = (ls: string[], tam: number) => ls.every((l) => medir(l, tam) <= ancho);
  for (let tam = 14; tam >= 9; tam--) if (cabe([texto], tam)) return { tam, lineas: [texto] };
  const partes = texto.split(/[-\s]+/).filter(Boolean);
  for (let n = 2; n <= Math.min(3, partes.length); n++) {
    for (let tam = 14; tam >= 9; tam--) {
      const ls = agrupar(partes, n, tam);
      if (cabe(ls, tam)) return { tam, lineas: ls };
    }
  }
  // Último recurso: una parte por línea y letra reducida hasta que quepa.
  const ls = partes.length > 1 ? agrupar(partes, Math.min(3, partes.length), 9) : [texto];
  let tam = 9;
  while (tam > 7 && !cabe(ls, tam)) tam--;
  return { tam, lineas: ls };
}

export interface ZonaPulso { pulso: number; x: number; y: number; w: number; h: number }

export function dibujarPartitura(div: HTMLDivElement, o: OpcionesPartitura): ZonaPulso[] {
  const zonas: ZonaPulso[] = [];
  const { compas: c } = o;
  const cabecera = 70;
  const filas = !!o.filas && o.numCompases > 1;
  const anchoPulso = filas ? 75 : o.numCompases > 1 ? 66 : 80;
  const anchoCompas = c.pulsos * anchoPulso;
  const W = filas ? cabecera + anchoCompas + 12 : cabecera + anchoCompas * o.numCompases + 12;
  const altoFila = o.silabas ? 172 : 128;
  const H = filas ? altoFila * o.numCompases : altoFila;
  const ctx = crearSvg(div, W, H);
  ctx.setFont("Inter", 12);

  const compases = repartirEnCompases(o.ids, c);
  let pulsoGlobal = 0;
  let x = 6;

  for (let m = 0; m < o.numCompases; m++) {
    const y0 = filas ? m * altoFila : 0;
    if (filas) x = 6;
    const ancho = filas ? W - 12 : m === 0 ? cabecera + anchoCompas : anchoCompas;
    const stave = new Stave(x, 10 + y0, ancho);
    soloLineaCentral(stave);
    if (m === 0) stave.addClef("percussion").addTimeSignature(`${c.num}/${c.den}`);
    else if (filas) stave.addClef("percussion");
    if (m === o.numCompases - 1) stave.setEndBarType(BarlineType.END);
    stave.setContext(ctx).draw();

    const ids = compases[m] ?? [];
    const tickables: StemmableNote[] = [];
    const inicios: { nota: StemmableNote; pulsos: number; silaba: string; pulso0: number }[] = [];
    const beamables: StaveNote[] = [];
    let usados = 0;
    for (const id of ids) {
      const f = figura(id);
      const estado = o.estados?.[pulsoGlobal + usados];
      const color = estado === "ok" ? o.colores.ok : estado === "fallo" ? o.colores.fallo : o.colores.tinta;
      const notas = notasDeFigura(id, c, color);
      inicios.push({ nota: notas[0]!, pulsos: f.pulsos, silaba: f.silaba, pulso0: usados });
      tickables.push(...notas);
      beamables.push(...notas);
      usados += f.pulsos;
    }
    for (let p = usados; p < c.pulsos; p++) {
      const g = new GhostNote({ duration: c.tipo === "simple" ? "q" : "qd" });
      inicios.push({ nota: g, pulsos: 1, silaba: "", pulso0: p });
      tickables.push(g);
    }

    const voice = new Voice({ num_beats: c.num, beat_value: c.den }).setMode(Voice.Mode.SOFT);
    voice.addTickables(tickables);
    const beams = Beam.generateBeams(beamables, {
      groups: [c.tipo === "simple" ? new Fraction(1, 4) : new Fraction(3, 8)],
      stem_direction: 1,
    });
    const anchoNotas = stave.getNoteEndX() - stave.getNoteStartX() - 10;
    new Formatter().joinVoices([voice]).format([voice], anchoNotas);
    voice.draw(ctx, stave);
    beams.forEach((b) => {
      const st = b.getNotes()[0]?.getStyle();
      if (st) b.setStyle(st);
      b.setContext(ctx).draw();
    });

    const finX = stave.getNoteEndX() - 4;
    const yPunto = 108 + y0;
    inicios.forEach((ini, k) => {
      const x0 = ini.nota.getAbsoluteX() + 6;
      const x1 = k + 1 < inicios.length ? inicios[k + 1]!.nota.getAbsoluteX() + 6 : finX;
      const idx0 = pulsoGlobal + ini.pulso0;
      const enCurso = o.progreso != null && ini.silaba !== "" && o.progreso >= idx0;
      if (enCurso) {
        ctx.save();
        ctx.setFillStyle(o.colores.curso);
        ctx.setStrokeStyle(o.colores.curso);
        if (ini.silaba === "(silencio)") {
          // Silencio: aro vacío.
          ctx.setLineWidth(2);
          ctx.beginPath();
          ctx.arc(x0, yPunto, 6, 0, Math.PI * 2, false);
          ctx.stroke();
        } else {
          // Nota: punto que se estira hasta el último pulso que ocupa.
          // Crece pulso a pulso con el metrónomo hasta llenar su último pulso.
          const llenos = Math.min(ini.pulsos - 1, (o.progreso ?? idx0) - idx0);
          const xf = x0 + ((x1 - x0) * llenos) / ini.pulsos;
          const r = 7;
          ctx.beginPath();
          ctx.arc(x0, yPunto, r, 0, Math.PI * 2, false);
          ctx.fill();
          if (xf > x0) {
            ctx.fillRect(x0, yPunto - r, xf - x0, r * 2);
            ctx.beginPath();
            ctx.arc(xf, yPunto, r, 0, Math.PI * 2, false);
            ctx.fill();
          }
        }
        ctx.restore();
      }
      for (let i = 0; !enCurso && i < ini.pulsos; i++) {
        const px = x0 + ((x1 - x0) * i) / ini.pulsos;
        const idx = pulsoGlobal + ini.pulso0 + i;
        const est = o.estados?.[idx];
        const activo = o.pulsoActivo === idx;
        const vacio = ini.silaba === "";
        ctx.save();
        const col = activo
          ? o.colores.tinta
          : est === "ok" ? o.colores.ok : est === "fallo" ? o.colores.fallo : vacio ? o.colores.vacio : o.colores.secundario;
        ctx.setFillStyle(col);
        ctx.setStrokeStyle(col);
        ctx.beginPath();
        ctx.arc(px, yPunto, activo ? 8 : est ? 6 : 4, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.restore();
      }
      if (o.silabas && ini.silaba) {
        const texto = ini.silaba === "(silencio)" ? "—" : ini.silaba;
        const { tam, lineas } = ajustarSilaba(texto, Math.max(16, x1 - x0 - 8));
        ctx.save();
        ctx.setFillStyle(o.colores.secundario);
        ctx.setFont("Inter", tam, 600);
        lineas.forEach((l, j) => ctx.fillText(l, x0 - 4, 134 + y0 + j * (tam + 2)));
        ctx.restore();
      }
    });

    inicios.forEach((ini, k) => {
      const x0 = ini.nota.getAbsoluteX() + 6;
      const x1 = k + 1 < inicios.length ? inicios[k + 1]!.nota.getAbsoluteX() + 6 : finX;
      const paso = (x1 - x0) / ini.pulsos;
      for (let i = 0; i < ini.pulsos; i++) {
        zonas.push({ pulso: pulsoGlobal + ini.pulso0 + i, x: x0 - 10 + paso * i, y: y0 + 4, w: paso, h: yPunto - y0 + 12 });
      }
    });

    pulsoGlobal += c.pulsos;
    x += ancho;
  }
  const sel = zonas.find((z) => z.pulso === o.seleccionado);
  const svg = div.querySelector("svg");
  if (sel && svg) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    Object.entries({ x: sel.x + 2, y: sel.y, width: sel.w - 4, height: sel.h, rx: 10, fill: o.colores.seleccion, stroke: "none" }).forEach(([k, v]) => rect.setAttribute(k, String(v)));
    svg.insertBefore(rect, svg.firstChild);
  }
  return zonas;
}

/** Mini partitura de una figura para los botones de la paleta. */
export function dibujarMiniFigura(div: HTMLDivElement, id: string, c: Compas, color: string) {
  const W = 110;
  const H = 88;
  const ctx = crearSvg(div, W, H);
  const stave = new Stave(0, 0, W);
  soloLineaCentral(stave);
  stave.setBegBarType(BarlineType.NONE).setEndBarType(BarlineType.NONE);
  const notas = notasDeFigura(id, c, color);
  stave.setNoteStartX(notas.length === 1 ? 46 : 20);
  stave.setContext(ctx).draw();
  const voice = new Voice({ num_beats: c.num, beat_value: c.den }).setMode(Voice.Mode.SOFT);
  voice.addTickables(notas);
  const beams = Beam.generateBeams(notas, {
    groups: [c.tipo === "simple" ? new Fraction(1, 4) : new Fraction(3, 8)],
    stem_direction: 1,
  });
  new Formatter().joinVoices([voice]).format([voice], notas.length === 1 ? 20 : 66);
  voice.draw(ctx, stave);
  beams.forEach((b) => b.setContext(ctx).draw());
}
