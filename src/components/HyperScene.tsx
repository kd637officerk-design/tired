import React, { useEffect, useRef, useState } from 'react';
import { ThemePreset, WeatherFxType } from '../types/player';

interface HyperSceneProps {
  theme: ThemePreset;
  sceneOn: boolean;
  fxLevel: number; // 0 = off, 1 = subtle, 2 = high, 3 = hyper
  wetGlass: boolean;
  holograms: boolean;
  crowd: boolean;
  crowdLevel?: number; // 0=off, 1=quiet, 2=active, 3=dense
  wallUrl?: string;
  wallIsVideo?: boolean;
  backdropOverride?: string;
}

interface RainDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  w: number;
  alpha: number;
  depth: number; // 0=far, 1=mid, 2=near
  color: string;
}

interface SplashRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  color: string;
}

interface GlassDrop {
  x: number;
  y: number;
  r: number;
  vy: number;
  wobblePhase: number;
  sliding: boolean;
  trail: { x: number; y: number; r: number }[];
  life: number;
}

interface GenericParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  color: string;
  phase: number;
  freq: number;
  char?: string;
  rot?: number;
  vrot?: number;
}

interface SpinnerCraft {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  phase: number;
}

interface Walker {
  x: number;
  groundY: number;
  z: number; // 0.45 (mid-distant) -> 1.0 (foreground)
  dir: 1 | -1;
  speed: number;
  phase: number;
  strideFreq: number;
  height: number;
  coatRatio: number;
  hasUmbrella: boolean;
  hasBackpack: boolean;
  isPuffer: boolean;
  whiteSoles: boolean;
  hairStyle: 'short' | 'bob' | 'hood' | 'ponytail';
  umbColor: string;
  rimColor: string;
  coatColor: string;
  coatHighlight: string;
  pantsColor: string;
  skinColor: string;
  hairColor: string;
}

export const HyperScene: React.FC<HyperSceneProps> = ({
  theme,
  sceneOn,
  fxLevel,
  wetGlass,
  holograms,
  crowd,
  crowdLevel = 2,
  wallUrl,
  wallIsVideo,
  backdropOverride,
}) => {
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const crowdCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = ((e.clientX / window.innerWidth) - 0.5) * -14;
      ty = ((e.clientY / window.innerHeight) - 0.5) * -10;
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      setParallax({ x: cx, y: cy });
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Hologram & Megacity Searchlight + Spinner Layer
  useEffect(() => {
    const canvas = holoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!sceneOn || !holograms || reduced) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let raf = 0;
    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const spinners: SpinnerCraft[] = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * W,
      y: H * (0.16 + i * 0.09),
      vx: (i % 2 === 0 ? 1 : -1) * (0.35 + Math.random() * 0.45),
      vy: (Math.random() - 0.5) * 0.06,
      scale: 0.7 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    }));

    const primary = theme.accent || '#ff7a1a';
    const secondary = theme.secondaryAccent || '#2fd6d0';

    const drawLoop = (t: number) => {
      raf = requestAnimationFrame(drawLoop);
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);

      // 1. Slow volumetric searchlight sweeps behind UI
      const beams = [
        { ox: W * 0.18, oy: H * 0.88, angle: -1.15 + Math.sin(t * 0.00035) * 0.24, spread: 0.14, col: secondary, alpha: 0.075 },
        { ox: W * 0.82, oy: H * 0.9, angle: -1.98 + Math.cos(t * 0.00028) * 0.22, spread: 0.16, col: primary, alpha: 0.085 },
        { ox: W * 0.52, oy: H * 0.94, angle: -1.55 + Math.sin(t * 0.00019 + 1.4) * 0.18, spread: 0.11, col: '#b8f3ff', alpha: 0.055 },
      ];

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const b of beams) {
        const len = Math.max(W, H) * 1.15;
        const x1 = b.ox + Math.cos(b.angle - b.spread) * len;
        const y1 = b.oy + Math.sin(b.angle - b.spread) * len;
        const x2 = b.ox + Math.cos(b.angle + b.spread) * len;
        const y2 = b.oy + Math.sin(b.angle + b.spread) * len;
        const g = ctx.createRadialGradient(b.ox, b.oy, 8, b.ox, b.oy, len * 0.78);
        g.addColorStop(0, b.col + '55');
        g.addColorStop(0.35, b.col + '1e');
        g.addColorStop(1, 'transparent');
        ctx.globalAlpha = b.alpha * 7;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(b.ox, b.oy);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Subtle atmospheric floating hologram projection planes (distant megastructure billboards)
      const holoPanels = [
        { x: W * 0.12, y: H * 0.28, w: Math.min(130, W * 0.16), h: 190, col: secondary, phase: 0.2 },
        { x: W * 0.78, y: H * 0.22, w: Math.min(150, W * 0.18), h: 210, col: primary, phase: 2.1 },
      ];
      for (const hp of holoPanels) {
        const flicker = 0.65 + 0.35 * Math.sin(t * 0.002 + hp.phase) * (Math.sin(t * 0.037) > -0.88 ? 1 : 0.4);
        ctx.globalAlpha = 0.13 * flicker;
        const hg = ctx.createLinearGradient(hp.x, hp.y, hp.x, hp.y + hp.h);
        hg.addColorStop(0, hp.col);
        hg.addColorStop(0.6, hp.col + '55');
        hg.addColorStop(1, 'transparent');
        ctx.fillStyle = hg;
        ctx.fillRect(hp.x, hp.y, hp.w, hp.h);

        ctx.globalAlpha = 0.22 * flicker;
        ctx.fillStyle = hp.col;
        for (let sy = 4; sy < hp.h; sy += 6) {
          ctx.fillRect(hp.x + 2, hp.y + sy, hp.w - 4, 1);
        }
      }

      // 3. Distant flying spinner vehicles crossing between brutalist buildings
      for (const s of spinners) {
        s.x += s.vx;
        s.y += s.vy + Math.sin(t * 0.001 + s.phase) * 0.05;
        if (s.x > W + 80) s.x = -80;
        if (s.x < -80) s.x = W + 80;

        const dir = s.vx >= 0 ? 1 : -1;
        const tg = ctx.createLinearGradient(s.x - dir * 34 * s.scale, s.y, s.x, s.y);
        tg.addColorStop(0, 'transparent');
        tg.addColorStop(1, dir > 0 ? primary + '88' : secondary + '88');
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = tg;
        ctx.lineWidth = 1.6 * s.scale;
        ctx.beginPath();
        ctx.moveTo(s.x - dir * 34 * s.scale, s.y);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#fff4e0';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.6 * s.scale, 0, Math.PI * 2);
        ctx.fill();
        if (Math.sin(t * 0.008 + s.phase) > 0.6) {
          ctx.fillStyle = '#ff3b30';
          ctx.beginPath();
          ctx.arc(s.x - dir * 4 * s.scale, s.y - 1.5, 1.4 * s.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    };

    raf = requestAnimationFrame(drawLoop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [sceneOn, holograms, theme.accent, theme.secondaryAccent]);

  // Anatomically Sculpted Walking Pedestrians & Wet-Asphalt Reflections Layer
  useEffect(() => {
    const canvas = crowdCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveLevel =
      crowdLevel !== undefined
        ? crowdLevel
        : theme.crowdDensity === 'dense'
          ? 3
          : theme.crowdDensity === 'quiet'
            ? 1
            : 2;

    if (!sceneOn || !crowd || effectiveLevel <= 0 || reduced) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let raf = 0;
    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const primary = theme.accent || '#ff7a1a';
    const secondary = theme.secondaryAccent || '#2fd6d0';
    const umbPalette = [secondary, primary, '#e6f7ff', '#ffd59a'];
    const coatPalette: [string, string][] = [
      ['#10151c', '#3b4a5e'], // wet black vinyl coat
      ['#151c26', '#41556e'], // dark slate nylon
      ['#1e1714', '#4d3b32'], // dark coffee leather
      ['#121d24', '#396270'], // rain parka
      ['#1a1d24', '#454a57'], // charcoal wool
    ];
    const pantsPalette = ['#0d1219', '#121822', '#171a21'];
    const skinPalette = ['#cf9f82', '#a8775c', '#e2bba0', '#79503d'];
    const hairPalette = ['#120f0e', '#291c15', '#191a1f', '#442d1f'];
    const hairStyles: Walker['hairStyle'][] = ['short', 'bob', 'hood', 'ponytail'];
    const rainyTheme = theme.fx === 'acid' || theme.fx === 'rain' || fxLevel > 0;
    const countBase = effectiveLevel === 3 ? 20 : effectiveLevel === 2 ? 12 : 7;
    const count = Math.max(5, Math.round((countBase * Math.max(W, 640)) / 1200));

    const makeWalker = (randomX: boolean): Walker => {
      const z = 0.45 + Math.random() * 0.55;
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const speed = (0.48 + Math.random() * 0.36) * z;
      const groundY = H * (0.76 + z * 0.19);
      const height = (82 + Math.random() * 20) * z;
      const coatPair = coatPalette[Math.floor(Math.random() * coatPalette.length)];
      return {
        x: randomX ? Math.random() * (W + 140) - 70 : dir === 1 ? -70 - Math.random() * 90 : W + 70 + Math.random() * 90,
        groundY,
        z,
        dir,
        speed,
        phase: Math.random() * Math.PI * 2,
        strideFreq: 0.068 + (speed / Math.max(z, 0.3)) * 0.04,
        height,
        coatRatio: 0.24 + Math.random() * 0.22,
        hasUmbrella: rainyTheme ? Math.random() < 0.48 : Math.random() < 0.1,
        hasBackpack: Math.random() < 0.35,
        isPuffer: Math.random() < 0.38,
        whiteSoles: Math.random() < 0.55,
        hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
        umbColor: umbPalette[Math.floor(Math.random() * umbPalette.length)],
        rimColor: Math.random() < 0.55 ? secondary : primary,
        coatColor: coatPair[0],
        coatHighlight: coatPair[1],
        pantsColor: pantsPalette[Math.floor(Math.random() * pantsPalette.length)],
        skinColor: skinPalette[Math.floor(Math.random() * skinPalette.length)],
        hairColor: hairPalette[Math.floor(Math.random() * hairPalette.length)],
      };
    };

    const walkers: Walker[] = Array.from({ length: count }, () => makeWalker(true)).sort(
      (a, b) => a.z - b.z
    );

    const vents = [
      { x: W * 0.22, y: H * 0.91, col: secondary },
      { x: W * 0.74, y: H * 0.89, col: primary },
    ];

    const drawLimb = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      r1: number,
      r2: number,
      fill: string | CanvasGradient
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(x1 + nx * r1, y1 + ny * r1);
      ctx.lineTo(x2 + nx * r2, y2 + ny * r2);
      ctx.arc(x2, y2, r2, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
      ctx.lineTo(x1 - nx * r1, y1 - ny * r1);
      ctx.arc(x1, y1, r1, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
      ctx.closePath();
      ctx.fill();
    };

    const drawPerson = (w: Walker, mirror: boolean, t: number) => {
      const Hpx = w.height;
      const hipY = -Hpx * 0.48;
      const waistY = -Hpx * 0.6;
      const chestY = -Hpx * 0.74;
      const shoulderY = -Hpx * 0.815;
      const neckY = -Hpx * 0.855;
      const headCenterY = -Hpx * 0.925;
      const headR = Hpx * 0.068;

      const p = w.phase;
      const stepLift = Math.abs(Math.cos(p)) * (Hpx * 0.02);

      const calcLeg = (legPhase: number) => {
        const swing = Math.sin(legPhase);
        const lift = Math.max(0, Math.cos(legPhase));
        const hipAngle = swing * 0.38;
        const thighLen = Hpx * 0.245;
        const shinLen = Hpx * 0.235;
        const kneeBend = lift * 0.52 + (swing < 0 ? 0.08 : 0.14);
        const kneeX = Math.sin(hipAngle) * thighLen;
        const kneeY = hipY + Math.cos(hipAngle) * thighLen;
        const shinAngle = hipAngle - kneeBend;
        const ankleX = kneeX + Math.sin(shinAngle) * shinLen;
        const ankleY = Math.min(-Hpx * 0.024, kneeY + Math.cos(shinAngle) * shinLen);
        const footTilt = swing < -0.2 ? -0.24 : lift * 0.2;
        return { kneeX, kneeY, ankleX, ankleY, footTilt };
      };

      const calcArm = (armPhase: number, holdingUmb: boolean) => {
        if (holdingUmb) {
          const elbowX = Hpx * 0.062;
          const elbowY = shoulderY + Hpx * 0.14;
          const handX = Hpx * 0.148;
          const handY = shoulderY + Hpx * 0.048;
          return { elbowX, elbowY, handX, handY };
        }
        const swing = Math.sin(armPhase) * 0.34;
        const upperLen = Hpx * 0.165;
        const lowerLen = Hpx * 0.155;
        const elbowX = Math.sin(swing) * upperLen;
        const elbowY = shoulderY + Math.cos(swing) * upperLen;
        const foreAngle = swing + 0.24 + Math.max(0, swing) * 0.25;
        const handX = elbowX + Math.sin(foreAngle) * lowerLen;
        const handY = elbowY + Math.cos(foreAngle) * lowerLen;
        return { elbowX, elbowY, handX, handY };
      };

      const backLeg = calcLeg(p + Math.PI);
      const frontLeg = calcLeg(p);
      const backArm = calcArm(p, false);
      const frontArm = calcArm(p + Math.PI, w.hasUmbrella);

      ctx.save();
      ctx.translate(w.x, w.groundY);
      if (mirror) {
        ctx.scale(w.dir, -0.45);
        ctx.globalAlpha = 0.24 * w.z;
      } else {
        ctx.translate(0, -stepLift);
        ctx.scale(w.dir, 1);
        ctx.globalAlpha = 0.68 + w.z * 0.32;
      }

      const umbTint = w.hasUmbrella ? w.umbColor : w.rimColor;
      const coatGrad = mirror
        ? w.rimColor
        : (() => {
            const g = ctx.createLinearGradient(-Hpx * 0.09, chestY, Hpx * 0.09, chestY);
            g.addColorStop(0, '#07090c');
            g.addColorStop(0.55, w.coatColor);
            g.addColorStop(0.88, w.coatHighlight);
            g.addColorStop(1, umbTint);
            return g;
          })();

      const frontLegGrad = mirror
        ? w.rimColor
        : (() => {
            const g = ctx.createLinearGradient(-Hpx * 0.05, hipY, Hpx * 0.07, hipY);
            g.addColorStop(0, '#080b0f');
            g.addColorStop(0.65, w.pantsColor);
            g.addColorStop(1, '#2d3948');
            return g;
          })();

      const backShade = mirror ? w.rimColor : '#080b10';
      const skinFill = mirror ? w.rimColor : w.skinColor;
      const hairFill = mirror ? w.rimColor : w.hairColor;

      // 1. Back arm + hand
      drawLimb(-Hpx * 0.015, shoulderY + Hpx * 0.02, backArm.elbowX, backArm.elbowY, Hpx * 0.036, Hpx * 0.03, backShade);
      drawLimb(backArm.elbowX, backArm.elbowY, backArm.handX, backArm.handY, Hpx * 0.028, Hpx * 0.021, backShade);
      if (!mirror) {
        ctx.fillStyle = skinFill;
        ctx.beginPath();
        ctx.arc(backArm.handX, backArm.handY, Hpx * 0.02, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Back leg + shoe
      drawLimb(0, hipY, backLeg.kneeX, backLeg.kneeY, Hpx * 0.056, Hpx * 0.042, backShade);
      drawLimb(backLeg.kneeX, backLeg.kneeY, backLeg.ankleX, backLeg.ankleY, Hpx * 0.041, Hpx * 0.028, backShade);
      ctx.save();
      ctx.translate(backLeg.ankleX, backLeg.ankleY);
      ctx.rotate(backLeg.footTilt);
      ctx.fillStyle = mirror ? w.rimColor : '#07090c';
      ctx.beginPath();
      ctx.roundRect(-Hpx * 0.025, 0, Hpx * 0.094, Hpx * 0.032, Hpx * 0.014);
      ctx.fill();
      if (!mirror && w.whiteSoles) {
        ctx.fillStyle = '#c8d1dc';
        ctx.fillRect(-Hpx * 0.02, Hpx * 0.024, Hpx * 0.086, Hpx * 0.008);
      }
      ctx.restore();

      // 3. Front leg with 3D cylindrical gradient + shoe / white sneaker sole
      drawLimb(Hpx * 0.006, hipY, frontLeg.kneeX, frontLeg.kneeY, Hpx * 0.058, Hpx * 0.044, frontLegGrad);
      drawLimb(frontLeg.kneeX, frontLeg.kneeY, frontLeg.ankleX, frontLeg.ankleY, Hpx * 0.043, Hpx * 0.03, frontLegGrad);
      ctx.save();
      ctx.translate(frontLeg.ankleX, frontLeg.ankleY);
      ctx.rotate(frontLeg.footTilt);
      ctx.fillStyle = mirror ? w.rimColor : '#0c0f14';
      ctx.beginPath();
      ctx.roundRect(-Hpx * 0.026, 0, Hpx * 0.098, Hpx * 0.034, Hpx * 0.015);
      ctx.fill();
      if (!mirror && w.whiteSoles) {
        ctx.fillStyle = '#dde5ef';
        ctx.fillRect(-Hpx * 0.02, Hpx * 0.025, Hpx * 0.09, Hpx * 0.009);
      }
      ctx.restore();

      // Optional urban backpack behind torso
      if (!mirror && w.hasBackpack) {
        ctx.fillStyle = '#12171f';
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = Math.max(0.7, 1 * w.z);
        ctx.beginPath();
        ctx.roundRect(-Hpx * 0.13, shoulderY + Hpx * 0.02, Hpx * 0.075, Hpx * 0.21, Hpx * 0.025);
        ctx.fill();
        ctx.stroke();
      }

      // 4. Anatomically Contoured Coat / Jacket with 3D lighting
      const coatHemY = -Hpx * w.coatRatio;
      const strideSway = Math.sin(p) * (Hpx * 0.025);
      ctx.fillStyle = coatGrad;
      ctx.beginPath();
      ctx.moveTo(-Hpx * 0.068, shoulderY + Hpx * 0.02);
      ctx.quadraticCurveTo(0, shoulderY - Hpx * 0.026, Hpx * 0.064, shoulderY + Hpx * 0.015);
      ctx.bezierCurveTo(Hpx * 0.088, chestY, Hpx * 0.072, waistY, Hpx * 0.074 + strideSway * 0.4, coatHemY);
      ctx.lineTo(-Hpx * 0.078 - Math.abs(strideSway) * 0.5, coatHemY);
      ctx.bezierCurveTo(-Hpx * 0.074, waistY, -Hpx * 0.086, chestY, -Hpx * 0.068, shoulderY + Hpx * 0.02);
      ctx.closePath();
      ctx.fill();

      // Puffer horizontal quilting seams OR rain-slicked vinyl fold sheen
      if (!mirror) {
        if (w.isPuffer) {
          ctx.strokeStyle = 'rgba(0,0,0,0.48)';
          ctx.lineWidth = Math.max(0.7, 1.1 * w.z);
          for (let qy = shoulderY + Hpx * 0.06; qy < coatHemY - Hpx * 0.03; qy += Hpx * 0.055) {
            ctx.beginPath();
            ctx.moveTo(-Hpx * 0.065, qy);
            ctx.quadraticCurveTo(0, qy + Hpx * 0.012, Hpx * 0.065, qy);
            ctx.stroke();
          }
        } else {
          // Wet specular highlight streak along coat front shoulder/lapel
          ctx.strokeStyle = 'rgba(225, 244, 255, 0.24)';
          ctx.lineWidth = Math.max(0.8, 1.3 * w.z);
          ctx.beginPath();
          ctx.moveTo(Hpx * 0.035, shoulderY + Hpx * 0.025);
          ctx.quadraticCurveTo(Hpx * 0.052, chestY, Hpx * 0.044, waistY + Hpx * 0.04);
          ctx.stroke();
        }
      }

      // 5. Neck, Lit Face Profile & Hair / Rain Hood
      const faceLitGrad = mirror
        ? w.rimColor
        : (() => {
            const g = ctx.createRadialGradient(headR * 0.7, headCenterY - headR * 0.2, 1, 0, headCenterY, headR * 1.4);
            g.addColorStop(0, w.hasUmbrella ? w.umbColor : '#f0c7a8');
            g.addColorStop(0.55, w.skinColor);
            g.addColorStop(1, '#3d281f');
            return g;
          })();

      ctx.fillStyle = skinFill;
      ctx.fillRect(-Hpx * 0.024, neckY - Hpx * 0.02, Hpx * 0.05, Hpx * 0.06);

      ctx.fillStyle = faceLitGrad;
      ctx.beginPath();
      ctx.ellipse(Hpx * 0.008, headCenterY, headR * 0.92, headR * 1.08, 0.08, 0, Math.PI * 2);
      ctx.fill();
      if (!mirror) {
        ctx.beginPath();
        ctx.moveTo(headR * 0.75, headCenterY - headR * 0.15);
        ctx.lineTo(headR * 1.15, headCenterY + headR * 0.12);
        ctx.lineTo(headR * 0.78, headCenterY + headR * 0.35);
        ctx.lineTo(headR * 0.7, headCenterY + headR * 0.92);
        ctx.lineTo(headR * 0.15, headCenterY + headR * 0.98);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = w.hairStyle === 'hood' ? coatGrad : hairFill;
      ctx.beginPath();
      if (w.hairStyle === 'hood') {
        ctx.arc(-Hpx * 0.004, headCenterY - headR * 0.05, headR * 1.24, Math.PI * 0.55, Math.PI * 1.92);
        ctx.lineTo(headR * 0.3, shoulderY + Hpx * 0.01);
        ctx.lineTo(-headR * 1.1, shoulderY + Hpx * 0.01);
      } else {
        ctx.arc(-Hpx * 0.002, headCenterY - headR * 0.15, headR * 1.06, Math.PI * 0.7, Math.PI * 1.98);
        ctx.lineTo(headR * 0.4, headCenterY - headR * 0.45);
        ctx.lineTo(-headR * 0.75, headCenterY + headR * 0.65);
        if (w.hairStyle === 'bob') {
          ctx.lineTo(-headR * 1.05, headCenterY + headR * 1.25);
        } else if (w.hairStyle === 'ponytail') {
          ctx.quadraticCurveTo(-headR * 1.65, headCenterY + headR * 0.4, -headR * 1.35, headCenterY + headR * 1.35);
        }
      }
      ctx.closePath();
      ctx.fill();

      // 6. Front Arm & Hand
      drawLimb(-Hpx * 0.005, shoulderY + Hpx * 0.025, frontArm.elbowX, frontArm.elbowY, Hpx * 0.039, Hpx * 0.032, coatGrad);
      drawLimb(frontArm.elbowX, frontArm.elbowY, frontArm.handX, frontArm.handY, Hpx * 0.031, Hpx * 0.023, coatGrad);
      if (!mirror) {
        ctx.fillStyle = faceLitGrad;
        ctx.beginPath();
        ctx.arc(frontArm.handX, frontArm.handY, Hpx * 0.022, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Blade Runner Illuminated Ribbed Umbrella
      if (w.hasUmbrella) {
        const umbTopX = frontArm.handX + Hpx * 0.02;
        const umbTopY = headCenterY - Hpx * 0.16;
        const umbW = Hpx * 0.29;
        const umbH = Hpx * 0.105;

        ctx.strokeStyle = mirror ? w.umbColor : 'rgba(225, 244, 255, 0.85)';
        ctx.lineWidth = Math.max(1, 1.5 * w.z);
        ctx.beginPath();
        ctx.moveTo(frontArm.handX, frontArm.handY);
        ctx.lineTo(umbTopX, umbTopY);
        ctx.stroke();

        if (!mirror) {
          const glow = ctx.createRadialGradient(umbTopX, umbTopY + umbH * 0.55, 2, umbTopX, umbTopY + umbH * 0.55, umbW * 1.45);
          glow.addColorStop(0, w.umbColor + '88');
          glow.addColorStop(0.5, w.umbColor + '28');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(umbTopX, umbTopY + umbH * 0.55, umbW * 1.45, 0, Math.PI * 2);
          ctx.fill();
        }

        const canopyGrad = mirror
          ? w.umbColor
          : (() => {
              const g = ctx.createLinearGradient(umbTopX, umbTopY - umbH, umbTopX, umbTopY + umbH * 0.6);
              g.addColorStop(0, '#0f1620');
              g.addColorStop(0.65, '#192938');
              g.addColorStop(1, w.umbColor + 'cc');
              return g;
            })();

        ctx.fillStyle = canopyGrad;
        ctx.beginPath();
        ctx.ellipse(umbTopX, umbTopY + umbH * 0.55, umbW, umbH, 0.06, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        if (!mirror) {
          // Subtle inner umbrella ribs & luminous neon outer rim
          ctx.strokeStyle = w.umbColor;
          ctx.lineWidth = Math.max(1.4, 2.2 * w.z);
          ctx.beginPath();
          ctx.ellipse(umbTopX, umbTopY + umbH * 0.55, umbW, umbH, 0.06, Math.PI, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255,255,255,0.45)';
          ctx.lineWidth = 0.7 * w.z;
          for (const rx of [-0.5, 0, 0.5]) {
            ctx.beginPath();
            ctx.moveTo(umbTopX, umbTopY - umbH * 0.42);
            ctx.lineTo(umbTopX + rx * umbW, umbTopY + umbH * 0.52);
            ctx.stroke();
          }
        }
      }

      // 8. Sliced Rippled Wet-Asphalt Light Reflections below shoes
      if (!mirror) {
        const refCol = w.hasUmbrella ? w.umbColor : w.rimColor;
        for (let s = 0; s < 5; s++) {
          const ry = 3 + s * Hpx * 0.036;
          const rw = (Hpx * 0.22 - s * Hpx * 0.02) * (0.85 + 0.15 * Math.sin(t * 0.005 + s + w.x * 0.05));
          ctx.globalAlpha = (0.34 - s * 0.055) * w.z;
          ctx.fillStyle = refCol;
          ctx.beginPath();
          ctx.ellipse(Math.sin(t * 0.003 + s) * 2.5, ry, Math.max(2, rw), Hpx * 0.014, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    };

    const drawCrowd = (t: number) => {
      raf = requestAnimationFrame(drawCrowd);
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);

      for (const v of vents) {
        const puffX = v.x + Math.sin(t * 0.0008 + v.y) * 14;
        const sg = ctx.createRadialGradient(puffX, v.y - 34, 4, puffX, v.y - 34, 105);
        sg.addColorStop(0, v.col + '18');
        sg.addColorStop(0.5, 'rgba(200, 225, 240, 0.06)');
        sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.ellipse(puffX, v.y - 28, 105, 45, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < walkers.length; i++) {
        const w = walkers[i];
        w.x += w.speed * w.dir;
        w.phase += w.strideFreq;
        w.groundY = H * (0.76 + w.z * 0.19);

        if ((w.dir === 1 && w.x > W + 90) || (w.dir === -1 && w.x < -90)) {
          walkers[i] = makeWalker(false);
          continue;
        }

        drawPerson(w, true, t);
        drawPerson(w, false, t);
      }
    };

    raf = requestAnimationFrame(drawCrowd);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [sceneOn, crowd, crowdLevel, theme.crowdDensity, theme.accent, theme.secondaryAccent, theme.fx, fxLevel]);

  // Hyper-Realistic Rain, Wet-Glass Droplets & Atmospheric Weather Physics Canvas (#fx)
  useEffect(() => {
    const canvas = fxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fx: WeatherFxType = theme.fx || 'none';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fx === 'none' || fxLevel <= 0 || reduced) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let raf = 0;
    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const mult = fxLevel === 3 ? 1.75 : fxLevel === 2 ? 1.2 : 0.65;
    const primary = theme.accent || '#ff7a1a';
    const secondary = theme.secondaryAccent || '#2fd6d0';

    if (fx === 'acid' || fx === 'rain' || fx === 'batflare' || fx === 'bloodrain') {
      const isBladeRunner = fx === 'acid';
      const isBatFlare = fx === 'batflare';
      const isBloodRain = fx === 'bloodrain';
      const rainColors = isBloodRain
        ? ['#e01122', '#ff2a3c', '#990512', '#ff707c', '#72020b']
        : isBatFlare
          ? ['#00e68a', '#14f195', '#88ffd2', '#0ea86c', '#e31b23']
          : isBladeRunner
            ? ['#a7ecf5', '#d6f8ff', '#ffb36b', '#ff8c3a', '#e8f4f8']
            : ['#74f7ff', '#ff57e2', '#d2f6ff', '#ffb3ef'];

      const bats = isBloodRain
        ? Array.from({ length: Math.round(11 * Math.min(mult, 1.4)) }, (_, i) => ({
            x: Math.random() * W,
            y: H * (0.08 + (i % 5) * 0.085),
            vx: (i % 2 === 0 ? 1 : -1) * (0.65 + Math.random() * 0.85),
            wingPhase: Math.random() * 6.28,
            scale: 0.65 + Math.random() * 0.65,
          }))
        : [];

      const flareEmbers = isBatFlare
        ? Array.from({ length: Math.round(24 * mult) }, () => ({
            x: Math.random() * W * 0.48,
            y: H * (0.55 + Math.random() * 0.45),
            vx: 0.25 + Math.random() * 0.65,
            vy: -(0.8 + Math.random() * 1.9),
            r: 1 + Math.random() * 2.2,
            alpha: 0.45 + Math.random() * 0.45,
            phase: Math.random() * 6.28,
          }))
        : [];

      const makeDrop = (spawnTop: boolean): RainDrop => {
        const depthRoll = Math.random();
        const depth = depthRoll < 0.45 ? 0 : depthRoll < 0.82 ? 1 : 2;
        const speedBase = depth === 0 ? 9 : depth === 1 ? 15.5 : 23;
        return {
          x: Math.random() * (W + 120) - 60,
          y: spawnTop ? -20 - Math.random() * 140 : Math.random() * H,
          vx: -1.6 - depth * 0.7 - Math.random() * 0.8,
          vy: speedBase + Math.random() * 5.5,
          len: depth === 0 ? 12 + Math.random() * 10 : depth === 1 ? 24 + Math.random() * 18 : 38 + Math.random() * 24,
          w: depth === 0 ? 0.7 : depth === 1 ? 1.15 : 1.85,
          alpha: depth === 0 ? 0.16 + Math.random() * 0.14 : depth === 1 ? 0.28 + Math.random() * 0.2 : 0.36 + Math.random() * 0.22,
          depth,
          color: rainColors[Math.floor(Math.random() * rainColors.length)],
        };
      };

      const dropCount = Math.round(115 * mult);
      const drops: RainDrop[] = Array.from({ length: dropCount }, () => makeDrop(false));
      const splashes: SplashRing[] = [];

      const makeGlassDrop = (): GlassDrop => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.88,
        r: 1.4 + Math.random() * 3.1,
        vy: 0,
        wobblePhase: Math.random() * Math.PI * 2,
        sliding: Math.random() < 0.22,
        trail: [],
        life: 0,
      });

      const glassDrops: GlassDrop[] = wetGlass
        ? Array.from({ length: Math.round(28 * Math.min(mult, 1.5)) }, makeGlassDrop)
        : [];

      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // Castlevania Crimson Blood Moon Glow & Flapping Nocturnal Bats
        if (isBloodRain) {
          const moonGlow = ctx.createRadialGradient(W * 0.5, H * 0.24, 15, W * 0.5, H * 0.24, Math.max(W, H) * 0.45);
          moonGlow.addColorStop(0, 'rgba(224, 17, 34, 0.22)');
          moonGlow.addColorStop(0.55, 'rgba(130, 5, 16, 0.08)');
          moonGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = moonGlow;
          ctx.fillRect(0, 0, W, H);

          for (let i = 0; i < bats.length; i++) {
            const b = bats[i];
            b.x += b.vx;
            b.y += Math.sin(t * 0.004 + b.wingPhase) * 0.35;
            if (b.x > W + 40) b.x = -40;
            if (b.x < -40) b.x = W + 40;
            const flap = Math.sin(t * 0.015 + b.wingPhase) * 5 * b.scale;
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.globalAlpha = 0.72;
            ctx.fillStyle = '#070102';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-7 * b.scale, -5 * b.scale + flap, -13 * b.scale, flap * 0.6);
            ctx.quadraticCurveTo(-5 * b.scale, 2 * b.scale, 0, 2.5 * b.scale);
            ctx.quadraticCurveTo(5 * b.scale, 2 * b.scale, 13 * b.scale, flap * 0.6);
            ctx.quadraticCurveTo(7 * b.scale, -5 * b.scale + flap, 0, 0);
            ctx.fill();
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }

        // Batman 2022 Crimson Signal Flare Glow + Rising Smoke Embers
        if (isBatFlare) {
          const pulse = 0.78 + 0.22 * Math.sin(t * 0.0042) + 0.08 * Math.sin(t * 0.017);
          const fg = ctx.createRadialGradient(W * 0.14, H * 0.92, 10, W * 0.14, H * 0.88, Math.max(W, H) * 0.44);
          fg.addColorStop(0, `rgba(227, 27, 35, ${0.26 * pulse})`);
          fg.addColorStop(0.42, `rgba(180, 16, 24, ${0.1 * pulse})`);
          fg.addColorStop(1, 'transparent');
          ctx.fillStyle = fg;
          ctx.fillRect(0, 0, W, H);

          const gg = ctx.createRadialGradient(W * 0.84, H * 0.25, 10, W * 0.84, H * 0.28, Math.max(W, H) * 0.4);
          gg.addColorStop(0, 'rgba(0, 230, 138, 0.1)');
          gg.addColorStop(1, 'transparent');
          ctx.fillStyle = gg;
          ctx.fillRect(0, 0, W, H);

          for (let i = 0; i < flareEmbers.length; i++) {
            const em = flareEmbers[i];
            em.x += em.vx + Math.sin(t * 0.002 + em.phase) * 0.5;
            em.y += em.vy;
            if (em.y < H * 0.25 || em.x > W * 0.65) {
              em.x = Math.random() * W * 0.34;
              em.y = H + Math.random() * 25;
            }
            ctx.globalAlpha = em.alpha;
            ctx.fillStyle = i % 4 === 0 ? '#ff7b4a' : '#e31b23';
            ctx.beginPath();
            ctx.arc(em.x, em.y, em.r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }

        // Subtle wind gust wave
        const windGust = Math.sin(t * 0.0007) * 0.9 + Math.cos(t * 0.0017) * 0.4;

        // 1. Multi-plane rain streaks
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          const vx = d.vx + windGust * (0.4 + d.depth * 0.35);
          d.x += vx;
          d.y += d.vy;

          const splashFloor = H * (d.depth === 0 ? 0.78 : d.depth === 1 ? 0.92 : 0.99);
          if (d.y > splashFloor) {
            if (d.depth >= 1 && splashes.length < 36 && Math.random() < 0.32) {
              splashes.push({
                x: d.x,
                y: splashFloor + Math.random() * 6,
                r: 1,
                maxR: 6 + Math.random() * 9,
                alpha: 0.48,
                color: d.color,
              });
            }
            drops[i] = makeDrop(true);
            continue;
          }
          if (d.x < -80 || d.x > W + 80) {
            drops[i] = makeDrop(true);
            continue;
          }

          const mag = Math.hypot(vx, d.vy) || 1;
          const tx = d.x - (vx / mag) * d.len;
          const ty = d.y - (d.vy / mag) * d.len;
          const grad = ctx.createLinearGradient(tx, ty, d.x, d.y);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(0.65, d.color);
          grad.addColorStop(1, '#ffffff');

          ctx.globalAlpha = d.alpha;
          ctx.strokeStyle = grad;
          ctx.lineWidth = d.w;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }

        // 2. Splash ripples & upward mist
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.r += 0.65;
          s.alpha *= 0.88;
          if (s.alpha < 0.03 || s.r > s.maxR) {
            splashes.splice(i, 1);
            continue;
          }
          ctx.globalAlpha = s.alpha;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.r, s.r * 0.34, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 3. Wet camera-glass refractive droplets & sliding rivulets
        if (wetGlass) {
          for (let i = 0; i < glassDrops.length; i++) {
            const g = glassDrops[i];
            g.life += 1;
            if (!g.sliding) {
              g.r += 0.004;
              if (g.r > 4.2 || (g.life > 180 && Math.random() < 0.008)) {
                g.sliding = true;
                g.vy = 0.6 + Math.random() * 1.1;
              }
            } else {
              g.vy = Math.min(3.4, g.vy + 0.045);
              g.y += g.vy;
              g.x += Math.sin(g.y * 0.05 + g.wobblePhase) * 0.45;
              if (g.life % 4 === 0) {
                g.trail.push({ x: g.x, y: g.y - g.r * 0.6, r: Math.max(0.7, g.r * 0.36) });
                if (g.trail.length > 14) g.trail.shift();
              }
              if (g.y > H + 20) {
                glassDrops[i] = makeGlassDrop();
                glassDrops[i].y = Math.random() * H * 0.45;
                continue;
              }
            }

            // Micro trail beads behind sliding droplet
            for (let k = 0; k < g.trail.length; k++) {
              const tr = g.trail[k];
              const ta = ((k + 1) / g.trail.length) * (isBloodRain ? 0.55 : 0.25);
              ctx.globalAlpha = ta;
              ctx.fillStyle = isBloodRain ? 'rgba(217, 11, 28, 0.88)' : 'rgba(220, 244, 255, 0.7)';
              ctx.beginPath();
              ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
              ctx.fill();
            }

            // Glass droplet refraction body + specular highlight
            ctx.globalAlpha = isBloodRain ? 0.62 : 0.38;
            ctx.fillStyle = isBloodRain ? 'rgba(185, 8, 22, 0.45)' : 'rgba(180, 225, 240, 0.16)';
            ctx.beginPath();
            ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = isBloodRain ? 0.65 : 0.55;
            ctx.strokeStyle = isBloodRain ? 'rgba(255, 135, 145, 0.62)' : 'rgba(255, 255, 255, 0.48)';
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.arc(g.x, g.y, g.r, Math.PI * 1.1, Math.PI * 1.75);
            ctx.stroke();

            // Lower caustic glint (picking up city lights / blood moon)
            ctx.globalAlpha = isBloodRain ? 0.55 : 0.42;
            ctx.strokeStyle = isBloodRain ? '#ff2a3c' : primary;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.arc(g.x, g.y, g.r * 0.82, Math.PI * 0.15, Math.PI * 0.75);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // Sleepy Hollow 1999 Rolling Cemetery Mist & Ash Engine
    if (fx === 'fog') {
      const fogBanks = Array.from({ length: 7 }, (_, i) => ({
        x: Math.random() * W,
        y: H * (0.64 + (i % 4) * 0.085),
        rx: W * (0.34 + (i % 3) * 0.14),
        ry: 46 + (i % 3) * 26,
        vx: (i % 2 === 0 ? 1 : -1) * (0.16 + i * 0.04) * Math.min(mult, 1.4),
        alpha: 0.08 + (i % 3) * 0.035,
      }));
      const motes = Array.from({ length: Math.round(34 * mult) }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0.18 + Math.random() * 0.35,
        vy: 0.15 + Math.random() * 0.45,
        r: 1 + Math.random() * 2.2,
        crimson: i % 5 === 0,
        phase: Math.random() * 6.28,
        alpha: 0.25 + Math.random() * 0.4,
      }));

      const loopFog = (t: number) => {
        raf = requestAnimationFrame(loopFog);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // Pale moonlit silver-sepia horizon wash
        const moonGrad = ctx.createRadialGradient(W * 0.5, H * 0.62, 12, W * 0.5, H * 0.62, Math.max(W, H) * 0.52);
        moonGrad.addColorStop(0, 'rgba(235, 226, 206, 0.11)');
        moonGrad.addColorStop(0.5, 'rgba(216, 206, 184, 0.04)');
        moonGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = moonGrad;
        ctx.fillRect(0, 0, W, H);

        for (let i = 0; i < fogBanks.length; i++) {
          const b = fogBanks[i];
          b.x += b.vx;
          if (b.vx > 0 && b.x - b.rx > W) b.x = -b.rx;
          if (b.vx < 0 && b.x + b.rx < 0) b.x = W + b.rx;

          ctx.save();
          ctx.translate(b.x, b.y + Math.sin(t * 0.0005 + i) * 8);
          ctx.scale(1, b.ry / b.rx);
          const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, b.rx);
          fg.addColorStop(0, `rgba(224, 214, 194, ${b.alpha})`);
          fg.addColorStop(0.65, `rgba(182, 174, 158, ${b.alpha * 0.45})`);
          fg.addColorStop(1, 'transparent');
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.arc(0, 0, b.rx, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        for (let i = 0; i < motes.length; i++) {
          const m = motes[i];
          m.x += m.vx + Math.sin(t * 0.001 + m.phase) * 0.25;
          m.y += m.vy;
          if (m.y > H + 15 || m.x > W + 20) {
            m.x = Math.random() * W * 0.85;
            m.y = -12;
          }
          ctx.globalAlpha = m.alpha;
          ctx.fillStyle = m.crimson ? '#c8101c' : '#e6dcc8';
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopFog);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // Dune: Scorching Arrakis Sun Corona, Heat Shimmer & Windblown Spice Sand
    if (fx === 'sandstorm') {
      const grains = Array.from({ length: Math.round(95 * mult) }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 2.2 + Math.random() * 4.4 * Math.min(mult, 1.5),
        vy: (Math.random() - 0.35) * 0.65,
        len: 4 + Math.random() * 14,
        r: 0.9 + Math.random() * 1.9,
        spice: i % 6 === 0,
        alpha: 0.28 + Math.random() * 0.45,
        phase: Math.random() * 6.28,
      }));

      const loopDune = (t: number) => {
        raf = requestAnimationFrame(loopDune);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // Blazing desert sun glow + shimmering heat horizon
        const sunX = W * 0.66;
        const sunY = H * 0.22;
        const pulse = 1 + Math.sin(t * 0.0014) * 0.05;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, Math.max(W, H) * 0.48 * pulse);
        sunGrad.addColorStop(0, 'rgba(255, 248, 210, 0.38)');
        sunGrad.addColorStop(0.18, 'rgba(255, 194, 78, 0.24)');
        sunGrad.addColorStop(0.55, 'rgba(240, 146, 36, 0.09)');
        sunGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, W, H);

        // Desert sand haze rolling near bottom dunes
        const hazeGrad = ctx.createLinearGradient(0, H * 0.65, 0, H);
        hazeGrad.addColorStop(0, 'transparent');
        hazeGrad.addColorStop(1, 'rgba(232, 160, 62, 0.16)');
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, H * 0.65, W, H * 0.35);

        // Windblown golden sand & glowing spice grains
        for (let i = 0; i < grains.length; i++) {
          const g = grains[i];
          g.x += g.vx;
          g.y += g.vy + Math.sin(t * 0.002 + g.phase) * 0.22;
          if (g.x > W + 24) {
            g.x = -20;
            g.y = Math.random() * H;
          }
          if (g.y < -10) g.y = H + 5;
          if (g.y > H + 10) g.y = -5;

          ctx.globalAlpha = g.alpha;
          if (g.spice) {
            ctx.fillStyle = '#4fc3f7';
            ctx.beginPath();
            ctx.arc(g.x, g.y, g.r * 1.15, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.strokeStyle = '#ffd584';
            ctx.lineWidth = g.r;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(g.x, g.y);
            ctx.lineTo(g.x - g.len, g.y - g.vy * 1.6);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopDune);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // Akira (1988): Neo-Tokyo Brutalist Towers, Olympic Stadium & Kaneda Moto Light Trails
    if (fx === 'akira88') {
      const towers = Array.from({ length: 18 }, (_, i) => {
        const w = 26 + ((i * 37) % 44);
        const h = 75 + ((i * 83) % 190);
        return {
          xRatio: (i + 0.25) / 18,
          w,
          h,
          hasAntenna: i % 3 === 0,
          winRows: Math.floor(h / 12),
          winCols: Math.max(2, Math.floor(w / 9)),
        };
      });

      interface MotoBike {
        x: number;
        y: number;
        dir: 1 | -1;
        speed: number;
        trail: { x: number; y: number }[];
        isKaneda: boolean;
      }

      const makeBike = (randomX: boolean): MotoBike => {
        const dir: 1 | -1 = Math.random() < 0.68 ? 1 : -1;
        const lane = Math.random();
        return {
          x: randomX ? Math.random() * W : dir === 1 ? -140 : W + 140,
          y: H * (0.85 + lane * 0.11),
          dir,
          speed: (4.8 + Math.random() * 5.2) * (0.8 + mult * 0.25),
          trail: [],
          isKaneda: Math.random() < 0.72,
        };
      };

      const bikes: MotoBike[] = Array.from({ length: Math.max(3, Math.round(4 * mult)) }, () =>
        makeBike(true)
      );

      let lightningCooldown = 90;
      let lightningBolt: { pts: { x: number; y: number }[]; alpha: number } | null = null;

      const loopAkira = (t: number) => {
        raf = requestAnimationFrame(loopAkira);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // 1. Neo-Tokyo 1988 Brutalist Skyline & Olympic Stadium Dome on lower horizon
        const horizonY = H * 0.89;
        ctx.save();
        for (let i = 0; i < towers.length; i++) {
          const tw = towers[i];
          const bx = tw.xRatio * W - tw.w * 0.5;
          const by = horizonY - tw.h;

          // Tower silhouette
          ctx.fillStyle = 'rgba(10, 8, 13, 0.56)';
          ctx.fillRect(bx, by, tw.w, tw.h + H * 0.12);

          // Red aviation beacon + architectural vertical stripe
          ctx.fillStyle = i % 2 === 0 ? 'rgba(230, 28, 36, 0.26)' : 'rgba(43, 140, 255, 0.2)';
          ctx.fillRect(bx + 2, by, 2, tw.h);

          if (tw.hasAntenna) {
            ctx.strokeStyle = 'rgba(255, 70, 80, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx + tw.w * 0.5, by);
            ctx.lineTo(bx + tw.w * 0.5, by - 22);
            ctx.stroke();

            if (Math.sin(t * 0.005 + i) > 0.2) {
              ctx.fillStyle = 'rgba(255, 40, 50, 0.75)';
              ctx.beginPath();
              ctx.arc(bx + tw.w * 0.5, by - 23, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Micro building window grid
          for (let r = 1; r < tw.winRows - 1; r += 2) {
            for (let c = 0; c < tw.winCols; c++) {
              if ((i + r * 3 + c * 5) % 4 === 0) {
                ctx.fillStyle =
                  (r + c) % 5 === 0
                    ? 'rgba(255, 58, 66, 0.36)'
                    : 'rgba(255, 206, 128, 0.24)';
                ctx.fillRect(bx + 5 + c * 8, by + r * 11, 4, 5);
              }
            }
          }
        }

        // Highway deck surface
        const roadGrad = ctx.createLinearGradient(0, horizonY - 10, 0, H);
        roadGrad.addColorStop(0, 'transparent');
        roadGrad.addColorStop(0.28, 'rgba(12, 8, 14, 0.65)');
        roadGrad.addColorStop(1, 'rgba(6, 4, 8, 0.88)');
        ctx.fillStyle = roadGrad;
        ctx.fillRect(0, horizonY - 10, W, H - horizonY + 10);

        // 2. Speeding Kaneda-style Superbikes with 1988 Red/Blue Light-Trail Ribbons
        for (let i = 0; i < bikes.length; i++) {
          const b = bikes[i];
          b.x += b.dir * b.speed;
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 26) b.trail.shift();

          if ((b.dir === 1 && b.x > W + 180) || (b.dir === -1 && b.x < -180)) {
            bikes[i] = makeBike(false);
            continue;
          }

          // Glowing dual tail-light laser ribbon (Akira movie signature)
          if (b.trail.length > 2) {
            for (let k = 1; k < b.trail.length; k++) {
              const frac = k / b.trail.length;
              const p0 = b.trail[k - 1];
              const p1 = b.trail[k];
              ctx.globalAlpha = frac * 0.72;
              ctx.strokeStyle = b.isKaneda ? '#ff1e29' : '#2b8cff';
              ctx.lineWidth = 2.6 * frac;
              ctx.beginPath();
              ctx.moveTo(p0.x, p0.y - 4);
              ctx.lineTo(p1.x, p1.y - 4);
              ctx.stroke();

              ctx.globalAlpha = frac * 0.42;
              ctx.strokeStyle = b.isKaneda ? '#ff9d7a' : '#7ae3ff';
              ctx.lineWidth = 1.2 * frac;
              ctx.beginPath();
              ctx.moveTo(p0.x, p0.y - 1);
              ctx.lineTo(p1.x, p1.y - 1);
              ctx.stroke();
            }
          }

          // Stylized Kaneda Superbike silhouette + headlight beam
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.scale(b.dir, 1);
          ctx.globalAlpha = 0.92;

          // Headlight cone
          const beam = ctx.createLinearGradient(12, -5, 58, -5);
          beam.addColorStop(0, 'rgba(255, 245, 210, 0.55)');
          beam.addColorStop(1, 'transparent');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(12, -6);
          ctx.lineTo(56, -16);
          ctx.lineTo(56, 4);
          ctx.closePath();
          ctx.fill();

          // Tires
          ctx.fillStyle = '#09090c';
          ctx.beginPath();
          ctx.arc(-11, -3, 4.2, 0, Math.PI * 2);
          ctx.arc(11, -3, 4.2, 0, Math.PI * 2);
          ctx.fill();

          // Reclined red Kaneda fairing + rider silhouette
          ctx.fillStyle = b.isKaneda ? '#e61c24' : '#2b8cff';
          ctx.beginPath();
          ctx.moveTo(-14, -4);
          ctx.quadraticCurveTo(-5, -12, 13, -7);
          ctx.lineTo(9, -3);
          ctx.closePath();
          ctx.fill();

          // Rider helmet
          ctx.fillStyle = '#181014';
          ctx.beginPath();
          ctx.arc(-3, -11, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 3. Occasional green-white Tetsuo psychic lightning crackle
        lightningCooldown--;
        if (lightningCooldown <= 0 && !lightningBolt) {
          lightningCooldown = 140 + Math.floor(Math.random() * 180);
          const lx = W * (0.2 + Math.random() * 0.6);
          const ly = H * (0.68 + Math.random() * 0.22);
          const pts = [{ x: lx, y: ly }];
          for (let j = 0; j < 5; j++) {
            pts.push({
              x: pts[pts.length - 1].x + (Math.random() - 0.5) * 70,
              y: pts[pts.length - 1].y + (Math.random() - 0.5) * 40,
            });
          }
          lightningBolt = { pts, alpha: 0.75 };
        }
        if (lightningBolt) {
          ctx.globalAlpha = lightningBolt.alpha;
          ctx.strokeStyle = '#9effc8';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          lightningBolt.pts.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          lightningBolt.alpha -= 0.06;
          if (lightningBolt.alpha <= 0) lightningBolt = null;
        }

        ctx.restore();
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopAkira);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // Ready Player One: Hyper-Realistic OASIS 3D Synth Grid, Copper/Jade/Crystal Keys & Voxel Coins
    if (fx === 'oasis') {
      const voxels = Array.from({ length: Math.round(52 * mult) }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vy: -(0.35 + Math.random() * 0.85),
        vx: (Math.random() - 0.5) * 0.3,
        size: i % 5 === 0 ? 5 : 2 + Math.random() * 2.5,
        kind: i % 4 === 0 ? 'coin' : i % 3 === 0 ? 'crystal' : 'voxel',
        color:
          i % 4 === 0
            ? '#fbbf24'
            : i % 3 === 0
              ? '#38e0ff'
              : i % 2 === 0
                ? '#e879f9'
                : '#34d399',
        phase: Math.random() * 6.28,
        alpha: 0.42 + Math.random() * 0.45,
      }));

      const keys = [
        { xRatio: 0.14, yRatio: 0.28, color: '#f59e0b', glow: 'rgba(245,158,11,0.55)', label: 'COPPER', speed: 0.0012 },
        { xRatio: 0.86, yRatio: 0.24, color: '#10b981', glow: 'rgba(16,185,129,0.55)', label: 'JADE', speed: 0.0015 },
        { xRatio: 0.82, yRatio: 0.68, color: '#38e0ff', glow: 'rgba(56,224,255,0.65)', label: 'CRYSTAL', speed: 0.0018 },
      ];

      const visorDrops = Array.from({ length: wetGlass ? Math.round(16 * mult) : 0 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1.8 + Math.random() * 2.6,
        alpha: 0.25 + Math.random() * 0.35,
      }));

      const loopOasis = (t: number) => {
        raf = requestAnimationFrame(loopOasis);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // 1. 3D-Perspective OASIS Wireframe Floor Grid
        const horizonY = H * 0.74;
        const cx = W * 0.5;
        ctx.save();
        const horizonGlow = ctx.createRadialGradient(cx, horizonY, 10, cx, horizonY, W * 0.65);
        horizonGlow.addColorStop(0, 'rgba(56, 224, 255, 0.22)');
        horizonGlow.addColorStop(0.45, 'rgba(217, 70, 239, 0.12)');
        horizonGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, horizonY - H * 0.28, W, H * 0.56);

        // Perspective radial lines
        ctx.strokeStyle = 'rgba(56, 224, 255, 0.22)';
        ctx.lineWidth = 1;
        for (let i = -10; i <= 10; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * 28, horizonY);
          ctx.lineTo(cx + i * (W * 0.16), H + 10);
          ctx.stroke();
        }
        // Moving horizontal depth scanlines
        const phaseScroll = (t * 0.00055) % 1;
        for (let r = 0; r < 9; r++) {
          const prog = (r + phaseScroll) / 9;
          const gy = horizonY + Math.pow(prog, 1.85) * (H - horizonY);
          ctx.strokeStyle = `rgba(217, 70, 239, ${0.12 + prog * 0.24})`;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
          ctx.stroke();
        }
        ctx.restore();

        // 2. Floating Copper, Jade & Crystal Key Holographic Projections
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const kx = W * k.xRatio;
          const ky = H * k.yRatio + Math.sin(t * k.speed + i * 2) * 10;
          const spin = Math.cos(t * k.speed * 1.4 + i);
          ctx.save();
          ctx.translate(kx, ky);
          ctx.scale(Math.max(0.28, Math.abs(spin)), 1);

          const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
          g.addColorStop(0, k.glow);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = k.color;
          ctx.lineWidth = 1.8;
          ctx.globalAlpha = 0.72;
          // Key bow (ornate ring) + shaft + teeth
          ctx.beginPath();
          ctx.arc(0, -10, 6.5, 0, Math.PI * 2);
          ctx.moveTo(0, -3.5);
          ctx.lineTo(0, 14);
          ctx.moveTo(0, 8);
          ctx.lineTo(5, 8);
          ctx.moveTo(0, 12);
          ctx.lineTo(6, 12);
          ctx.stroke();
          ctx.restore();
        }

        // 3. Drifting OASIS Voxels & Golden Extra-Life Coins
        for (let i = 0; i < voxels.length; i++) {
          const v = voxels[i];
          v.x += v.vx + Math.sin(t * 0.0012 + v.phase) * 0.28;
          v.y += v.vy;
          if (v.y < -20) {
            v.y = H + 15;
            v.x = Math.random() * W;
          }
          ctx.globalAlpha = v.alpha * (0.7 + 0.3 * Math.sin(t * 0.004 + v.phase));
          ctx.fillStyle = v.color;
          if (v.kind === 'coin') {
            ctx.beginPath();
            ctx.ellipse(
              v.x,
              v.y,
              Math.max(1.2, v.size * Math.abs(Math.cos(t * 0.004 + v.phase))),
              v.size,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();
          } else {
            ctx.fillRect(v.x, v.y, v.size, v.size);
          }
        }

        // 4. Refractive X1 Haptic Visor Glass Beads
        for (let i = 0; i < visorDrops.length; i++) {
          const d = visorDrops[i];
          ctx.globalAlpha = d.alpha;
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, Math.PI * 1.1, Math.PI * 1.8);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(56, 224, 255, 0.45)';
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r * 0.85, Math.PI * 0.2, Math.PI * 0.7);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopOasis);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // Ghost in the Shell (攻殻機動隊): Thermoptic Kanji Matrix Rain, Camo Hex Shimmer & New Port City Rain
    if (fx === 'gits') {
      const kanjiChars = '攻殻機動隊公安九課草薙素子電脳記憶義体接続人形使い新浜市光学迷彩同期網';
      const colStep = 22;
      const colCount = Math.max(12, Math.floor(W / colStep));
      const streams = Array.from({ length: Math.round(colCount * 0.72 * mult) }, (_, i) => ({
        x: ((i * colStep * 1.4) % Math.max(W, 320)) + Math.random() * 8,
        y: Math.random() * H,
        vy: 1.5 + Math.random() * 2.6,
        len: 6 + Math.floor(Math.random() * 10),
        size: 11 + (i % 3) * 1.5,
        alpha: 0.28 + Math.random() * 0.34,
        chars: Array.from(
          { length: 16 },
          () => kanjiChars[Math.floor(Math.random() * kanjiChars.length)]
        ),
        hue: i % 5 === 0 ? '#ff3b52' : i % 2 === 0 ? '#2df0d2' : '#00ffb2',
      }));

      const rainStreaks = Array.from({ length: Math.round(56 * mult) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 16 + Math.random() * 28,
        vy: 11 + Math.random() * 9,
        vx: -1.4 - Math.random() * 0.9,
        alpha: 0.14 + Math.random() * 0.24,
        color: Math.random() < 0.7 ? '#75ffea' : '#8fa8ff',
      }));

      const opticDrops = Array.from({ length: wetGlass ? Math.round(18 * mult) : 0 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1.8 + Math.random() * 2.8,
        alpha: 0.26 + Math.random() * 0.34,
      }));

      const loopGits = (t: number) => {
        raf = requestAnimationFrame(loopGits);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // 1. Thermoptic Camouflage Hex Shimmer Band
        const scanY = ((t * 0.045) % (H + 180)) - 90;
        const scanGrad = ctx.createLinearGradient(0, scanY - 70, 0, scanY + 70);
        scanGrad.addColorStop(0, 'transparent');
        scanGrad.addColorStop(0.5, 'rgba(45, 240, 210, 0.08)');
        scanGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 70, W, 140);

        // Subtle Section 9 Optical Reticle Grid
        ctx.save();
        ctx.strokeStyle = 'rgba(45, 240, 210, 0.18)';
        ctx.lineWidth = 1;
        const rx = W * 0.84;
        const ry = H * 0.24;
        ctx.beginPath();
        ctx.arc(rx, ry, 28 + Math.sin(t * 0.002) * 3, 0, Math.PI * 2);
        ctx.moveTo(rx - 38, ry);
        ctx.lineTo(rx - 14, ry);
        ctx.moveTo(rx + 14, ry);
        ctx.lineTo(rx + 38, ry);
        ctx.moveTo(rx, ry - 38);
        ctx.lineTo(rx, ry - 14);
        ctx.moveTo(rx, ry + 14);
        ctx.lineTo(rx, ry + 38);
        ctx.stroke();
        ctx.restore();

        // 2. Vertical 1995 Ghost in the Shell Kanji Telemetry Matrix Streams
        ctx.textAlign = 'center';
        for (let i = 0; i < streams.length; i++) {
          const s = streams[i];
          s.y += s.vy;
          if (s.y - s.len * (s.size + 2) > H) {
            s.y = -20;
            s.x = Math.random() * W;
          }
          if (Math.random() < 0.04) {
            const idx = Math.floor(Math.random() * s.chars.length);
            s.chars[idx] = kanjiChars[Math.floor(Math.random() * kanjiChars.length)];
          }
          ctx.font = `700 ${s.size}px "JetBrains Mono", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
          for (let j = 0; j < s.len; j++) {
            const cy = s.y - j * (s.size + 3);
            if (cy < -20 || cy > H + 20) continue;
            const fade = (1 - j / s.len) * s.alpha;
            ctx.globalAlpha = j === 0 ? Math.min(0.88, s.alpha * 1.9) : fade;
            ctx.fillStyle = j === 0 ? '#ebfffb' : s.hue;
            const ch = s.chars[(j + Math.floor(t * 0.004)) % s.chars.length];
            ctx.fillText(ch, s.x, cy);
          }
        }

        // 3. Diagonal New Port City Neon Rain Streaks
        ctx.lineWidth = 1;
        for (let i = 0; i < rainStreaks.length; i++) {
          const r = rainStreaks[i];
          r.x += r.vx;
          r.y += r.vy;
          if (r.y > H + 30 || r.x < -30) {
            r.y = -30;
            r.x = Math.random() * (W + 80);
          }
          ctx.globalAlpha = r.alpha;
          ctx.strokeStyle = r.color;
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - r.vx * 1.8, r.y - r.len);
          ctx.stroke();
        }

        // 4. Refractive Wet Glass Condensation Beads
        for (let i = 0; i < opticDrops.length; i++) {
          const d = opticDrops[i];
          ctx.globalAlpha = d.alpha;
          ctx.strokeStyle = 'rgba(153, 255, 240, 0.55)';
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, Math.PI * 1.05, Math.PI * 1.85);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(45, 240, 210, 0.42)';
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r * 0.82, Math.PI * 0.15, Math.PI * 0.72);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopGits);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // ThunderCats '85: Blazing Sword of Omens Lightning, Projected Eye of Thundera Sky Signal & Thundrillium Sparks
    if (fx === 'thundercats') {
      const sparkPalette = ['#fbbf24', '#fff3c4', '#e11d24', '#ff5b37', '#38bdf8'];
      const sparks = Array.from({ length: Math.round(62 * mult) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.9,
        vy: -(1.2 + Math.random() * 2.4),
        r: 1.1 + Math.random() * 2.4,
        alpha: 0.42 + Math.random() * 0.5,
        color: sparkPalette[Math.floor(Math.random() * sparkPalette.length)],
        phase: Math.random() * Math.PI * 2,
      }));

      const stormStreaks = Array.from({ length: Math.round(38 * mult) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 20 + Math.random() * 34,
        vx: -2.2 - Math.random() * 1.4,
        vy: 10 + Math.random() * 8,
        alpha: 0.14 + Math.random() * 0.22,
        color: Math.random() < 0.65 ? '#fde68a' : '#fda4af',
      }));

      const opticDrops = Array.from({ length: wetGlass ? Math.round(14 * mult) : 0 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1.8 + Math.random() * 2.8,
        alpha: 0.24 + Math.random() * 0.3,
      }));

      let boltTimer = 0;
      let boltAlpha = 0;
      let boltSegs: { x1: number; y1: number; x2: number; y2: number; w: number }[] = [];

      const spawnSwordBolt = () => {
        boltSegs = [];
        let cx = W * (0.28 + Math.random() * 0.44);
        let cy = 0;
        const steps = 8 + Math.floor(Math.random() * 5);
        for (let s = 0; s < steps; s++) {
          const nx = cx + (Math.random() - 0.5) * 95;
          const ny = cy + (H * 0.68) / steps + Math.random() * 18;
          boltSegs.push({ x1: cx, y1: cy, x2: nx, y2: ny, w: Math.max(1.2, 3.6 - s * 0.26) });
          if (Math.random() < 0.45) {
            const bx = nx + (Math.random() - 0.5) * 90;
            const by = ny + 32 + Math.random() * 44;
            boltSegs.push({ x1: nx, y1: ny, x2: bx, y2: by, w: 1.1 });
          }
          cx = nx;
          cy = ny;
        }
        boltAlpha = 0.92;
      };

      const loopThundercats = (t: number) => {
        raf = requestAnimationFrame(loopThundercats);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // 1. Projected Eye of Thundera Sky Signal ("Sight Beyond Sight")
        const sigX = W * 0.82;
        const sigY = H * 0.22;
        const pulse = 0.85 + Math.sin(t * 0.0026) * 0.15;
        ctx.save();
        const aura = ctx.createRadialGradient(sigX, sigY, 6, sigX, sigY, 92 * pulse);
        aura.addColorStop(0, 'rgba(225, 29, 36, 0.34)');
        aura.addColorStop(0.45, 'rgba(251, 191, 36, 0.16)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(sigX, sigY, 92 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(251, 191, 36, 0.42)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(sigX, sigY, 34, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(225, 29, 36, 0.28)';
        ctx.beginPath();
        ctx.arc(sigX, sigY, 31, 0, Math.PI * 2);
        ctx.fill();

        // Stylized Panther Crest Eye Silhouette inside beacon
        ctx.strokeStyle = 'rgba(255, 243, 196, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(sigX, sigY + 2, 18, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        ctx.restore();

        // 2. Blazing Sword of Omens Golden Lightning Forks
        boltTimer += 1;
        if (boltTimer > Math.max(48, Math.round(130 / Math.max(1, mult)))) {
          boltTimer = 0;
          if (Math.random() < 0.72) spawnSwordBolt();
        }
        if (boltAlpha > 0.02) {
          ctx.save();
          for (const seg of boltSegs) {
            ctx.globalAlpha = boltAlpha * 0.45;
            ctx.strokeStyle = '#e11d24';
            ctx.lineWidth = seg.w * 3.4;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            ctx.globalAlpha = boltAlpha * 0.85;
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = seg.w * 1.6;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            ctx.globalAlpha = boltAlpha;
            ctx.strokeStyle = '#fffbeb';
            ctx.lineWidth = seg.w * 0.65;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();
          }
          ctx.restore();
          boltAlpha *= 0.86;
        }

        // 3. Rising Radiant Thundrillium & Sword Sparks
        for (let i = 0; i < sparks.length; i++) {
          const p = sparks[i];
          p.x += p.vx + Math.sin(t * 0.002 + p.phase) * 0.55;
          p.y += p.vy;
          if (p.y < -16) {
            p.y = H + 14;
            p.x = Math.random() * W;
          }
          if (p.x < -16) p.x = W + 12;
          if (p.x > W + 16) p.x = -12;

          ctx.globalAlpha = p.alpha;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.8);
          g.addColorStop(0, '#fffbeb');
          g.addColorStop(0.35, p.color);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Cosmic Third Earth Storm Streaks
        ctx.lineWidth = 1.1;
        for (let i = 0; i < stormStreaks.length; i++) {
          const r = stormStreaks[i];
          r.x += r.vx;
          r.y += r.vy;
          if (r.y > H + 30 || r.x < -30) {
            r.y = -30;
            r.x = Math.random() * (W + 80);
          }
          ctx.globalAlpha = r.alpha;
          ctx.strokeStyle = r.color;
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - r.vx * 1.9, r.y - r.len);
          ctx.stroke();
        }

        // 5. Optional Refractive Glass Beads
        for (let i = 0; i < opticDrops.length; i++) {
          const d = opticDrops[i];
          ctx.globalAlpha = d.alpha;
          ctx.strokeStyle = 'rgba(255, 243, 196, 0.52)';
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, Math.PI * 1.05, Math.PI * 1.85);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopThundercats);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // 11. X-MEN '90S ANIMATED SERIES ENGINE:
    //     Comic halftone shimmer + Cerebro psychic sonar rings + Cyclops ruby visor beam + Storm lightning
    if (fx === 'xmen90s') {
      interface ComicSpark {
        x: number;
        y: number;
        vx: number;
        vy: number;
        r: number;
        alpha: number;
        color: string;
        phase: number;
      }
      interface BoltSeg {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        w: number;
      }
      const mkSpark = (edge: boolean): ComicSpark => {
        const cols = ['#facc15', '#38bdf8', '#ef4444', '#ffffff'];
        return {
          x: Math.random() * W,
          y: edge ? H + 12 : Math.random() * H,
          vx: (Math.random() - 0.5) * 1.1,
          vy: -(0.7 + Math.random() * 1.9),
          r: 1.5 + Math.random() * 2.5,
          alpha: 0.45 + Math.random() * 0.48,
          color: cols[Math.floor(Math.random() * cols.length)],
          phase: Math.random() * Math.PI * 2,
        };
      };
      const sparks = Array.from({ length: Math.round(40 * mult) }, () => mkSpark(false));
      let boltSegs: BoltSeg[] = [];
      let boltAlpha = 0;
      let nextBoltAt = 2400;
      let visorSweep = -0.3;

      const buildBolt = () => {
        const segs: BoltSeg[] = [];
        let cx = W * (0.15 + Math.random() * 0.7);
        let cy = 0;
        const steps = 11 + Math.floor(Math.random() * 5);
        for (let s = 0; s < steps; s++) {
          const nx = cx + (Math.random() - 0.5) * 70;
          const ny = cy + H * 0.048 + Math.random() * 14;
          segs.push({ x1: cx, y1: cy, x2: nx, y2: ny, w: Math.max(0.9, 3 - s * 0.16) });
          cx = nx;
          cy = ny;
        }
        boltSegs = segs;
        boltAlpha = 0.92;
      };

      const loopXmen = (t: number) => {
        raf = requestAnimationFrame(loopXmen);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // 1. Cerebro concentric psychic sonar rings
        const cx = W * 0.5;
        const cy = H * 0.24;
        for (let ring = 0; ring < 3; ring++) {
          const prog = ((t * 0.00022 + ring / 3) % 1);
          const rad = prog * Math.max(W, H) * 0.45;
          ctx.save();
          ctx.globalAlpha = (1 - prog) * 0.22;
          ctx.strokeStyle = ring % 2 === 0 ? '#38bdf8' : '#facc15';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([12, 8]);
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // 2. Cyclops Ruby Quartz Visor sweep beam across top corner
        visorSweep = (visorSweep + 0.0035) % 2.4;
        if (visorSweep < 1.1) {
          const bx = W * 0.85;
          const by = H * 0.08;
          const ang = Math.PI * (0.72 + visorSweep * 0.28);
          const len = Math.max(W, H) * 0.9;
          const ex = bx + Math.cos(ang) * len;
          const ey = by + Math.sin(ang) * len;
          ctx.save();
          const beamGrad = ctx.createLinearGradient(bx, by, ex, ey);
          beamGrad.addColorStop(0, 'rgba(255, 45, 45, 0.36)');
          beamGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.14)');
          beamGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(ex - 48, ey + 48);
          ctx.lineTo(ex + 48, ey - 48);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // 3. Storm Mutant Lightning Arcs
        if (t > nextBoltAt) {
          buildBolt();
          nextBoltAt = t + 2600 + Math.random() * 4200;
        }
        if (boltAlpha > 0.04) {
          ctx.save();
          ctx.lineCap = 'round';
          for (const seg of boltSegs) {
            ctx.globalAlpha = boltAlpha * 0.45;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = seg.w * 4.5;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();
            ctx.globalAlpha = boltAlpha;
            ctx.strokeStyle = '#fef9c3';
            ctx.lineWidth = seg.w * 0.7;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();
          }
          ctx.restore();
          boltAlpha *= 0.85;
        }

        // 4. 90s Comic Ink Halftone Pulses & Kinetic Mutant Energy Sparks
        for (let i = 0; i < sparks.length; i++) {
          const p = sparks[i];
          p.x += p.vx + Math.sin(t * 0.002 + p.phase) * 0.5;
          p.y += p.vy;
          if (p.y < -14) sparks[i] = mkSpark(true);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // 5. Subtle 90s Saturday Morning CRT Scanlines
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#000000';
        for (let y = 0; y < H; y += 4) {
          ctx.fillRect(0, y, W, 1);
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopXmen);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // 12. THE MATRIX DIGITAL RAIN ENGINE:
    //     Dense, hyper-realistic multi-layered cascading Matrix green code rain
    if (fx === 'matrixrain') {
      const glyphs =
        'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:=*+-<>¦｜Z';
      const layers = [
        { colW: 22, speedMin: 1.5, speedMax: 2.8, fontSize: 12, trail: 14, baseAlpha: 0.36 },
        { colW: 16, speedMin: 3.1, speedMax: 5.8, fontSize: 15, trail: 19, baseAlpha: 0.88 },
      ];
      interface RainStream {
        x: number;
        y: number;
        speed: number;
        trail: number;
        fontSize: number;
        alpha: number;
        chars: string[];
        tick: number;
      }
      const streams: RainStream[] = [];
      layers.forEach((L, li) => {
        const cols = Math.max(12, Math.floor(W / L.colW));
        const stride = li === 0 ? 1 : Math.max(1, Math.round(1.6 / Math.max(0.7, mult)));
        for (let c = 0; c < cols; c += stride) {
          const trail = L.trail + Math.floor(Math.random() * 10);
          streams.push({
            x: c * L.colW + 4,
            y: Math.random() * (H + 360) - 360,
            speed: L.speedMin + Math.random() * (L.speedMax - L.speedMin),
            trail,
            fontSize: L.fontSize,
            alpha: L.baseAlpha * (0.75 + Math.random() * 0.25),
            chars: Array.from({ length: trail }, () => glyphs[Math.floor(Math.random() * glyphs.length)]),
            tick: Math.floor(Math.random() * 20),
          });
        }
      });
      const matrixDrops = wetGlass
        ? Array.from({ length: Math.round(28 * mult) }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: 2 + Math.random() * 4.5,
            alpha: 0.16 + Math.random() * 0.24,
          }))
        : [];

      const loopMatrix = () => {
        raf = requestAnimationFrame(loopMatrix);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);
        ctx.textBaseline = 'top';

        for (let i = 0; i < streams.length; i++) {
          const s = streams[i];
          s.y += s.speed;
          s.tick++;
          if (s.tick % 4 === 0) {
            const mutIdx = Math.floor(Math.random() * s.chars.length);
            s.chars[mutIdx] = glyphs[Math.floor(Math.random() * glyphs.length)];
          }
          const stepH = s.fontSize + 2;
          if (s.y - s.trail * stepH > H + 20) {
            s.y = -(Math.random() * 180 + 40);
          }

          ctx.font = `700 ${s.fontSize}px 'JetBrains Mono', monospace`;
          for (let j = 0; j < s.trail; j++) {
            const cy = s.y - j * stepH;
            if (cy < -stepH || cy > H + 10) continue;
            const fade = Math.max(0, 1 - j / s.trail);
            if (j === 0) {
              ctx.globalAlpha = Math.min(1, s.alpha + 0.12);
              ctx.shadowColor = '#00ff41';
              ctx.shadowBlur = 10;
              ctx.fillStyle = '#e8ffed';
            } else if (j === 1) {
              ctx.globalAlpha = s.alpha * 0.92;
              ctx.shadowBlur = 5;
              ctx.shadowColor = '#00ff41';
              ctx.fillStyle = '#6bff8f';
            } else {
              ctx.shadowBlur = 0;
              ctx.globalAlpha = s.alpha * fade * 0.78;
              ctx.fillStyle = fade > 0.45 ? '#00ff41' : '#056e20';
            }
            ctx.fillText(s.chars[j % s.chars.length], s.x, cy);
          }
        }
        ctx.shadowBlur = 0;

        // Green glass rain droplets
        for (let i = 0; i < matrixDrops.length; i++) {
          const d = matrixDrops[i];
          ctx.globalAlpha = d.alpha * 0.8;
          ctx.strokeStyle = 'rgba(0, 255, 65, 0.55)';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, Math.PI * 1.05, Math.PI * 1.85);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopMatrix);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // 13. PIRATES OF THE DARK SEAS ENGINE:
    //     Rolling dark storm waves, articulated Kraken tentacles with suckers & bioluminescent sea creatures
    if (fx === 'kraken') {
      interface SeaSpray {
        x: number;
        y: number;
        vx: number;
        vy: number;
        len: number;
        alpha: number;
      }
      interface JellyCreature {
        x: number;
        y: number;
        vy: number;
        r: number;
        phase: number;
        hue: string;
      }
      interface AnglerCreature {
        x: number;
        y: number;
        vx: number;
        scale: number;
        phase: number;
      }

      const sprays: SeaSpray[] = Array.from({ length: Math.round(62 * mult) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: -2.2 - Math.random() * 1.5,
        vy: 8 + Math.random() * 6,
        len: 12 + Math.random() * 14,
        alpha: 0.16 + Math.random() * 0.25,
      }));
      const jellies: JellyCreature[] = Array.from({ length: Math.round(5 * mult) }, () => ({
        x: Math.random() * W,
        y: H * (0.45 + Math.random() * 0.45),
        vy: -(0.18 + Math.random() * 0.35),
        r: 9 + Math.random() * 11,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.65 ? '#2dd4bf' : '#38bdf8',
      }));
      const anglers: AnglerCreature[] = Array.from({ length: Math.max(1, Math.round(2 * mult)) }, (_, idx) => ({
        x: idx % 2 === 0 ? W * 0.18 : W * 0.82,
        y: H * (0.72 + idx * 0.08),
        vx: idx % 2 === 0 ? 0.55 : -0.55,
        scale: 0.75 + idx * 0.22,
        phase: idx * 2.1,
      }));

      let flashAlpha = 0;
      let nextFlash = 2800;

      const drawTentacle = (
        baseX: number,
        baseY: number,
        reach: number,
        baseAngle: number,
        baseWidth: number,
        swayAmp: number,
        freq: number,
        phase: number,
        t: number,
        colorBody: string,
        colorSucker: string
      ) => {
        const segs = 18;
        const pts: { x: number; y: number; w: number; nx: number; ny: number }[] = [];
        let cx = baseX;
        let cy = baseY;
        const segLen = reach / segs;

        for (let i = 0; i <= segs; i++) {
          const frac = i / segs;
          const bend =
            Math.sin(t * freq + phase - frac * 3.1) * swayAmp * (0.2 + frac * 1.15) +
            Math.cos(t * freq * 0.6 + phase) * 0.14 * frac;
          const ang = baseAngle + bend;
          const nx = -Math.sin(ang);
          const ny = Math.cos(ang);
          const w = baseWidth * Math.pow(1 - frac * 0.88, 1.05);
          pts.push({ x: cx, y: cy, w, nx, ny });
          cx += Math.cos(ang) * segLen;
          cy += Math.sin(ang) * segLen;
        }

        // Tapered tentacle silhouette
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const px = p.x + p.nx * p.w;
          const py = p.y + p.ny * p.w;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        for (let i = pts.length - 1; i >= 0; i--) {
          const p = pts[i];
          ctx.lineTo(p.x - p.nx * p.w, p.y - p.ny * p.w);
        }
        ctx.closePath();
        ctx.fillStyle = colorBody;
        ctx.fill();
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.34)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Bioluminescent sucker discs along inner curve
        for (let i = 2; i < pts.length - 2; i += 2) {
          const p = pts[i];
          const r = Math.max(1.4, p.w * 0.36);
          ctx.fillStyle = colorSucker;
          ctx.beginPath();
          ctx.arc(p.x + p.nx * p.w * 0.45, p.y + p.ny * p.w * 0.45, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };

      const loopKraken = (t: number) => {
        raf = requestAnimationFrame(loopKraken);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // 1. Occasional Abyssal Storm Cloud Flash
        if (t > nextFlash) {
          flashAlpha = 0.24;
          nextFlash = t + 3200 + Math.random() * 5200;
        }
        if (flashAlpha > 0.01) {
          ctx.fillStyle = `rgba(94, 234, 212, ${flashAlpha * 0.45})`;
          ctx.fillRect(0, 0, W, H);
          flashAlpha *= 0.88;
        }

        // 2. Bioluminescent Abyssal Jellyfish drifting upward
        for (const j of jellies) {
          j.y += j.vy;
          const pulse = Math.sin(t * 0.004 + j.phase);
          if (j.y < H * 0.2) {
            j.y = H + 30;
            j.x = Math.random() * W;
          }
          const jx = j.x + Math.sin(t * 0.0014 + j.phase) * 18;
          ctx.save();
          ctx.globalAlpha = 0.48;
          const g = ctx.createRadialGradient(jx, j.y, 1, jx, j.y, j.r * 1.4);
          g.addColorStop(0, j.hue);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(jx, j.y, j.r * (1 + pulse * 0.12), j.r * 0.65, 0, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = j.hue;
          ctx.lineWidth = 0.9;
          for (let k = -1; k <= 1; k++) {
            ctx.beginPath();
            ctx.moveTo(jx + k * j.r * 0.4, j.y);
            ctx.quadraticCurveTo(
              jx + k * j.r * 0.6 + Math.sin(t * 0.005 + k) * 6,
              j.y + j.r * 1.2,
              jx + k * j.r * 0.3,
              j.y + j.r * 2.4
            );
            ctx.stroke();
          }
          ctx.restore();
        }

        // 3. Looming Kraken Eyes in the Dark Sea
        const eyeX = W * 0.5 + Math.sin(t * 0.0005) * 40;
        const eyeY = H * 0.87 + Math.sin(t * 0.0012) * 8;
        ctx.save();
        ctx.globalAlpha = 0.55 + Math.sin(t * 0.002) * 0.2;
        [-18, 18].forEach((dx) => {
          const eg = ctx.createRadialGradient(eyeX + dx, eyeY, 0, eyeX + dx, eyeY, 18);
          eg.addColorStop(0, '#fef08a');
          eg.addColorStop(0.35, '#14b8a6');
          eg.addColorStop(1, 'transparent');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.ellipse(eyeX + dx, eyeY, 9, 4.5, dx < 0 ? 0.15 : -0.15, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        // 4. Articulated Giant Kraken Tentacles rising from the depths & edges
        const tentacleConfigs = [
          { x: W * 0.08, y: H + 20, reach: H * 0.52, ang: -Math.PI * 0.42, w: 22, sway: 0.42, f: 0.0018, ph: 0.2 },
          { x: W * 0.23, y: H + 24, reach: H * 0.42, ang: -Math.PI * 0.53, w: 18, sway: 0.46, f: 0.0021, ph: 1.4 },
          { x: W * 0.76, y: H + 24, reach: H * 0.44, ang: -Math.PI * 0.47, w: 19, sway: 0.44, f: 0.0019, ph: 2.5 },
          { x: W * 0.93, y: H + 18, reach: H * 0.56, ang: -Math.PI * 0.58, w: 24, sway: 0.4, f: 0.0017, ph: 3.7 },
          { x: -16, y: H * 0.62, reach: Math.min(W * 0.28, 220), ang: -0.18, w: 15, sway: 0.36, f: 0.0023, ph: 4.8 },
          { x: W + 16, y: H * 0.58, reach: Math.min(W * 0.28, 220), ang: Math.PI + 0.18, w: 15, sway: 0.36, f: 0.0022, ph: 5.5 },
        ];
        tentacleConfigs.forEach((tc, idx) => {
          ctx.globalAlpha = idx >= 4 ? 0.65 : 0.82;
          drawTentacle(
            tc.x,
            tc.y,
            tc.reach,
            tc.ang,
            tc.w,
            tc.sway,
            tc.f,
            tc.ph,
            t,
            'rgba(4, 17, 22, 0.92)',
            'rgba(45, 212, 191, 0.55)'
          );
        });

        // 5. Swimming Abyssal Anglerfish Silhouettes with glowing esca lantern
        for (const a of anglers) {
          a.x += a.vx;
          if (a.x > W + 90) a.x = -90;
          if (a.x < -90) a.x = W + 90;
          const ay = a.y + Math.sin(t * 0.002 + a.phase) * 14;
          const dir = a.vx >= 0 ? 1 : -1;
          ctx.save();
          ctx.translate(a.x, ay);
          ctx.scale(dir * a.scale, a.scale);
          ctx.globalAlpha = 0.72;
          // Dark fish silhouette
          ctx.fillStyle = '#030b0f';
          ctx.beginPath();
          ctx.ellipse(0, 0, 26, 15, 0, 0, Math.PI * 2);
          ctx.moveTo(-22, 0);
          ctx.lineTo(-40, -12);
          ctx.lineTo(-36, 0);
          ctx.lineTo(-40, 12);
          ctx.closePath();
          ctx.fill();
          // Illicium rod & glowing esca lure
          ctx.strokeStyle = 'rgba(45, 212, 191, 0.55)';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(14, -10);
          ctx.quadraticCurveTo(34, -28, 36, -6);
          ctx.stroke();
          const lg = ctx.createRadialGradient(36, -6, 0, 36, -6, 14);
          lg.addColorStop(0, '#fef9c3');
          lg.addColorStop(0.4, '#2dd4bf');
          lg.addColorStop(1, 'transparent');
          ctx.fillStyle = lg;
          ctx.beginPath();
          ctx.arc(36, -6, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 6. Dark Storm Ocean Waves Across Bottom Horizon
        for (let wIdx = 0; wIdx < 2; wIdx++) {
          ctx.save();
          ctx.beginPath();
          const baseH = H * (wIdx === 0 ? 0.87 : 0.92);
          ctx.moveTo(0, H);
          for (let x = 0; x <= W + 24; x += 24) {
            const wy =
              baseH +
              Math.sin(x * 0.012 + t * (0.002 + wIdx * 0.0008) + wIdx) * (12 + wIdx * 4) +
              Math.cos(x * 0.025 - t * 0.0015) * 6;
            ctx.lineTo(x, wy);
          }
          ctx.lineTo(W, H);
          ctx.closePath();
          ctx.fillStyle = wIdx === 0 ? 'rgba(4, 18, 26, 0.58)' : 'rgba(2, 10, 15, 0.78)';
          ctx.fill();
          ctx.strokeStyle = wIdx === 0 ? 'rgba(94, 234, 212, 0.25)' : 'rgba(245, 158, 11, 0.22)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.restore();
        }

        // 7. Driving Sea Storm Rain
        ctx.lineWidth = 1;
        for (const r of sprays) {
          r.x += r.vx;
          r.y += r.vy;
          if (r.y > H + 20 || r.x < -20) {
            r.y = -20;
            r.x = Math.random() * (W + 80);
          }
          ctx.globalAlpha = r.alpha;
          ctx.strokeStyle = '#99f6e4';
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - r.vx * 1.4, r.y - r.len);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopKraken);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // 14. STEAMPUNK STEAM MACHINE ENGINE:
    //     Volumetric pressurized billowing steam plumes, rotating brass cogs & furnace embers
    if (fx === 'steamengine') {
      interface SteamPuff {
        x: number;
        y: number;
        vx: number;
        vy: number;
        r: number;
        grow: number;
        alpha: number;
        life: number;
        maxLife: number;
        warm: boolean;
      }
      interface FurnaceSpark {
        x: number;
        y: number;
        vx: number;
        vy: number;
        r: number;
        alpha: number;
        phase: number;
      }

      const mkPuff = (jetIdx?: number): SteamPuff => {
        const origins = [
          { x: W * 0.1, y: H + 10, vx: 0.7, vy: -1.6 },
          { x: W * 0.5, y: H + 10, vx: 0, vy: -1.9 },
          { x: W * 0.9, y: H + 10, vx: -0.7, vy: -1.6 },
          { x: -12, y: H * 0.65, vx: 2.3, vy: -0.9 },
          { x: W + 12, y: H * 0.6, vx: -2.3, vy: -0.9 },
        ];
        const o = origins[jetIdx !== undefined ? jetIdx % origins.length : Math.floor(Math.random() * origins.length)];
        return {
          x: o.x + (Math.random() - 0.5) * 44,
          y: o.y + (Math.random() - 0.5) * 24,
          vx: o.vx + (Math.random() - 0.5) * 0.75,
          vy: o.vy - Math.random() * 1.1,
          r: 22 + Math.random() * 24,
          grow: 0.45 + Math.random() * 0.55,
          alpha: 0.24 + Math.random() * 0.22,
          life: 0,
          maxLife: 130 + Math.random() * 110,
          warm: Math.random() < 0.35,
        };
      };

      const puffs: SteamPuff[] = Array.from({ length: Math.round(44 * mult) }, (_, idx) => {
        const p = mkPuff(idx);
        p.life = Math.random() * p.maxLife * 0.75;
        p.x += p.vx * p.life * 0.5;
        p.y += p.vy * p.life * 0.5;
        p.r += p.grow * p.life * 0.45;
        return p;
      });
      const sparks: FurnaceSpark[] = Array.from({ length: Math.round(32 * mult) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.8 + Math.random() * 1.4),
        r: 1.2 + Math.random() * 2.2,
        alpha: 0.45 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
      }));

      const drawGear = (
        gx: number,
        gy: number,
        outerR: number,
        teeth: number,
        angle: number,
        color: string,
        alpha: number
      ) => {
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(angle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.48)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const innerR = outerR * 0.82;
        for (let i = 0; i < teeth; i++) {
          const a0 = (i / teeth) * Math.PI * 2;
          const a1 = ((i + 0.35) / teeth) * Math.PI * 2;
          const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
          const a3 = ((i + 0.85) / teeth) * Math.PI * 2;
          if (i === 0) ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
          else ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
          ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
          ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
          ctx.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Hollow hub cutout look
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
        ctx.lineWidth = outerR * 0.14;
        ctx.beginPath();
        ctx.arc(0, 0, outerR * 0.44, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      };

      const loopSteam = (t: number) => {
        raf = requestAnimationFrame(loopSteam);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // 1. Interlocking Rotating Brass Clockwork Gears at corners
        drawGear(W * 0.04, H * 0.88, 72, 14, t * 0.00035, 'rgba(69, 34, 12, 0.72)', 0.55);
        drawGear(W * 0.04 + 98, H * 0.94, 48, 10, -t * 0.0005, 'rgba(92, 48, 16, 0.7)', 0.5);
        drawGear(W * 0.96, H * 0.86, 80, 16, -t * 0.0003, 'rgba(69, 34, 12, 0.72)', 0.55);
        drawGear(W * 0.96 - 104, H * 0.93, 52, 11, t * 0.00046, 'rgba(92, 48, 16, 0.7)', 0.5);

        // 2. Reciprocating Copper Piston Rod Bar near bottom left/right
        const pistonSlide = Math.sin(t * 0.004) * 32;
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, H * 0.94);
        ctx.lineTo(130 + pistonSlide, H * 0.94);
        ctx.stroke();
        ctx.restore();

        // 3. Volumetric Billowing Pressurized Live Steam Clouds on Screen
        for (let i = 0; i < puffs.length; i++) {
          const p = puffs[i];
          p.life += 1;
          p.x += p.vx + Math.sin(t * 0.0014 + i) * 0.35;
          p.y += p.vy;
          p.r += p.grow;
          p.vx *= 0.996;
          if (p.life >= p.maxLife || p.y < -p.r * 2) {
            puffs[i] = mkPuff(i);
            continue;
          }
          const lifeProg = p.life / p.maxLife;
          const fade = Math.sin(lifeProg * Math.PI);
          const a = p.alpha * fade;
          if (a <= 0.01) continue;

          const sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          if (p.warm) {
            sg.addColorStop(0, `rgba(255, 244, 224, ${a})`);
            sg.addColorStop(0.45, `rgba(245, 214, 174, ${a * 0.52})`);
          } else {
            sg.addColorStop(0, `rgba(250, 250, 252, ${a})`);
            sg.addColorStop(0.45, `rgba(214, 219, 226, ${a * 0.48})`);
          }
          sg.addColorStop(1, 'transparent');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Rising Coal Furnace Sparks
        for (const sp of sparks) {
          sp.x += sp.vx + Math.sin(t * 0.003 + sp.phase) * 0.4;
          sp.y += sp.vy;
          if (sp.y < -12) {
            sp.y = H + 12;
            sp.x = Math.random() * W;
          }
          ctx.globalAlpha = sp.alpha;
          const fg = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.r * 2.5);
          fg.addColorStop(0, '#fef3c7');
          fg.addColorStop(0.45, '#f59e0b');
          fg.addColorStop(1, 'transparent');
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.r * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopSteam);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // Aliens Farm Invasion — Night Cornfield Stalks, Sweeping UFO Saucers & Green Tractor Beams
    if (fx === 'alienfarm') {
      interface UfoCraft {
        x: number;
        y: number;
        vx: number;
        bobPhase: number;
        scale: number;
        beamWidth: number;
        beamPulse: number;
      }
      interface AbductMote {
        x: number;
        y: number;
        vy: number;
        r: number;
        alpha: number;
        phase: number;
        green: boolean;
      }
      interface CornStalk {
        x: number;
        h: number;
        lean: number;
        phase: number;
        leafSide: number;
      }

      const saucerCount = fxLevel === 3 ? 3 : 2;
      const ufos: UfoCraft[] = Array.from({ length: saucerCount }, (_, i) => ({
        x: W * (0.2 + i * 0.34),
        y: H * (0.14 + (i % 2) * 0.08),
        vx: (i % 2 === 0 ? 1 : -1) * (0.42 + i * 0.14),
        bobPhase: Math.random() * Math.PI * 2,
        scale: 0.78 + (i % 2) * 0.24,
        beamWidth: 92 + i * 24,
        beamPulse: Math.random() * Math.PI * 2,
      }));

      const stalks: CornStalk[] = Array.from({ length: Math.max(26, Math.round(W / 24)) }, (_, i) => ({
        x: (i / Math.max(25, Math.round(W / 24) - 1)) * (W + 20) - 10,
        h: 58 + (i % 5) * 14 + Math.random() * 22,
        lean: (Math.random() - 0.5) * 8,
        phase: i * 0.43,
        leafSide: i % 2 === 0 ? 1 : -1,
      }));

      const motes: AbductMote[] = Array.from({ length: Math.round(52 * mult) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vy: -(0.55 + Math.random() * 1.45),
        r: 1.4 + Math.random() * 2.4,
        alpha: 0.38 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        green: Math.random() < 0.82,
      }));

      const loopAlienFarm = (t: number) => {
        raf = requestAnimationFrame(loopAlienFarm);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // 1. Floating green night-field abduction spores & crop mist motes
        for (const m of motes) {
          m.y += m.vy;
          m.x += Math.sin(t * 0.002 + m.phase) * 0.45;
          if (m.y < -16) {
            m.y = H + 12;
            m.x = Math.random() * W;
          }
          ctx.globalAlpha = m.alpha * (0.65 + 0.35 * Math.sin(t * 0.004 + m.phase));
          const mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3);
          mg.addColorStop(0, m.green ? '#86efac' : '#7dd3fc');
          mg.addColorStop(0.5, m.green ? 'rgba(57, 255, 20, 0.45)' : 'rgba(56, 189, 248, 0.35)');
          mg.addColorStop(1, 'transparent');
          ctx.fillStyle = mg;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 2. Hovering Flying Saucers & Sweeping Neon-Green Conical Tractor Beams
        for (let i = 0; i < ufos.length; i++) {
          const u = ufos[i];
          u.x += u.vx;
          if (u.x > W + 90) u.x = -90;
          if (u.x < -90) u.x = W + 90;
          const uy = u.y + Math.sin(t * 0.0022 + u.bobPhase) * 9;
          const beamPulse = 0.78 + 0.22 * Math.sin(t * 0.0045 + u.beamPulse);
          const groundY = H * 0.94;
          const topW = 18 * u.scale;
          const botW = u.beamWidth * u.scale;

          // Conical green tractor beam
          ctx.save();
          const bg = ctx.createLinearGradient(u.x, uy + 8, u.x, groundY);
          bg.addColorStop(0, `rgba(57, 255, 20, ${0.32 * beamPulse})`);
          bg.addColorStop(0.5, `rgba(34, 197, 94, ${0.15 * beamPulse})`);
          bg.addColorStop(1, `rgba(74, 222, 128, ${0.04 * beamPulse})`);
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.moveTo(u.x - topW, uy + 8);
          ctx.lineTo(u.x + topW, uy + 8);
          ctx.lineTo(u.x + botW, groundY);
          ctx.lineTo(u.x - botW, groundY);
          ctx.closePath();
          ctx.fill();

          // Rising anti-gravity levitation rings inside the beam
          for (let r = 0; r < 3; r++) {
            const prog = ((t * 0.00042 + r * 0.33 + i * 0.2) % 1);
            const ry = groundY - prog * (groundY - (uy + 14));
            const rx = botW * (1 - prog * 0.78);
            ctx.globalAlpha = Math.sin(prog * Math.PI) * 0.42;
            ctx.strokeStyle = '#86efac';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(u.x, ry, rx, Math.max(3, rx * 0.22), 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;

          // Saucer hull & illuminated dome
          ctx.translate(u.x, uy);
          ctx.scale(u.scale, u.scale);
          ctx.fillStyle = 'rgba(15, 23, 28, 0.88)';
          ctx.strokeStyle = 'rgba(134, 239, 172, 0.72)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 42, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'rgba(56, 189, 248, 0.34)';
          ctx.beginPath();
          ctx.ellipse(0, -6, 19, 10, 0, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Rim beacon lights
          for (let l = -3; l <= 3; l++) {
            const lx = l * 10.5;
            const blink = Math.sin(t * 0.008 + l + i) > 0 ? 0.95 : 0.35;
            ctx.globalAlpha = blink;
            ctx.fillStyle = l % 2 === 0 ? '#39ff14' : '#38bdf8';
            ctx.beginPath();
            ctx.arc(lx, 1, 2.1, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 3. Swaying Nighttime Cornfield Stalks Silhouette Illuminated by Overhead Beams
        ctx.save();
        for (const s of stalks) {
          const sway = Math.sin(t * 0.0018 + s.phase) * 5.5;
          // Check proximity to any UFO tractor beam
          let beamLit = 0;
          for (const u of ufos) {
            const dist = Math.abs(s.x - u.x);
            if (dist < u.beamWidth * u.scale) {
              beamLit = Math.max(beamLit, 1 - dist / (u.beamWidth * u.scale));
            }
          }
          ctx.strokeStyle = beamLit > 0.15 ? `rgba(74, 222, 128, ${0.32 + beamLit * 0.45})` : 'rgba(6, 22, 10, 0.85)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(s.x, H);
          ctx.quadraticCurveTo(s.x + s.lean + sway * 0.5, H - s.h * 0.55, s.x + s.lean + sway, H - s.h);
          ctx.stroke();

          // Long corn blades & tassel ear
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(s.x + sway * 0.35, H - s.h * 0.48);
          ctx.quadraticCurveTo(s.x + s.leafSide * 18 + sway, H - s.h * 0.62, s.x + s.leafSide * 24 + sway, H - s.h * 0.36);
          ctx.moveTo(s.x + sway * 0.55, H - s.h * 0.72);
          ctx.quadraticCurveTo(s.x - s.leafSide * 15 + sway, H - s.h * 0.82, s.x - s.leafSide * 21 + sway, H - s.h * 0.58);
          ctx.stroke();
        }
        ctx.restore();
      };

      raf = requestAnimationFrame(loopAlienFarm);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // Dungeons & Dragons Tabletop — Etched Battlegrid, Tumbling Polyhedral Dice (d20/d12/d8/d4) & Dragon Embers
    if (fx === 'dndtable') {
      type DieKind = 'd20' | 'd8' | 'd4' | 'd12';
      interface FloatingDie {
        x: number;
        y: number;
        vx: number;
        vy: number;
        rot: number;
        vrot: number;
        r: number;
        kind: DieKind;
        color: string;
        edge: string;
        num: string;
        alpha: number;
      }
      interface DragonEmber {
        x: number;
        y: number;
        vx: number;
        vy: number;
        r: number;
        alpha: number;
        phase: number;
      }

      const dieSpecs: { kind: DieKind; color: string; edge: string; num: string }[] = [
        { kind: 'd20', color: 'rgba(185, 28, 28, 0.32)', edge: '#fbbf24', num: '20' },
        { kind: 'd20', color: 'rgba(190, 24, 93, 0.28)', edge: '#f472b6', num: '20' },
        { kind: 'd8', color: 'rgba(14, 116, 144, 0.3)', edge: '#38bdf8', num: '8' },
        { kind: 'd4', color: 'rgba(21, 128, 61, 0.3)', edge: '#4ade80', num: '4' },
        { kind: 'd12', color: 'rgba(180, 83, 9, 0.3)', edge: '#fcd34d', num: '12' },
      ];

      const diceCount = Math.round(9 * Math.min(mult, 1.45));
      const dice: FloatingDie[] = Array.from({ length: diceCount }, (_, i) => {
        const sp = dieSpecs[i % dieSpecs.length];
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.42,
          vy: -(0.22 + Math.random() * 0.45),
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.012,
          r: 16 + (i % 3) * 7,
          kind: sp.kind,
          color: sp.color,
          edge: sp.edge,
          num: sp.num,
          alpha: 0.42 + Math.random() * 0.26,
        };
      });

      const embers: DragonEmber[] = Array.from({ length: Math.round(30 * mult) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.55,
        vy: -(0.7 + Math.random() * 1.4),
        r: 1.2 + Math.random() * 2.2,
        alpha: 0.4 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
      }));

      const drawPolyDie = (d: FloatingDie) => {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.color;
        ctx.strokeStyle = d.edge;
        ctx.lineWidth = 1.4;

        const sides = d.kind === 'd4' ? 3 : d.kind === 'd8' ? 4 : d.kind === 'd12' ? 5 : 6;
        ctx.beginPath();
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(a) * d.r;
          const py = Math.sin(a) * d.r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner icosahedral/polyhedral bevel facets
        if (d.kind === 'd20' || d.kind === 'd12') {
          const ir = d.r * 0.52;
          ctx.beginPath();
          for (let s = 0; s < sides; s++) {
            const a = (s / sides) * Math.PI * 2 - Math.PI / 2;
            const b = ((s + 1) / sides) * Math.PI * 2 - Math.PI / 2;
            const ox = Math.cos(a) * d.r;
            const oy = Math.sin(a) * d.r;
            const ix = Math.cos(a + 0.35) * ir;
            const iy = Math.sin(a + 0.35) * ir;
            const jx = Math.cos(b + 0.35) * ir;
            const jy = Math.sin(b + 0.35) * ir;
            ctx.moveTo(ox, oy);
            ctx.lineTo(ix, iy);
            ctx.lineTo(jx, jy);
          }
          ctx.stroke();
        } else if (d.kind === 'd8' || d.kind === 'd4') {
          ctx.beginPath();
          for (let s = 0; s < sides; s++) {
            const a = (s / sides) * Math.PI * 2 - Math.PI / 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * d.r, Math.sin(a) * d.r);
          }
          ctx.stroke();
        }

        ctx.rotate(-d.rot * 0.45);
        ctx.fillStyle = '#fef3c7';
        ctx.font = `700 ${Math.round(d.r * 0.48)}px 'Cinzel', Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.num, 0, 1);
        ctx.restore();
      };

      const loopDndTable = (t: number) => {
        raf = requestAnimationFrame(loopDndTable);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // 1. Subtle etched D&D 1-inch tabletop dungeon grid overlay
        ctx.save();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.045)';
        ctx.lineWidth = 1;
        const step = 64;
        for (let gx = 0; gx < W; gx += step) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, H);
          ctx.stroke();
        }
        for (let gy = 0; gy < H; gy += step) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
          ctx.stroke();
        }
        ctx.restore();

        // 2. Tumbling 3D-faceted Polyhedral RPG Dice
        for (const d of dice) {
          d.x += d.vx;
          d.y += d.vy;
          d.rot += d.vrot;
          if (d.y < -d.r * 2) {
            d.y = H + d.r * 2;
            d.x = Math.random() * W;
          }
          if (d.x < -d.r * 2) d.x = W + d.r * 2;
          if (d.x > W + d.r * 2) d.x = -d.r * 2;
          drawPolyDie(d);
        }

        // 3. Rising Dragonfire & Torchlight Hearth Embers
        for (const em of embers) {
          em.x += em.vx + Math.sin(t * 0.0025 + em.phase) * 0.45;
          em.y += em.vy;
          if (em.y < -12) {
            em.y = H + 12;
            em.x = Math.random() * W;
          }
          ctx.globalAlpha = em.alpha;
          const eg = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, em.r * 2.6);
          eg.addColorStop(0, '#fef3c7');
          eg.addColorStop(0.45, '#ef4444');
          eg.addColorStop(1, 'transparent');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.arc(em.x, em.y, em.r * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopDndTable);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // 14. Templar Dark Medieval Rain & Storm Engine
    if (fx === 'templar_rain') {
      interface StormDrop {
        x: number;
        y: number;
        vx: number;
        vy: number;
        len: number;
        alpha: number;
      }
      interface MistBand {
        x: number;
        y: number;
        rx: number;
        ry: number;
        vx: number;
        alpha: number;
      }
      const stormDrops: StormDrop[] = Array.from({ length: Math.round(115 * mult) }, () => ({
        x: Math.random() * (W + 180) - 90,
        y: Math.random() * H,
        vx: -2.2 - Math.random() * 1.4,
        vy: 14 + Math.random() * 9,
        len: 18 + Math.random() * 24,
        alpha: 0.2 + Math.random() * 0.35,
      }));
      const mists: MistBand[] = Array.from({ length: Math.round(8 * mult) }, (_, i) => ({
        x: (i / 8) * W,
        y: H * (0.58 + Math.random() * 0.36),
        rx: 180 + Math.random() * 220,
        ry: 42 + Math.random() * 34,
        vx: (i % 2 === 0 ? 1 : -1) * (0.25 + Math.random() * 0.35),
        alpha: 0.05 + Math.random() * 0.06,
      }));
      const sparks = Array.from({ length: Math.round(18 * mult) }, () => ({
        x: Math.random() * W,
        y: H * (0.65 + Math.random() * 0.35),
        vx: (Math.random() - 0.5) * 0.45,
        vy: -(0.4 + Math.random() * 0.9),
        r: 1.2 + Math.random() * 1.8,
        alpha: 0.35 + Math.random() * 0.4,
      }));

      let lightningAlpha = 0;
      let nextStrikeAt = performance.now() + 2600 + Math.random() * 4800;

      const loopTemplar = (t: number) => {
        raf = requestAnimationFrame(loopTemplar);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        // Occasional distant storm lightning flash
        if (t > nextStrikeAt) {
          lightningAlpha = 0.24 + Math.random() * 0.16;
          nextStrikeAt = t + 3600 + Math.random() * 6200;
        }
        if (lightningAlpha > 0.004) {
          ctx.fillStyle = `rgba(186, 214, 255, ${lightningAlpha})`;
          ctx.fillRect(0, 0, W, H);
          lightningAlpha *= 0.86;
        }

        // Drifting abbey storm mist
        for (const m of mists) {
          m.x += m.vx;
          if (m.x - m.rx > W) m.x = -m.rx;
          if (m.x + m.rx < 0) m.x = W + m.rx;
          const mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.rx);
          mg.addColorStop(0, `rgba(148, 163, 184, ${m.alpha})`);
          mg.addColorStop(1, 'transparent');
          ctx.fillStyle = mg;
          ctx.beginPath();
          ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Heavy diagonal medieval rain
        ctx.lineCap = 'round';
        for (const d of stormDrops) {
          d.x += d.vx;
          d.y += d.vy;
          if (d.y > H + 30) {
            d.y = -30;
            d.x = Math.random() * (W + 180) - 40;
          }
          ctx.strokeStyle = `rgba(203, 213, 225, ${d.alpha})`;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.vx * 1.1, d.y - d.len);
          ctx.stroke();
        }

        // Distant forge/hearth embers rising against the rain
        for (const sp of sparks) {
          sp.x += sp.vx + Math.sin(t * 0.002 + sp.y * 0.02) * 0.35;
          sp.y += sp.vy;
          if (sp.y < H * 0.4) {
            sp.y = H + 8;
            sp.x = Math.random() * W;
          }
          ctx.globalAlpha = sp.alpha;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopTemplar);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // 15. The Witcher — Glowing Sign Runes, Wolf Embers & Chaos Ash
    if (fx === 'witcher_signs') {
      type SignKind = 'IGNI' | 'AARD' | 'QUEN' | 'YRDEN' | 'AXII';
      interface FloatingSign {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        rot: number;
        vrot: number;
        alpha: number;
        kind: SignKind;
        color: string;
        phase: number;
      }
      const signMeta: { kind: SignKind; color: string }[] = [
        { kind: 'IGNI', color: '#f97316' },
        { kind: 'AARD', color: '#38bdf8' },
        { kind: 'QUEN', color: '#fbbf24' },
        { kind: 'YRDEN', color: '#a855f7' },
        { kind: 'AXII', color: '#34d399' },
      ];
      const floatingSigns: FloatingSign[] = Array.from({ length: Math.round(14 * mult) }, (_, idx) => {
        const pick = signMeta[idx % signMeta.length];
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.28,
          vy: -(0.32 + Math.random() * 0.45),
          size: 16 + Math.random() * 14,
          rot: (Math.random() - 0.5) * 0.35,
          vrot: (Math.random() - 0.5) * 0.004,
          alpha: 0.22 + Math.random() * 0.28,
          kind: pick.kind,
          color: pick.color,
          phase: Math.random() * Math.PI * 2,
        };
      });
      const witcherEmbers = Array.from({ length: Math.round(42 * mult) }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.55,
        vy: -(0.5 + Math.random() * 1.15),
        r: 1.1 + Math.random() * 2.2,
        alpha: 0.38 + Math.random() * 0.45,
        color: i % 5 === 0 ? '#a855f7' : i % 4 === 0 ? '#38bdf8' : '#f59e0b',
        phase: Math.random() * Math.PI * 2,
      }));

      const drawSignGlyph = (s: FloatingSign, t: number) => {
        const pulse = 0.72 + Math.sin(t * 0.003 + s.phase) * 0.28;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = s.alpha * pulse;
        ctx.strokeStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const r = s.size;
        ctx.beginPath();
        if (s.kind === 'IGNI') {
          // Upward flame triangle + base bar
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.85, r * 0.6);
          ctx.lineTo(-r * 0.85, r * 0.6);
          ctx.closePath();
          ctx.moveTo(-r * 0.5, r * 0.92);
          ctx.lineTo(r * 0.5, r * 0.92);
        } else if (s.kind === 'AARD') {
          // Open upward force triangle + inner chevron
          ctx.moveTo(-r * 0.82, r * 0.5);
          ctx.lineTo(0, -r);
          ctx.lineTo(r * 0.82, r * 0.5);
          ctx.moveTo(-r * 0.48, r * 0.5);
          ctx.lineTo(0, -r * 0.35);
          ctx.lineTo(r * 0.48, r * 0.5);
          ctx.moveTo(-r * 0.55, r * 0.85);
          ctx.lineTo(r * 0.55, r * 0.85);
        } else if (s.kind === 'QUEN') {
          // Inverted shield triangle with horizontal ward bar
          ctx.moveTo(-r * 0.85, -r * 0.72);
          ctx.lineTo(r * 0.85, -r * 0.72);
          ctx.lineTo(0, r * 0.95);
          ctx.closePath();
          ctx.moveTo(-r * 0.52, -r * 0.15);
          ctx.lineTo(r * 0.52, -r * 0.15);
        } else if (s.kind === 'YRDEN') {
          // Hourglass / intersecting rune trap
          ctx.moveTo(-r * 0.75, -r * 0.85);
          ctx.lineTo(r * 0.75, -r * 0.85);
          ctx.lineTo(-r * 0.75, r * 0.85);
          ctx.lineTo(r * 0.75, r * 0.85);
          ctx.closePath();
          ctx.moveTo(0, -r * 0.95);
          ctx.lineTo(0, r * 0.95);
        } else {
          // AXII downward triangle
          ctx.moveTo(-r * 0.85, -r * 0.72);
          ctx.lineTo(r * 0.85, -r * 0.72);
          ctx.lineTo(0, r * 0.95);
          ctx.closePath();
        }
        ctx.stroke();
        ctx.restore();
      };

      const loopWitcher = (t: number) => {
        raf = requestAnimationFrame(loopWitcher);
        if (document.hidden) return;
        ctx.clearRect(0, 0, W, H);

        for (const s of floatingSigns) {
          s.x += s.vx + Math.sin(t * 0.0012 + s.phase) * 0.2;
          s.y += s.vy;
          s.rot += s.vrot;
          if (s.y < -s.size * 2) {
            s.y = H + s.size * 2;
            s.x = Math.random() * W;
          }
          drawSignGlyph(s, t);
        }

        for (const em of witcherEmbers) {
          em.x += em.vx + Math.sin(t * 0.002 + em.phase) * 0.4;
          em.y += em.vy;
          if (em.y < -12) {
            em.y = H + 12;
            em.x = Math.random() * W;
          }
          ctx.globalAlpha = em.alpha;
          const eg = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, em.r * 2.8);
          eg.addColorStop(0, '#fff');
          eg.addColorStop(0.45, em.color);
          eg.addColorStop(1, 'transparent');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.arc(em.x, em.y, em.r * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(loopWitcher);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    }

    // All other upgraded atmospheric weather engines
    const mkGeneric = (spawnEdge: boolean): GenericParticle => {
      if (fx === 'meadow') {
        const cols = [primary, secondary, '#f5d073', '#8cd465'];
        return {
          x: Math.random() * W,
          y: spawnEdge ? H + 12 : Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(0.35 + Math.random() * 1.05),
          r: 1.2 + Math.random() * 2.4,
          alpha: 0.38 + Math.random() * 0.4,
          color: cols[Math.floor(Math.random() * cols.length)],
          phase: Math.random() * 6.28,
          freq: 700 + Math.random() * 800,
        };
      }
      if (fx === 'dragon' || fx === 'ember') {
        const cols = fx === 'dragon' ? ['#ff3b0a', '#ff7b1c', '#ffc663', '#8c949e'] : ['#ffb347', '#ff6a1a'];
        return {
          x: Math.random() * W,
          y: spawnEdge ? H + 12 : Math.random() * H,
          vx: (Math.random() - 0.5) * 0.65,
          vy: -(0.55 + Math.random() * 1.75),
          r: 1 + Math.random() * 2.8,
          alpha: 0.45 + Math.random() * 0.45,
          color: cols[Math.floor(Math.random() * cols.length)],
          phase: Math.random() * 6.28,
          freq: 500 + Math.random() * 900,
        };
      }
      if (fx === 'snow') {
        return {
          x: Math.random() * W,
          y: spawnEdge ? -12 : Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4,
          vy: 0.6 + Math.random() * 1.5,
          r: 1.1 + Math.random() * 2.6,
          alpha: 0.4 + Math.random() * 0.45,
          color: '#f2f8ff',
          phase: Math.random() * 6.28,
          freq: 800 + Math.random() * 900,
        };
      }
      if (fx === 'code') {
        const chars = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ';
        return {
          x: Math.floor(Math.random() * (W / 16)) * 16,
          y: spawnEdge ? -18 : Math.random() * H,
          vx: 0,
          vy: 2.2 + Math.random() * 3.8,
          r: 13,
          alpha: 0.35 + Math.random() * 0.4,
          color: '#00ff41',
          phase: 0,
          freq: 1000,
          char: chars[Math.floor(Math.random() * chars.length)],
        };
      }
      if (fx === 'spark') {
        return {
          x: Math.random() * W,
          y: spawnEdge ? H + 10 : Math.random() * H,
          vx: 2.5 + Math.random() * 3.2,
          vy: -(4.5 + Math.random() * 5),
          r: 1.5 + Math.random() * 1.8,
          alpha: 0.65,
          color: Math.random() < 0.5 ? primary : secondary,
          phase: Math.random() * 6.28,
          freq: 400,
        };
      }
      if (fx === 'petal') {
        return {
          x: Math.random() * W,
          y: spawnEdge ? -15 : Math.random() * H,
          vx: 0.5 + Math.random() * 0.8,
          vy: 0.9 + Math.random() * 1.1,
          r: 4 + Math.random() * 5,
          alpha: 0.55 + Math.random() * 0.3,
          color: Math.random() < 0.6 ? '#ff9dd7' : '#ffd2ec',
          phase: Math.random() * 6.28,
          freq: 650 + Math.random() * 700,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.04,
        };
      }
      if (fx === 'rune') {
        const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᛁᛃᛇ';
        return {
          x: Math.random() * W,
          y: spawnEdge ? H + 20 : Math.random() * H,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -(0.3 + Math.random() * 0.6),
          r: 14 + Math.random() * 12,
          alpha: 0.28 + Math.random() * 0.24,
          color: '#e0b872',
          phase: Math.random() * 6.28,
          freq: 900,
          char: runes[Math.floor(Math.random() * runes.length)],
        };
      }
      // spore / gear / bubble / bats -> refined atmospheric floating orbs
      return {
        x: Math.random() * W,
        y: spawnEdge ? H + 12 : Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(0.25 + Math.random() * 0.8),
        r: 1.2 + Math.random() * 2.5,
        alpha: 0.35 + Math.random() * 0.35,
        color: fx === 'spore' ? '#43f5a5' : fx === 'bubble' ? '#9fe3ff' : primary,
        phase: Math.random() * 6.28,
        freq: 850 + Math.random() * 800,
      };
    };

    const baseCount = fx === 'snow' ? 75 : fx === 'code' ? 52 : 42;
    const pts = Array.from({ length: Math.round(baseCount * mult) }, () => mkGeneric(false));

    const loopGeneric = (t: number) => {
      raf = requestAnimationFrame(loopGeneric);
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx + Math.sin(t / p.freq + p.phase) * 0.45;
        p.y += p.vy;
        if (p.y > H + 30 || p.y < -40 || p.x > W + 40 || p.x < -40) {
          pts[i] = mkGeneric(true);
          continue;
        }
        ctx.globalAlpha = p.alpha;
        if (p.char) {
          ctx.font = `${p.r}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = p.color;
          ctx.fillText(p.char, p.x, p.y);
        } else if (fx === 'petal') {
          p.rot = (p.rot || 0) + (p.vrot || 0);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.52, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (fx === 'spark') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
          ctx.stroke();
        } else {
          // soft radial glowing orb
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
          g.addColorStop(0, p.color);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    raf = requestAnimationFrame(loopGeneric);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [theme.fx, theme.accent, theme.secondaryAccent, fxLevel, wetGlass]);

  const activeBackdrop =
    backdropOverride || (isPortrait ? theme.backdropPortrait : theme.backdropLandscape);
  const isCinematicPoster =
    !backdropOverride &&
    (theme.layoutMode === 'batman2022' ||
      theme.layoutMode === 'sleepyhollow' ||
      theme.layoutMode === 'greenknight_crown' ||
      theme.layoutMode === 'greenknight_wood' ||
      theme.layoutMode === 'castlevania' ||
      theme.layoutMode === 'dune' ||
      theme.layoutMode === 'akira1988' ||
      theme.layoutMode === 'readyplayerone' ||
      theme.layoutMode === 'ghostintheshell' ||
      theme.layoutMode === 'thundercats' ||
      theme.layoutMode === 'xmen90s' ||
      theme.layoutMode === 'matrixgreen' ||
      theme.layoutMode === 'piratesabyss' ||
      theme.layoutMode === 'steampunk_engine' ||
      theme.layoutMode === 'alienfarm' ||
      theme.layoutMode === 'dndtable' ||
      theme.layoutMode === 'templar_rain' ||
      theme.layoutMode === 'witcher_signs');

  const posterVignette =
    theme.layoutMode === 'batman2022'
      ? 'radial-gradient(ellipse 48% 88% at 50% 50%, transparent 44%, #030506 82%)'
      : theme.layoutMode === 'sleepyhollow'
        ? 'radial-gradient(ellipse 46% 90% at 50% 50%, transparent 42%, #040405 80%)'
        : theme.layoutMode === 'greenknight_crown'
          ? 'radial-gradient(ellipse 46% 90% at 50% 50%, transparent 42%, #100403 82%)'
          : theme.layoutMode === 'greenknight_wood'
            ? 'radial-gradient(ellipse 48% 90% at 50% 50%, transparent 42%, #080e07 82%)'
            : theme.layoutMode === 'dune'
              ? 'radial-gradient(ellipse 48% 90% at 50% 50%, transparent 42%, #1c1206 84%)'
              : theme.layoutMode === 'akira1988'
                ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 44%, #0c0506 84%)'
                : theme.layoutMode === 'readyplayerone'
                  ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 42%, #04091b 84%)'
                  : theme.layoutMode === 'ghostintheshell'
                    ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 44%, #040d16 84%)'
                    : theme.layoutMode === 'thundercats'
                      ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 44%, #090b16 84%)'
                      : theme.layoutMode === 'xmen90s'
                        ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 44%, #101628 84%)'
                        : theme.layoutMode === 'matrixgreen'
                          ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 44%, #010a02 84%)'
                          : theme.layoutMode === 'piratesabyss'
                            ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 42%, #02080d 84%)'
                            : theme.layoutMode === 'steampunk_engine'
                              ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 42%, #140c06 84%)'
                              : theme.layoutMode === 'alienfarm'
                                ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 42%, #030d05 84%)'
                                : theme.layoutMode === 'dndtable'
                                  ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 42%, #140c08 84%)'
                                  : theme.layoutMode === 'templar_rain'
                                    ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 42%, #080b10 84%)'
                                    : theme.layoutMode === 'witcher_signs'
                                      ? 'radial-gradient(ellipse 50% 90% at 50% 50%, transparent 42%, #09090c 84%)'
                                      : 'radial-gradient(ellipse 48% 90% at 50% 50%, transparent 42%, #060102 82%)';

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {/* Base solid studio tone */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ backgroundColor: theme.bg }}
      />

      {/* 4K AI Architectural & Poster Scene */}
      {sceneOn && activeBackdrop && !wallUrl && (
        <div
          className="absolute -inset-6 transition-opacity duration-700 flex items-center justify-center"
          style={{
            transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.03)`,
          }}
        >
          <img
            src={activeBackdrop}
            alt=""
            className={
              isCinematicPoster
                ? isPortrait
                  ? 'h-full w-full object-cover object-top opacity-78 contrast-[1.08]'
                  : 'h-full w-auto max-w-full object-contain object-center opacity-84 contrast-[1.08]'
                : 'h-full w-full object-cover object-center opacity-85 contrast-[1.07] saturate-[1.08]'
            }
          />
          {isCinematicPoster && !isPortrait && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: posterVignette }}
            />
          )}
        </div>
      )}

      {/* Custom User Wallpaper (Image / GIF / Video) */}
      {wallUrl && (
        <div className="absolute inset-0">
          {wallIsVideo ? (
            <video
              src={wallUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover opacity-90"
            />
          ) : (
            <img
              src={wallUrl}
              alt=""
              className="h-full w-full object-cover object-center opacity-90"
            />
          )}
        </div>
      )}

      {/* Atmospheric Depth Haze & Horizon Glow for Legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: theme.light
            ? 'linear-gradient(180deg, rgba(245,245,248,0.65) 0%, rgba(245,245,248,0.45) 45%, rgba(245,245,248,0.78) 100%)'
            : theme.layoutMode === 'batman2022'
              ? 'radial-gradient(ellipse 70% 45% at 22% 100%, rgba(227,27,35,0.22) 0%, transparent 65%), radial-gradient(ellipse 65% 40% at 85% 20%, rgba(0,230,138,0.12) 0%, transparent 65%), linear-gradient(180deg, rgba(3,5,6,0.58) 0%, rgba(3,5,6,0.28) 42%, rgba(3,5,6,0.78) 100%)'
              : theme.layoutMode === 'sleepyhollow'
                ? 'radial-gradient(ellipse 75% 42% at 50% 96%, rgba(200,16,28,0.16) 0%, transparent 65%), linear-gradient(180deg, rgba(4,4,5,0.6) 0%, rgba(4,4,5,0.24) 40%, rgba(4,4,5,0.8) 100%)'
                : theme.layoutMode === 'greenknight_crown'
                  ? 'radial-gradient(ellipse 75% 45% at 50% 100%, rgba(217,27,12,0.24) 0%, transparent 65%), linear-gradient(180deg, rgba(16,4,3,0.58) 0%, rgba(16,4,3,0.24) 42%, rgba(16,4,3,0.8) 100%)'
                  : theme.layoutMode === 'greenknight_wood'
                    ? 'radial-gradient(ellipse 75% 45% at 50% 100%, rgba(76,166,56,0.2) 0%, transparent 65%), linear-gradient(180deg, rgba(8,14,7,0.56) 0%, rgba(8,14,7,0.22) 42%, rgba(8,14,7,0.8) 100%)'
                    : theme.layoutMode === 'castlevania'
                      ? 'radial-gradient(ellipse 70% 48% at 50% 18%, rgba(217,11,28,0.22) 0%, transparent 65%), linear-gradient(180deg, rgba(6,1,2,0.54) 0%, rgba(6,1,2,0.24) 44%, rgba(6,1,2,0.82) 100%)'
                      : theme.layoutMode === 'dune'
                        ? 'radial-gradient(ellipse 75% 45% at 62% 18%, rgba(245,176,56,0.24) 0%, transparent 65%), linear-gradient(180deg, rgba(28,18,6,0.48) 0%, rgba(28,18,6,0.2) 42%, rgba(28,18,6,0.82) 100%)'
                        : theme.layoutMode === 'akira1988'
                          ? 'radial-gradient(ellipse 75% 45% at 50% 100%, rgba(230,28,36,0.22) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 80% 15%, rgba(43,140,255,0.12) 0%, transparent 65%), linear-gradient(180deg, rgba(12,5,6,0.52) 0%, rgba(12,5,6,0.22) 42%, rgba(12,5,6,0.84) 100%)'
                          : theme.layoutMode === 'readyplayerone'
                            ? 'radial-gradient(ellipse 75% 45% at 50% 95%, rgba(56,224,255,0.22) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 25% 15%, rgba(217,70,239,0.16) 0%, transparent 65%), linear-gradient(180deg, rgba(4,9,27,0.5) 0%, rgba(4,9,27,0.2) 42%, rgba(4,9,27,0.84) 100%)'
                            : theme.layoutMode === 'ghostintheshell'
                              ? 'radial-gradient(ellipse 75% 45% at 50% 95%, rgba(45,240,210,0.22) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 25% 15%, rgba(255,59,82,0.14) 0%, transparent 65%), linear-gradient(180deg, rgba(4,13,22,0.5) 0%, rgba(4,13,22,0.2) 42%, rgba(4,13,22,0.84) 100%)'
                              : theme.layoutMode === 'thundercats'
                                ? 'radial-gradient(ellipse 75% 45% at 50% 95%, rgba(225,29,36,0.24) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 50% 15%, rgba(251,191,36,0.18) 0%, transparent 65%), linear-gradient(180deg, rgba(9,11,22,0.52) 0%, rgba(9,11,22,0.22) 42%, rgba(9,11,22,0.84) 100%)'
                                : theme.layoutMode === 'xmen90s'
                                  ? 'radial-gradient(ellipse 75% 45% at 50% 95%, rgba(250,204,21,0.2) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 25% 15%, rgba(37,99,235,0.2) 0%, transparent 65%), linear-gradient(180deg, rgba(16,22,40,0.5) 0%, rgba(16,22,40,0.22) 42%, rgba(16,22,40,0.84) 100%)'
                                  : theme.layoutMode === 'matrixgreen'
                                    ? 'radial-gradient(ellipse 75% 48% at 50% 95%, rgba(0,255,65,0.2) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 50% 15%, rgba(0,255,65,0.14) 0%, transparent 65%), linear-gradient(180deg, rgba(1,10,2,0.54) 0%, rgba(1,10,2,0.24) 42%, rgba(1,10,2,0.86) 100%)'
                                    : theme.layoutMode === 'piratesabyss'
                                      ? 'radial-gradient(ellipse 75% 45% at 50% 95%, rgba(20,184,166,0.22) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 50% 15%, rgba(245,158,11,0.12) 0%, transparent 65%), linear-gradient(180deg, rgba(2,8,13,0.54) 0%, rgba(2,8,13,0.24) 42%, rgba(2,8,13,0.86) 100%)'
                                      : theme.layoutMode === 'steampunk_engine'
                                        ? 'radial-gradient(ellipse 75% 45% at 50% 95%, rgba(217,119,6,0.24) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 50% 15%, rgba(245,158,11,0.16) 0%, transparent 65%), linear-gradient(180deg, rgba(20,12,6,0.52) 0%, rgba(20,12,6,0.24) 42%, rgba(20,12,6,0.84) 100%)'
                                        : theme.layoutMode === 'alienfarm'
                                          ? 'radial-gradient(ellipse 75% 48% at 50% 92%, rgba(57,255,20,0.22) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 50% 15%, rgba(56,189,248,0.14) 0%, transparent 65%), linear-gradient(180deg, rgba(3,13,5,0.5) 0%, rgba(3,13,5,0.22) 42%, rgba(3,13,5,0.86) 100%)'
                                          : theme.layoutMode === 'dndtable'
                                            ? 'radial-gradient(ellipse 75% 45% at 50% 95%, rgba(220,38,38,0.24) 0%, transparent 65%), radial-gradient(ellipse 55% 35% at 50% 15%, rgba(251,191,36,0.18) 0%, transparent 65%), linear-gradient(180deg, rgba(20,12,8,0.52) 0%, rgba(20,12,8,0.24) 42%, rgba(20,12,8,0.86) 100%)'
                                            : theme.layoutMode === 'templar_rain'
                                              ? 'radial-gradient(ellipse 75% 45% at 50% 95%, rgba(185,28,28,0.22) 0%, transparent 65%), radial-gradient(ellipse 65% 38% at 50% 15%, rgba(148,163,184,0.14) 0%, transparent 65%), linear-gradient(180deg, rgba(8,11,16,0.56) 0%, rgba(8,11,16,0.24) 42%, rgba(8,11,16,0.88) 100%)'
                                              : theme.layoutMode === 'witcher_signs'
                                                ? 'radial-gradient(ellipse 75% 45% at 50% 95%, rgba(245,158,11,0.2) 0%, transparent 65%), radial-gradient(ellipse 60% 38% at 50% 15%, rgba(168,85,247,0.16) 0%, transparent 65%), linear-gradient(180deg, rgba(9,9,12,0.54) 0%, rgba(9,9,12,0.24) 42%, rgba(9,9,12,0.88) 100%)'
                                                : `radial-gradient(ellipse 90% 42% at 50% 105%, ${theme.accent}26 0%, transparent 65%), linear-gradient(180deg, rgba(4,7,11,0.52) 0%, rgba(4,7,11,0.22) 38%, rgba(4,7,11,0.68) 100%)`,
        }}
      />

      {/* Volumetric Hologram Projections & Searchlights */}
      <canvas ref={holoCanvasRef} className="holo-beam absolute inset-0 h-full w-full" />

      {/* Hyper-Realistic Walking Crowd & Wet-Asphalt Reflections */}
      <canvas ref={crowdCanvasRef} className="absolute inset-0 h-full w-full" />

      {/* Hyper-Realistic Rain & Wet Glass Droplets Canvas */}
      <canvas ref={fxCanvasRef} className="absolute inset-0 h-full w-full" />

      {/* Fine Optical Film Grain Texture */}
      <div className="film-grain absolute inset-0 opacity-60" />
    </div>
  );
};
