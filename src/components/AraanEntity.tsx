import React, { useRef, useEffect } from 'react';

export type EntityState =
  | 'idle'
  | 'composing'
  | 'listening'
  | 'user-speaking'
  | 'thinking'
  | 'nira-speaking'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'ended';

export interface EntityPhysics {
  s: EntityState;
  levelTarget: number;
  lv: number;
  sc: number;
  bright: number;
  speed: number;
  spread: number;
  ph: number;
  pt: number;
  poke: number;
  gazeX: number;
  gazeY: number;
  gx: number;
  gy: number;
  glanceAt: number;
  glX: number;
  glY: number;
  pointerIdle: number;
  eyeA: number;
  eyeOpen: number;
  blinkV: number;
  blinkAt: number;
  nextBlink: number;
}

const createInitialPhysics = (): EntityPhysics => ({
  s: 'idle',
  levelTarget: 0,
  lv: 0,
  sc: 1,
  bright: 0.9,
  speed: 1,
  spread: 1,
  ph: 0,
  pt: 0,
  poke: 0,
  gazeX: 0,
  gazeY: 0,
  gx: 0,
  gy: 0,
  glanceAt: 0,
  glX: 0,
  glY: 0,
  pointerIdle: 99,
  eyeA: 1,
  eyeOpen: 1,
  blinkV: 0,
  blinkAt: -9,
  nextBlink: 1.8,
});

// Arctic Silver Default Palette (Charcoal, icy silver, pearl white, pale lavender accents)
let xo = [58, 64, 82];
let ni = [132, 146, 172];
let Pt = [208, 218, 234];
let o2 = [247, 248, 252];
let Cs = [186, 176, 236];
let li = [255, 255, 255];

export function setEntityThemePalette(pal: {
  deep: [number, number, number];
  mid: [number, number, number];
  light: [number, number, number];
  silver: [number, number, number];
  accent: [number, number, number];
  warm: [number, number, number];
}) {
  xo = pal.deep;
  ni = pal.mid;
  Pt = pal.light;
  o2 = pal.silver;
  Cs = pal.accent;
  li = pal.warm;
}

const lerpCol = (t: number[], a: number[], r: number): [number, number, number] => [
  t[0] + (a[0] - t[0]) * r,
  t[1] + (a[1] - t[1]) * r,
  t[2] + (a[2] - t[2]) * r,
];

const ot = (t: number[], a: number) =>
  `rgba(${t[0] | 0},${t[1] | 0},${t[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

const mc = (t: number, a: number, r: number) => Math.max(a, Math.min(r, t));

const normalize3D = (t: number[]): [number, number, number] => {
  const a = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / a, t[1] / a, t[2] / a];
};

const cross3D = (t: number[], a: number[]): [number, number, number] => [
  t[1] * a[2] - t[2] * a[1],
  t[2] * a[0] - t[0] * a[2],
  t[0] * a[1] - t[1] * a[0],
];

const stateProfiles: Record<string, { sc: number; bright: number; speed: number; spread: number }> = {
  idle: { sc: 1, bright: 1, speed: 1, spread: 1 },
  composing: { sc: 1.03, bright: 1.02, speed: 1.3, spread: 0.85 },
  listening: { sc: 1.03, bright: 1, speed: 0.9, spread: 0.9 },
  'user-speaking': { sc: 1, bright: 1.05, speed: 1.5, spread: 1.05 },
  thinking: { sc: 0.84, bright: 0.74, speed: 2.4, spread: 0.5 },
  'nira-speaking': { sc: 1.04, bright: 1.08, speed: 1.35, spread: 1.15 },
  connecting: { sc: 0.9, bright: 0.72, speed: 1.7, spread: 0.65 },
  connected: { sc: 1, bright: 0.9, speed: 1, spread: 1 },
  error: { sc: 0.9, bright: 0.45, speed: 0.5, spread: 0.7 },
  ended: { sc: 0.88, bright: 0.4, speed: 0.4, spread: 0.7 },
};

function updatePhysics(t: EntityPhysics, a: number) {
  const r = mc(a - (t.pt || a - 0.016), 0.001, 0.05);
  t.pt = a;
  const e = (c: number) => Math.min(1, r * c);
  const i = stateProfiles[t.s] || stateProfiles.idle;

  t.lv += (t.levelTarget - t.lv) * e(14);
  t.poke *= Math.exp(-r * 3);
  t.sc += (i.sc - t.sc) * e(2.6);
  t.bright += (i.bright - t.bright) * e(2.6);
  t.speed += (i.speed - t.speed) * e(2);
  t.spread += (i.spread - t.spread) * e(2.2);
  t.ph += r * t.speed * (1 + t.lv * 0.8);

  let o: number, n: number;
  if (t.s === 'thinking') {
    o = -0.5 + 0.12 * Math.sin(a * 0.9);
    n = -0.35;
  } else if (t.s === 'listening' || t.s === 'user-speaking' || t.s === 'composing') {
    o = t.gazeX * 0.25;
    n = t.gazeY * 0.2;
  } else if (t.s === 'nira-speaking') {
    o = 0.1 * Math.sin(a * 1.7);
    n = 0.05 * Math.sin(a * 1.3);
  } else if (t.pointerIdle < 4) {
    o = t.gazeX;
    n = t.gazeY;
  } else {
    if (a > t.glanceAt) {
      t.glX = (Math.random() - 0.5) * 1.3;
      t.glY = (Math.random() - 0.5) * 0.8;
      t.glanceAt = a + 1.8 + Math.random() * 2.6;
    }
    o = t.glX;
    n = t.glY;
  }

  t.gx += (o - t.gx) * e(5);
  t.gy += (n - t.gy) * e(5);
  t.eyeA = 1;
  t.eyeOpen = 1;

  if (a > t.nextBlink) {
    t.blinkAt = a;
    t.nextBlink = a + 2.2 + Math.random() * 3.2;
    if (Math.random() < 0.25) {
      t.nextBlink = a + 0.32;
    }
  }

  const l = (a - t.blinkAt) / 0.2;
  t.blinkV = l > 0 && l < 1 ? Math.sin(l * Math.PI) : 0;
}

const Ip = [
  { a: 1.18, b: 0.16, w: 0.31, p0: 0, az: 0.3, sp: 0.12, om: 0.34, span: 3.4, W: 0.24, strands: 10, rose: 0 },
  { a: 0.95, b: 0.2, w: 0.23, p0: 1.7, az: 2, sp: -0.16, om: -0.27, span: 2.8, W: 0.18, strands: 8, rose: 0.45 },
  { a: 1.3, b: 0.14, w: 0.37, p0: 3.1, az: 3.6, sp: 0.1, om: 0.41, span: 2.5, W: 0.15, strands: 7, rose: 0 },
  { a: 1.05, b: 0.18, w: 0.19, p0: 4.6, az: 5, sp: -0.11, om: 0.22, span: 3, W: 0.16, strands: 8, rose: 0.35 },
  { a: 1.22, b: 0.14, w: 0.27, p0: 5.9, az: 1, sp: 0.17, om: -0.36, span: 2.1, W: 0.11, strands: 6, rose: 0 },
];
const ko = 30;

function drawEyes(
  t: CanvasRenderingContext2D,
  a: number,
  r: number,
  e: EntityPhysics,
  i: number
) {
  const o = a / 2;
  const n = e.eyeA;
  const l = mc(
    e.eyeOpen * (1 - e.blinkV * 0.97) * (e.s === 'listening' || e.s === 'user-speaking' ? 1.08 : 1) * (1 + e.poke * 0.2),
    0.04,
    1.2
  );
  const c = e.gx * 0.3;
  const s = -e.gy * 0.2;

  for (const p of [-1, 1]) {
    const k = c + p * 0.3;
    const g = s - 0.04;
    const f = Math.sin(k) * Math.cos(g);
    const M = Math.sin(g);
    const L = Math.cos(k) * Math.cos(g);
    const H = o + f * r * 0.97;
    const h = o - M * r * 0.97;
    const d = r * 0.085 * Math.max(0.35, L);
    const u = r * 0.17 * l;

    t.save();
    t.translate(H, h);
    t.rotate(p * 0.12);

    let v: any = t.createRadialGradient(0, 0, 0, 0, 0, r * 0.26);
    v.addColorStop(0, ot(Pt, 0.16 * n));
    v.addColorStop(1, ot(Pt, 0));
    t.fillStyle = v;
    t.fillRect(-r * 0.26, -r * 0.26, r * 0.52, r * 0.52);

    t.save();
    t.scale(1, Math.max(0.05, u / d));
    v = t.createRadialGradient(0, 0, 0, 0, 0, d * 1.35);
    v.addColorStop(0, ot(li, 0.95 * n));
    v.addColorStop(0.32, ot(lerpCol(Pt, o2, 0.4), 0.6 * n));
    v.addColorStop(0.7, ot(Pt, 0.16 * n));
    v.addColorStop(1, ot(Pt, 0));
    t.fillStyle = v;
    t.beginPath();
    t.arc(e.gx * d * 0.18, e.gy * d * 0.12, d * 1.35, 0, Math.PI * 2);
    t.fill();
    t.restore();

    t.beginPath();
    t.moveTo(-d * 1.15, u * 0.05);
    t.quadraticCurveTo(0, -u * 1.55, d * 1.15, u * 0.05);
    t.lineWidth = i * 1.7;
    t.lineCap = 'round';
    v = t.createLinearGradient(-d, 0, d, 0);
    v.addColorStop(0, ot(Pt, 0.2 * n));
    v.addColorStop(0.5, ot(li, 0.85 * n));
    v.addColorStop(1, ot(Pt, 0.2 * n));
    t.strokeStyle = v;
    t.stroke();
    t.restore();
  }
}

function drawEntity(
  t: CanvasRenderingContext2D,
  a: number,
  r: number,
  e: EntityPhysics,
  i: number = 1
) {
  const o = a / 2;
  const n = mc(e.lv + e.poke * 0.5, 0, 1.2);
  const l = a * 0.3 * e.sc * (1 + n * 0.05 + Math.sin(r * 1.2) * 0.008);
  const c = e.bright * (1 + n * 0.35);
  const s = a / 520;

  t.globalCompositeOperation = 'source-over';
  let p: any = t.createRadialGradient(o, o, l * 0.6, o, o, l * 2);
  p.addColorStop(0, ot(ni, 0.2 * c));
  p.addColorStop(0.45, ot(xo, 0.1 * c));
  p.addColorStop(1, ot(xo, 0));
  t.fillStyle = p;
  t.fillRect(0, 0, a, a);

  p = t.createRadialGradient(o, o, l * 0.4, o, o, l * 1.02);
  p.addColorStop(0, 'rgba(6,3,16,0.0)');
  p.addColorStop(0.8, ot(xo, 0.05 * c));
  p.addColorStop(0.96, ot(ni, 0.2 * c));
  p.addColorStop(1, ot(Pt, 0.3 * c));
  t.beginPath();
  t.arc(o, o, l, 0, Math.PI * 2);
  t.fillStyle = p;
  t.fill();

  p = t.createRadialGradient(o, o + l * 0.95, 0, o, o + l * 0.95, l * 0.9);
  p.addColorStop(0, ot(ni, 0.22 * c));
  p.addColorStop(1, ot(ni, 0));
  t.save();
  t.beginPath();
  t.arc(o, o, l, 0, Math.PI * 2);
  t.clip();
  t.fillStyle = p;
  t.fillRect(0, 0, a, a);
  t.restore();

  t.globalCompositeOperation = 'lighter';
  t.lineJoin = 'round';

  const k = e.ph;
  const g = k * 0.1;
  const f = Math.cos(g);
  const M = Math.sin(g);
  const L = 1 - 0.3 * e.eyeA;
  const H: Array<[number, number, number]> = [];
  const h = [
    { f: 1, col: xo, a: 0.09, glow: 0 },
    { f: 0.64, col: ni, a: 0.12, glow: 0 },
    { f: 0.36, col: Pt, a: 0.19, glow: 9 },
    { f: 0.16, col: lerpCol(o2, li, 0.5), a: 0.34, glow: 7 },
  ];

  Ip.forEach((y, S) => {
    const C = y.a + y.b * Math.sin(k * y.w + y.p0);
    const j = y.az + k * y.sp;
    const W = normalize3D([Math.sin(C) * Math.cos(j), Math.sin(C) * Math.sin(j), Math.cos(C)]);
    const b = Math.abs(W[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const xt = normalize3D(cross3D(W, b));
    const Gt = cross3D(W, xt);
    const Ut = k * y.om + y.p0;
    const ya = y.span * (0.85 + 0.3 * Math.sin(k * 0.4 + y.p0 * 2)) * (0.8 + 0.2 * e.spread);
    const gr = y.W * (0.6 + 0.4 * e.spread) * (1 + n * 0.55);

    const U: Array<[number, number, number]> = [];
    const It: number[] = [];

    for (let Dt = 0; Dt <= ko; Dt++) {
      const yt = Dt / ko;
      const z = Ut + yt * ya;
      U.push([
        Math.cos(z) * xt[0] + Math.sin(z) * Gt[0],
        Math.cos(z) * xt[1] + Math.sin(z) * Gt[1],
        Math.cos(z) * xt[2] + Math.sin(z) * Gt[2],
      ]);
      It.push(
        gr *
          (0.05 + 0.95 * Math.pow(Math.sin(Math.PI * yt), 0.9)) *
          (1 + 0.3 * Math.sin(yt * 5 + k * 1.1 + S))
      );
    }

    const Yt = (Dt: [number, number, number], yt: number, z: number): [number, number, number] => {
      const A = normalize3D([Dt[0] + W[0] * yt * z, Dt[1] + W[1] * yt * z, Dt[2] + W[2] * yt * z]);
      const tt = A[0] * f + A[2] * M;
      const $ = -A[0] * M + A[2] * f;
      return [o + tt * l, o - A[1] * l, $];
    };

    const ea = 3;
    for (let Dt = 0; Dt < ea; Dt++) {
      const yt = Math.floor((Dt * ko) / ea);
      const z = Math.floor(((Dt + 1) * ko) / ea);
      let A = 0;
      for (let _ = yt; _ <= z; _++) A += Yt(U[_], 0, 0)[2];
      const tt = A / (z - yt + 1);
      const $ = tt > 0 ? 0.55 + 0.45 * tt : 0.12 + 0.22 * (1 + tt);

      for (const _ of h) {
        const Z: Array<[number, number, number]> = [];
        const D: Array<[number, number, number]> = [];
        for (let nt = yt; nt <= z; nt++) {
          Z.push(Yt(U[nt], 1, It[nt] * _.f));
          D.push(Yt(U[nt], -1, It[nt] * _.f));
        }
        t.beginPath();
        t.moveTo(Z[0][0], Z[0][1]);
        for (let nt = 1; nt < Z.length; nt++) t.lineTo(Z[nt][0], Z[nt][1]);
        for (let nt = D.length - 1; nt >= 0; nt--) t.lineTo(D[nt][0], D[nt][1]);
        t.closePath();

        const rt = y.rose > 0 && _.f > 0.5 ? lerpCol(_.col, Cs, y.rose * 0.55) : _.col;
        t.fillStyle = ot(rt, _.a * $ * c * L);
        if (_.glow) {
          t.shadowColor = ot(Pt, 0.55 * $ * c * L);
          t.shadowBlur = _.glow * i;
        }
        t.fill();
        t.shadowBlur = 0;
      }

      for (const _ of [-0.7, -0.3, 0.2, 0.6]) {
        t.beginPath();
        for (let Z = yt; Z <= z; Z++) {
          const D = Yt(U[Z], _, It[Z]);
          if (Z === yt) t.moveTo(D[0], D[1]);
          else t.lineTo(D[0], D[1]);
        }
        t.lineWidth = s * 0.9;
        t.strokeStyle = ot(lerpCol(Pt, o2, 0.4), 0.2 * $ * c * L * (1 - Math.abs(_) * 0.4));
        t.stroke();
      }
    }

    const At = Yt(U[Math.floor(ko * 0.88)], 0, 0);
    H.push([At[0], At[1], At[2]]);
  });

  for (const [y, S, C] of H) {
    if (C >= 0) {
      p = t.createRadialGradient(y, S, 0, y, S, l * 0.2);
      p.addColorStop(0, ot(li, 0.6 * c * C * L));
      p.addColorStop(0.4, ot(Pt, 0.2 * c * C));
      p.addColorStop(1, ot(Pt, 0));
      t.fillStyle = p;
      t.fillRect(y - l * 0.25, S - l * 0.25, l * 0.5, l * 0.5);
    }
  }

  t.lineWidth = s * 1.4;
  t.strokeStyle = ot(Pt, 0.22 * c);
  t.beginPath();
  t.arc(o, o, l, 0, Math.PI * 2);
  t.stroke();

  const d = k * 0.35;
  const u = 1.4;
  const conicGrad = (t as any).createConicGradient;

  for (const [y, S] of [
    [9, 0.08],
    [4, 0.2],
    [1.8, 0.8],
  ]) {
    t.lineWidth = s * y;
    const C = lerpCol(Pt, li, 0.5);
    if (conicGrad) {
      const j = u / (Math.PI * 2);
      const W = conicGrad.call(t, d, o, o);
      W.addColorStop(0, ot(C, 0));
      W.addColorStop(j * 0.5, ot(C, S * c));
      W.addColorStop(j, ot(C, 0));
      W.addColorStop(1, ot(C, 0));
      t.strokeStyle = W;
      t.beginPath();
      t.arc(o, o, l, 0, Math.PI * 2);
      t.stroke();
    } else {
      t.strokeStyle = ot(C, S * c * 0.7);
      t.beginPath();
      t.arc(o, o, l, d, d + u);
      t.stroke();
    }
  }

  if (e.eyeA > 0.01) {
    drawEyes(t, a, l, e, s);
  }

  t.globalCompositeOperation = 'source-over';
}

const BASE_CANVAS_SIZE = 520;

export interface AraanEntityProps {
  state?: EntityState;
  level?: number;
  levelRef?: React.MutableRefObject<number>;
  size?: number;
  paused?: boolean;
  className?: string;
  onPoke?: () => void;
}

export const AraanEntity: React.FC<AraanEntityProps> = ({
  state = 'idle',
  level = 0,
  levelRef,
  size = 230,
  paused = false,
  className = '',
  onPoke,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const physicsRef = useRef<EntityPhysics>(createInitialPhysics());
  const timeRef = useRef<number>(0);
  const stateRef = useRef({ state, level, levelRef });

  stateRef.current = { state, level, levelRef };

  useEffect(() => {
    const handleMove = (g: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const p = physicsRef.current;
      p.gazeX = mc((g.clientX - (rect.left + rect.width / 2)) / 260, -1, 1);
      p.gazeY = mc((g.clientY - (rect.top + rect.height / 2)) / 260, -1, 1);
      p.pointerIdle = 0;
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  useEffect(() => {
    if (paused) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelSize = Math.max(160, Math.round(size * dpr));
    const scale = pixelSize / BASE_CANVAS_SIZE;

    canvas.width = pixelSize;
    canvas.height = pixelSize;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = physicsRef.current;
    let animId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = mc((now - lastTime) / 1000, 0, 0.05);
      lastTime = now;
      timeRef.current += dt * (prefersReducedMotion ? 0.25 : 1);

      const { state: curState, level: curLevel, levelRef: curLevelRef } = stateRef.current;
      p.s = curState;
      if (curLevelRef) {
        p.levelTarget = mc(curLevelRef.current, 0, 1);
        curLevelRef.current *= 0.9;
      } else {
        p.levelTarget = mc(curLevel, 0, 1);
      }

      p.pointerIdle += dt;
      updatePhysics(p, timeRef.current);

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, BASE_CANVAS_SIZE, BASE_CANVAS_SIZE);
      drawEntity(ctx, BASE_CANVAS_SIZE, timeRef.current, p, scale);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [paused, size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      onPointerDown={() => {
        physicsRef.current.poke = 1;
        onPoke?.();
      }}
      className={className}
      style={{
        width: size,
        height: size,
        touchAction: 'manipulation',
        transition: 'width .7s cubic-bezier(.2,.8,.2,1), height .7s cubic-bezier(.2,.8,.2,1)',
      }}
    />
  );
};
