import React, { useEffect, useRef } from 'react';
import { LivingConceptId } from '../types/livingConcepts';
import { useLivingConcept } from '../context/LivingConceptContext';

export type LivingEntityState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'nira-speaking'
  | 'user-speaking'
  | 'connecting'
  | 'error'
  | 'ended';

interface LivingAiPresenceProps {
  concept?: LivingConceptId;
  state?: LivingEntityState;
  audioLevel?: number; // 0 to 1
  analyserNode?: AnalyserNode | null;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LivingAiPresence: React.FC<LivingAiPresenceProps> = ({
  concept: propConcept,
  state = 'idle',
  audioLevel = 0,
  analyserNode,
  size = 160,
  className = '',
}) => {
  const { concept: contextConcept } = useLivingConcept();
  const activeConcept: LivingConceptId = propConcept || contextConcept || 'aurora-weave';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const smoothedAudioRef = useRef<number>(0);
  const freqDataRef = useRef<Uint8Array | null>(null);

  // Normalize pixel dimensions
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'xs'
      ? 24
      : size === 'sm'
      ? 32
      : size === 'md'
      ? 40
      : size === 'lg'
      ? 56
      : 76;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(pixelSize * dpr);
    canvas.height = Math.round(pixelSize * dpr);

    let lastTimestamp = performance.now();
    let animTime = 0;
    const scale = pixelSize / 160;

    const stepsPerRibbon = pixelSize < 45 ? 36 : 60;

    // A few microscopic starlight specks for Micro Nebula and Aurora Weave (only 4 to 6 total)
    const microSpecks = Array.from({ length: 5 }, (_, i) => ({
      t: i / 5 + Math.random() * 0.1,
      speed: 0.05 + Math.random() * 0.04,
      size: 0.75 + Math.random() * 0.8,
      alpha: 0.45 + Math.random() * 0.45,
    }));

    const render = (now: number) => {
      // 120 FPS / 60 FPS smooth delta-time interpolation
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      const isSpeaking = state === 'speaking' || state === 'nira-speaking';
      const isListening = state === 'listening' || state === 'user-speaking';
      const isThinking = state === 'thinking';

      // Calibrated speed: 1 full graceful cycle takes 9 to 14 seconds
      const speedMultiplier = isSpeaking ? 1.35 : isThinking ? 1.15 : isListening ? 0.75 : 0.92;
      animTime += dt * speedMultiplier;

      // Real audio level smoothing
      let currentAudio = audioLevel;
      if (analyserNode) {
        if (!freqDataRef.current || freqDataRef.current.length !== analyserNode.frequencyBinCount) {
          freqDataRef.current = new Uint8Array(analyserNode.frequencyBinCount);
        }
        analyserNode.getByteFrequencyData(freqDataRef.current as any);
        let sum = 0;
        const count = Math.min(24, freqDataRef.current.length);
        for (let i = 0; i < count; i++) sum += freqDataRef.current[i];
        currentAudio = Math.min(1, (sum / (count * 255)) * 1.5);
      } else if (isSpeaking) {
        currentAudio = 0.18 + Math.sin(animTime * 3.6) * 0.14 + Math.cos(animTime * 6.0) * 0.08;
      }

      smoothedAudioRef.current = smoothedAudioRef.current * 0.85 + currentAudio * 0.15;
      const level = smoothedAudioRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = pixelSize / 2;
      const cy = pixelSize / 2;

      // Base radius with calm living breathing
      let baseRadius = 36 * scale;
      if (isListening) {
        baseRadius *= 0.88; // Gentle inward attention
      } else if (isSpeaking) {
        baseRadius *= 1.0 + level * 0.2; // Subtle liquid ripple expansion
      } else {
        baseRadius *= 1.0 + Math.sin(animTime * 0.45) * 0.035;
      }

      // Shared point interface for curves
      interface CurvePoint {
        x: number;
        y: number;
        z: number;
      }

      /* =========================================================================
         CONCEPT 1 — AURORA WEAVE
         2–3 extremely thin liquid-aurora strands slowly flowing through one another.
         Like translucent silk floating underwater: slow, fluid, organic.
         ========================================================================= */
      if (activeConcept === 'aurora-weave') {
        // Soft diffuse glowing center
        const coreR = baseRadius * 0.38;
        const coreAlpha = (0.16 + Math.sin(animTime * 0.5) * 0.08) * (isSpeaking ? 1.0 + level * 0.4 : 1.0);
        const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.6);
        cGrad.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha * 0.85})`);
        cGrad.addColorStop(0.4, `rgba(6, 182, 212, ${coreAlpha * 0.5})`);
        cGrad.addColorStop(0.8, `rgba(139, 92, 246, ${coreAlpha * 0.25})`);
        cGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 1.6, 0, Math.PI * 2);
        ctx.fill();

        const strandColors = [
          { a: 'rgba(6, 182, 212,', b: 'rgba(56, 189, 248,' },
          { a: 'rgba(139, 92, 246,', b: 'rgba(192, 132, 252,' },
          { a: 'rgba(255, 255, 255,', b: 'rgba(244, 63, 94,' },
        ];

        const strandSpecs: { points: CurvePoint[]; colorA: string; colorB: string }[] = [];
        const omegas = [0.55, -0.48, 0.42];

        for (let s = 0; s < 3; s++) {
          const points: CurvePoint[] = [];
          const sTime = animTime * omegas[s] + (s * Math.PI * 2) / 3;
          const isBackground = s === 2;

          for (let i = 0; i <= stepsPerRibbon; i++) {
            const u = (i / stepsPerRibbon) * Math.PI * 2;
            const bend1 = Math.sin(u * 2 + sTime * 1.15) * (isBackground ? 0.22 : 0.28);
            const bend2 = Math.cos(u * 3 - sTime * 0.85 + s) * 0.14;
            const r = baseRadius * (1 + bend1 + bend2);

            const tilt = (s - 1) * 0.44 + Math.sin(sTime * 0.4) * 0.12;
            const xr = Math.cos(u) * r;
            const yr = Math.sin(u) * r * (isBackground ? 0.8 : 0.86);

            const x = cx + (xr * Math.cos(tilt) - yr * Math.sin(tilt));
            const y = cy + (xr * Math.sin(tilt) + yr * Math.cos(tilt));
            const z = isBackground ? -0.45 + Math.sin(u + sTime) * 0.35 : Math.sin(u + sTime) * 0.7 + 0.25;

            points.push({ x, y, z });
          }

          strandSpecs.push({
            points,
            colorA: strandColors[s].a,
            colorB: strandColors[s].b,
          });
        }

        // Sort strands by average Z-depth for depth occlusion
        strandSpecs.sort((a, b) => (a.points[0]?.z || 0) - (b.points[0]?.z || 0));

        for (const strand of strandSpecs) {
          const pts = strand.points;
          if (pts.length < 3) continue;
          const isFg = pts[0].z > 0;
          const depthAlpha = isFg ? 1.0 : 0.65;

          // Glow stroke
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 2; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
          }
          ctx.closePath();
          ctx.strokeStyle = `${strand.colorA} ${(isSpeaking ? 0.32 + level * 0.2 : 0.22) * depthAlpha})`;
          ctx.lineWidth = Math.max(1.8, 4.0 * scale * (isSpeaking ? 1 + level * 0.3 : 1));
          ctx.stroke();

          // Core ribbon
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 2; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
          }
          ctx.closePath();
          ctx.strokeStyle = `${strand.colorB} ${(isSpeaking ? 0.88 : 0.75) * depthAlpha})`;
          ctx.lineWidth = Math.max(0.85, 1.2 * scale * (isSpeaking ? 1 + level * 0.2 : 1));
          ctx.stroke();
        }
      }

      /* =========================================================================
         CONCEPT 2 — LIQUID CELL
         Tiny translucent liquid-glass membrane like a microscopic living cell.
         Outer membrane gently breathes while internal light smoothly moves and changes shape.
         ========================================================================= */
      else if (activeConcept === 'liquid-cell') {
        const membraneR = baseRadius * 0.92;
        const cellTime = animTime * 0.55;

        // 1. Internal luminous fluid substance moving and morphing shape
        const subX = cx + Math.cos(cellTime * 0.65) * (membraneR * 0.25);
        const subY = cy + Math.sin(cellTime * 0.5) * (membraneR * 0.2);
        const subR = membraneR * (0.55 + Math.sin(cellTime * 0.8) * 0.08);

        const subGrad = ctx.createRadialGradient(subX, subY, 0, subX, subY, subR);
        subGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        subGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.65)');
        subGrad.addColorStop(0.7, 'rgba(139, 92, 246, 0.35)');
        subGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = subGrad;
        ctx.beginPath();
        ctx.arc(subX, subY, subR, 0, Math.PI * 2);
        ctx.fill();

        // 2. Soft interior cytoplasm glow
        const cytoGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, membraneR * 1.2);
        cytoGrad.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
        cytoGrad.addColorStop(0.6, 'rgba(139, 92, 246, 0.12)');
        cytoGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = cytoGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, membraneR * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 3. Fluid morphing outer membrane
        ctx.beginPath();
        const memSteps = pixelSize < 45 ? 28 : 44;
        for (let i = 0; i <= memSteps; i++) {
          const theta = (i / memSteps) * Math.PI * 2;
          const wave =
            Math.sin(theta * 3 + cellTime * 0.8) * (membraneR * 0.06) +
            Math.cos(theta * 2 - cellTime * 0.5) * (membraneR * 0.04);
          const r = membraneR + wave;
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Translucent membrane glass fill & stroke
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = Math.max(0.9, 1.25 * scale);
        ctx.stroke();

        // Specular highlight on membrane rim
        const hlX = cx - membraneR * 0.38;
        const hlY = cy - membraneR * 0.38;
        const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, membraneR * 0.4);
        hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        hlGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
        hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = hlGrad;
        ctx.beginPath();
        ctx.arc(hlX, hlY, membraneR * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      /* =========================================================================
         CONCEPT 3 — LIGHT FILAMENT
         One primary ultra-thin glowing filament with a second faint filament following it.
         They continuously bend, stretch, and fold. Moments of brighter light at intersections.
         ========================================================================= */
      else if (activeConcept === 'light-filament') {
        const sTime = animTime * 0.52;
        const filPoints1: CurvePoint[] = [];
        const filPoints2: CurvePoint[] = [];

        for (let i = 0; i <= stepsPerRibbon; i++) {
          const u = (i / stepsPerRibbon) * Math.PI * 2;

          // Primary filament curve
          const bend1 = Math.sin(u * 2 + sTime * 1.1) * 0.3;
          const bend2 = Math.cos(u * 3 - sTime * 0.75) * 0.18;
          const r1 = baseRadius * (1 + bend1 + bend2);
          const tilt1 = Math.sin(sTime * 0.45) * 0.35;
          const xr1 = Math.cos(u) * r1;
          const yr1 = Math.sin(u) * r1 * 0.82;
          const x1 = cx + (xr1 * Math.cos(tilt1) - yr1 * Math.sin(tilt1));
          const y1 = cy + (xr1 * Math.sin(tilt1) + yr1 * Math.cos(tilt1));
          const z1 = Math.sin(u + sTime);
          filPoints1.push({ x: x1, y: y1, z: z1 });

          // Faint secondary follower filament trailing behind
          const uLag = u - 0.32;
          const fBend1 = Math.sin(uLag * 2 + sTime * 1.05) * 0.26;
          const fBend2 = Math.cos(uLag * 3 - sTime * 0.7) * 0.16;
          const r2 = baseRadius * 0.92 * (1 + fBend1 + fBend2);
          const tilt2 = Math.sin(sTime * 0.45 - 0.2) * 0.35;
          const xr2 = Math.cos(uLag) * r2;
          const yr2 = Math.sin(uLag) * r2 * 0.82;
          const x2 = cx + (xr2 * Math.cos(tilt2) - yr2 * Math.sin(tilt2));
          const y2 = cy + (xr2 * Math.sin(tilt2) + yr2 * Math.cos(tilt2));
          const z2 = Math.sin(uLag + sTime) - 0.2;
          filPoints2.push({ x: x2, y: y2, z: z2 });
        }

        // Draw secondary faint filament
        ctx.beginPath();
        ctx.moveTo(filPoints2[0].x, filPoints2[0].y);
        for (let i = 1; i < filPoints2.length - 2; i++) {
          const mx = (filPoints2[i].x + filPoints2[i + 1].x) / 2;
          const my = (filPoints2[i].y + filPoints2[i + 1].y) / 2;
          ctx.quadraticCurveTo(filPoints2[i].x, filPoints2[i].y, mx, my);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.55)';
        ctx.lineWidth = Math.max(0.7, 0.9 * scale);
        ctx.stroke();

        // Draw primary ultra-thin glowing filament
        // Outer glow
        ctx.beginPath();
        ctx.moveTo(filPoints1[0].x, filPoints1[0].y);
        for (let i = 1; i < filPoints1.length - 2; i++) {
          const mx = (filPoints1[i].x + filPoints1[i + 1].x) / 2;
          const my = (filPoints1[i].y + filPoints1[i + 1].y) / 2;
          ctx.quadraticCurveTo(filPoints1[i].x, filPoints1[i].y, mx, my);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.32)';
        ctx.lineWidth = Math.max(2.0, 4.2 * scale);
        ctx.stroke();

        // Core line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = Math.max(0.85, 1.25 * scale);
        ctx.stroke();

        // Crossing intersection bright moment
        const crossIdx = Math.floor((filPoints1.length * 0.45 + (animTime * 4) % filPoints1.length)) % filPoints1.length;
        const p1 = filPoints1[crossIdx];
        const p2 = filPoints2[crossIdx];
        if (p1 && p2) {
          const ix = (p1.x + p2.x) / 2;
          const iy = (p1.y + p2.y) / 2;
          const flashGrad = ctx.createRadialGradient(ix, iy, 0, ix, iy, 8 * scale);
          flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          flashGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.6)');
          flashGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(ix, iy, 8 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* =========================================================================
         CONCEPT 4 — SOFT CORE
         Tiny soft luminous core surrounded by 2–3 extremely subtle liquid layers.
         Layers slowly expand, contract, and flow without flashy pulsing.
         ========================================================================= */
      else if (activeConcept === 'soft-core') {
        const coreTime = animTime * 0.52;

        // 1. Central luminous soft core (gently breathing)
        const coreR = baseRadius * 0.32 * (1 + Math.sin(coreTime * 0.6) * 0.06);
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.5);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        coreGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.7)');
        coreGrad.addColorStop(0.75, 'rgba(139, 92, 246, 0.3)');
        coreGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Center jewel speck
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1.2, 2.8 * scale), 0, Math.PI * 2);
        ctx.fill();

        // 2. Exactly 2–3 subtle concentric liquid layers flowing around the core
        const layerScales = [0.65, 0.96, 1.28];
        const layerColors = [
          'rgba(6, 182, 212,',
          'rgba(139, 92, 246,',
          'rgba(56, 189, 248,',
        ];

        for (let l = 0; l < 3; l++) {
          const lRadius = baseRadius * layerScales[l];
          const lPhase = (l * Math.PI * 2) / 3;
          const lSpeed = coreTime * (l % 2 === 0 ? 0.7 : -0.6) + lPhase;

          ctx.beginPath();
          const lSteps = pixelSize < 45 ? 24 : 36;
          for (let i = 0; i <= lSteps; i++) {
            const theta = (i / lSteps) * Math.PI * 2;
            const wave =
              Math.sin(theta * 2 + lSpeed) * (lRadius * 0.08) +
              Math.cos(theta * 3 - lSpeed * 0.7) * (lRadius * 0.05);
            const r = lRadius + wave;
            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * r * 0.92;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();

          ctx.strokeStyle = `${layerColors[l]} ${0.45 - l * 0.1})`;
          ctx.lineWidth = Math.max(0.8, (1.2 - l * 0.2) * scale);
          ctx.stroke();
        }
      }

      /* =========================================================================
         CONCEPT 5 — MICRO NEBULA
         Very small concentrated cloud of liquid light with 4-5 microscopic points.
         Internal light circulates and forms temporary structures before dissolving.
         ========================================================================= */
      else if (activeConcept === 'micro-nebula') {
        const nebR = baseRadius * 0.88;
        const nebTime = animTime * 0.52;

        // Soft concentrated translucent cloud
        const nebGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, nebR * 1.3);
        nebGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        nebGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.35)');
        nebGrad.addColorStop(0.65, 'rgba(139, 92, 246, 0.2)');
        nebGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = nebGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, nebR * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // 2 Counter-rotating internal liquid currents
        for (let c = 0; c < 2; c++) {
          const cDir = c === 0 ? 1 : -1;
          const cSpeed = nebTime * 0.7 * cDir;
          const curR = nebR * (0.65 + c * 0.25);

          ctx.beginPath();
          const curSteps = pixelSize < 45 ? 24 : 36;
          for (let i = 0; i <= curSteps; i++) {
            const theta = (i / curSteps) * Math.PI * 2;
            const wave = Math.sin(theta * 2 + cSpeed) * (curR * 0.12);
            const r = curR + wave;
            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * r * 0.85;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();

          ctx.strokeStyle = c === 0 ? 'rgba(6, 182, 212, 0.45)' : 'rgba(139, 92, 246, 0.4)';
          ctx.lineWidth = Math.max(0.85, 1.15 * scale);
          ctx.stroke();
        }

        // 4–5 Microscopic embedded starlight specks circulating along currents
        for (let i = 0; i < microSpecks.length; i++) {
          const sp = microSpecks[i];
          sp.t = (sp.t + sp.speed * dt * 0.8) % 1;
          const spAngle = sp.t * Math.PI * 2;
          const spR = nebR * (0.45 + Math.sin(spAngle * 2 + nebTime) * 0.25);
          const px = cx + Math.cos(spAngle) * spR;
          const py = cy + Math.sin(spAngle) * spR * 0.85;

          ctx.fillStyle = `rgba(255, 255, 255, ${sp.alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, sp.size * scale, 0, Math.PI * 2);
          ctx.fill();

          if (pixelSize > 40) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.beginPath();
            ctx.arc(px, py, sp.size * scale * 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      /* =========================================================================
         CONCEPT 6 — LIQUID INFINITY
         Two ultra-thin strands flowing through an imperfect deforming infinity path.
         Never a rigid symbol; slowly deforms, stretches, and relaxes like living liquid.
         ========================================================================= */
      else {
        const infTime = animTime * 0.52;
        const infColors = [
          { a: 'rgba(6, 182, 212,', b: 'rgba(56, 189, 248,' },
          { a: 'rgba(139, 92, 246,', b: 'rgba(255, 255, 255,' },
        ];

        const infStrands: { points: CurvePoint[]; colorA: string; colorB: string }[] = [];

        for (let s = 0; s < 2; s++) {
          const points: CurvePoint[] = [];
          const sTime = infTime * (s === 0 ? 1 : -0.92) + s * Math.PI;

          for (let i = 0; i <= stepsPerRibbon; i++) {
            const u = (i / stepsPerRibbon) * Math.PI * 2;

            // Imperfect stretching & morphing infinity curve
            const stretch = Math.sin(sTime * 0.4) * 0.16;
            const infX = Math.cos(u) * baseRadius * (1.18 + stretch);
            const infY = (Math.sin(2 * u) / 2) * baseRadius * (1.28 - stretch);

            const fluidWave = Math.sin(u * 3 + sTime * 1.1) * (baseRadius * 0.12);
            const rot = (s === 0 ? 0.2 : -0.2) + Math.sin(sTime * 0.35) * 0.14;

            const x = cx + ((infX + fluidWave) * Math.cos(rot) - (infY + fluidWave) * Math.sin(rot));
            const y = cy + ((infX + fluidWave) * Math.sin(rot) + (infY + fluidWave) * Math.cos(rot));
            const z = Math.sin(2 * u + sTime);

            points.push({ x, y, z });
          }

          infStrands.push({
            points,
            colorA: infColors[s].a,
            colorB: infColors[s].b,
          });
        }

        // Sort by Z-depth
        infStrands.sort((a, b) => (a.points[0]?.z || 0) - (b.points[0]?.z || 0));

        for (const strand of infStrands) {
          const pts = strand.points;
          if (pts.length < 3) continue;
          const isFg = pts[0].z > 0;
          const depthAlpha = isFg ? 1.0 : 0.65;

          // Outer glow
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 2; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
          }
          ctx.closePath();
          ctx.strokeStyle = `${strand.colorA} ${(isSpeaking ? 0.32 + level * 0.2 : 0.22) * depthAlpha})`;
          ctx.lineWidth = Math.max(1.8, 3.8 * scale * (isSpeaking ? 1 + level * 0.3 : 1));
          ctx.stroke();

          // Crisp core liquid line
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 2; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
          }
          ctx.closePath();
          ctx.strokeStyle = `${strand.colorB} ${(isSpeaking ? 0.88 : 0.75) * depthAlpha})`;
          ctx.lineWidth = Math.max(0.85, 1.2 * scale * (isSpeaking ? 1 + level * 0.2 : 1));
          ctx.stroke();
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [pixelSize, activeConcept, state, audioLevel, analyserNode]);

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: pixelSize, height: pixelSize }}
        className="block rounded-full"
      />
    </div>
  );
};
