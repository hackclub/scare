"use client";

import { useCallback, useEffect, useRef } from "react";

/* ------------------------------------------------------------------------ */
/* Faces                                                                     */
/* ------------------------------------------------------------------------ */

type Vec2 = [number, number];
type Shape2D = (x: number, y: number) => number; // signed distance, <0 inside

interface Face {
  no: number;
  sd: Shape2D;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// iq's exact triangle distance
function sdTri(px: number, py: number, a: Vec2, b: Vec2, c: Vec2) {
  const e0x = b[0] - a[0], e0y = b[1] - a[1];
  const e1x = c[0] - b[0], e1y = c[1] - b[1];
  const e2x = a[0] - c[0], e2y = a[1] - c[1];
  const v0x = px - a[0], v0y = py - a[1];
  const v1x = px - b[0], v1y = py - b[1];
  const v2x = px - c[0], v2y = py - c[1];
  const cl = (v: number) => Math.max(0, Math.min(1, v));
  const h0 = cl((v0x * e0x + v0y * e0y) / (e0x * e0x + e0y * e0y));
  const h1 = cl((v1x * e1x + v1y * e1y) / (e1x * e1x + e1y * e1y));
  const h2 = cl((v2x * e2x + v2y * e2y) / (e2x * e2x + e2y * e2y));
  const q0x = v0x - e0x * h0, q0y = v0y - e0y * h0;
  const q1x = v1x - e1x * h1, q1y = v1y - e1y * h1;
  const q2x = v2x - e2x * h2, q2y = v2y - e2y * h2;
  const s = Math.sign(e0x * e2y - e0y * e2x);
  const d0 = [q0x * q0x + q0y * q0y, s * (v0x * e0y - v0y * e0x)];
  const d1 = [q1x * q1x + q1y * q1y, s * (v1x * e1y - v1y * e1x)];
  const d2 = [q2x * q2x + q2y * q2y, s * (v2x * e2y - v2y * e2x)];
  const dd = Math.min(d0[0]!, d1[0]!, d2[0]!);
  const ss = Math.min(d0[1]!, d1[1]!, d2[1]!);
  return -Math.sqrt(dd) * Math.sign(ss);
}

function carve(no: number): Face {
  const r = rng(no * 7919 + 13);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]!;

  const ex = 0.3 + r() * 0.08;
  const ey = 0.2 + r() * 0.08;
  const es = 0.16 + r() * 0.06;
  const eyeKind = pick(["tri", "angry", "round", "crescent", "slit"]);
  const eye = (side: 1 | -1): Shape2D => {
    const cx = ex * side;
    switch (eyeKind) {
      case "angry":
        return (x, y) =>
          sdTri(x, y,
            [cx - es * side, ey + es * 0.9],
            [cx + es * 1.05 * side, ey - es * 0.15],
            [cx - es * 0.6 * side, ey - es * 0.75]);
      case "round":
        return (x, y) => Math.hypot(x - cx, y - ey) - es * 0.78;
      case "crescent":
        return (x, y) =>
          Math.max(
            Math.hypot(x - cx, y - ey) - es * 0.85,
            -(Math.hypot(x - cx, y - ey + es * 0.55) - es * 0.8),
          );
      case "slit":
        return (x, y) =>
          Math.max(Math.abs(y - ey + (x - cx) * 0.35 * side) - es * 0.22, Math.abs(x - cx) - es);
      default:
        return (x, y) =>
          sdTri(x, y, [cx - es, ey - es * 0.7], [cx + es, ey - es * 0.7], [cx, ey + es]);
    }
  };
  const le = eye(-1);
  const re = eye(1);

  const noseKind = pick(["tri", "tri", "none", "inv", "dot"]);
  const ns = 0.07 + r() * 0.04;
  const nose: Shape2D =
    noseKind === "none"
      ? () => 9
      : noseKind === "dot"
        ? (x, y) => Math.hypot(x, y + 0.02) - ns * 0.6
        : noseKind === "inv"
          ? (x, y) => sdTri(x, y, [-ns, 0.03], [ns, 0.03], [0, -ns * 1.2])
          : (x, y) => sdTri(x, y, [-ns, -0.08], [ns, -0.08], [0, ns * 0.9]);

  const mouthKind = pick(["grin", "teeth", "teeth", "zigzag", "o"]);
  const mw = 0.48 + r() * 0.12;
  const my = -0.3 - r() * 0.06;
  const mh = 0.12 + r() * 0.06;
  const toothW = 0.13 + r() * 0.05;
  const mouth: Shape2D = (x, y) => {
    if (mouthKind === "o") return Math.hypot((x) * 0.9, y - my) - mh * 1.1;
    const u = x / mw;
    const curve = 1 - u * u;
    const bottom = my - 0.12 * curve;
    let top = bottom + mh * Math.sqrt(Math.max(0, curve)) + 0.02;
    let bot = bottom;
    if (mouthKind === "teeth") {
      const k = Math.floor((x + mw) / toothW);
      if (k % 2 === 1) top -= mh * 0.45;
      else if (Math.abs(u) < 0.7) bot += mh * 0.35;
    } else if (mouthKind === "zigzag") {
      const f = ((x + mw) / toothW) % 1;
      top -= Math.abs(f - 0.5) * mh * 0.9;
    }
    return Math.max(y - top, bot - y, Math.abs(x) - mw);
  };

  const tilt = (r() - 0.5) * 0.12;
  return {
    no,
    sd: (x, y) => {
      const c = Math.cos(tilt), s = Math.sin(tilt);
      const X = x * c - y * s, Y = x * s + y * c;
      return Math.min(le(X, Y), re(X, Y), nose(X, Y), mouth(X, Y));
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Geometry                                                                  */
/* ------------------------------------------------------------------------ */

const SQUASH = 0.8;

function sdBody(x: number, y: number, z: number) {
  const sy = y / SQUASH;
  const rxz = Math.hypot(x, z);
  const r3 = Math.hypot(rxz, sy);
  const ribMask = rxz / (r3 + 1e-6);
  const rib = Math.abs(Math.cos(Math.atan2(z, x) * 5));
  const R = 1 - 0.075 * (1 - Math.sqrt(rib)) * ribMask;
  const dimple = 0.22 * Math.exp(-rxz * rxz * 16) * (sy > 0 ? 1 : 0.5);
  return (r3 - R + dimple) * 0.72;
}

function sdStem(x: number, y: number, z: number) {
  const h = y - 0.62;
  const bend = h * h * 0.9;
  const radius = 0.085 - h * 0.05;
  const d = Math.hypot(x - bend, z) - radius;
  return Math.max(d, 0.62 - y, y - 1.02);
}

function sdScene(x: number, y: number, z: number) {
  return Math.min(sdBody(x, y, z), sdStem(x, y, z));
}

/* ------------------------------------------------------------------------ */
/* Rendering                                                                 */
/* ------------------------------------------------------------------------ */

const RAMP = " .'`:-=+*%#@";
const EXTRA = "|/\\";
const CHARS = RAMP + EXTRA;
const TONES = 8;

function toneColor(t: number) {
  // single ink: ember -> pumpkin -> candle core
  const stops: [number, number, number][] = [
    [74, 32, 10],
    [150, 70, 20],
    [255, 138, 31],
    [255, 222, 168],
  ];
  const f = (t / (TONES - 1)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(f));
  const k = f - i;
  const a = stops[i]!, b = stops[i + 1]!;
  return `rgb(${a.map((v, j) => Math.round(v + (b[j]! - v) * k)).join(",")})`;
}

interface Props {
  className?: string;
  /** Approximate number of glyph rows across the canvas height. */
  density?: number;
  label?: boolean;
}

export function Lantern({ className = "", density = 74, label = true }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const carveNoRef = useRef<HTMLSpanElement>(null);
  const recarveRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, dpr = 1, cellW = 7, cellH = 12, cols = 0, rows = 0;
    let atlas: HTMLCanvasElement | null = null;
    let raf = 0;
    let visible = true;
    let last = 0;
    const start = performance.now();

    let face = carve(Math.floor(Math.random() * 9000) + 1000);
    let prevFace: Face | null = null;
    let carveStart = -1;

    const pointer = { x: 0.5, y: 0.45, moved: -1e9 };
    const rot = { yaw: 0, pitch: 0, vy: 0, vp: 0 };
    let gust = 0;

    const setCarveNo = () => {
      if (carveNoRef.current) carveNoRef.current.textContent = String(face.no).padStart(4, "0");
    };
    setCarveNo();

    const buildAtlas = () => {
      const family = getComputedStyle(canvas).fontFamily || "monospace";
      const a = document.createElement("canvas");
      a.width = Math.ceil(cellW * dpr) * CHARS.length;
      a.height = Math.ceil(cellH * dpr) * TONES;
      const g = a.getContext("2d")!;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `${Math.round(cellH * 0.92 * dpr)}px ${family}`;
      const cw = Math.ceil(cellW * dpr), ch = Math.ceil(cellH * dpr);
      for (let t = 0; t < TONES; t++) {
        g.fillStyle = toneColor(t);
        g.shadowColor = t >= 6 ? "rgba(255,138,31,0.9)" : "transparent";
        g.shadowBlur = t >= 6 ? 7 * dpr : 0;
        for (let i = 0; i < CHARS.length; i++) {
          g.fillText(CHARS[i]!, i * cw + cw / 2, t * ch + ch / 2 + dpr * 0.5);
        }
      }
      atlas = a;
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cellH = Math.max(8, Math.min(16, H / density));
      cellW = cellH * 0.62;
      cols = Math.floor(W / cellW);
      rows = Math.floor(H / cellH);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      buildAtlas();
    };

    const draw = (now: number) => {
      if (!atlas) return;
      const t = (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;

      // Spring toward the pointer: the lantern has weight and overshoots a little.
      const idle = now - pointer.moved > 3500;
      const tyaw = reduce ? 0.18 : idle ? Math.sin(t * 0.35) * 0.4 : (pointer.x - 0.5) * 1.5;
      const tpitch = reduce ? 0.05 : idle ? Math.sin(t * 0.23) * 0.1 : (pointer.y - 0.5) * 0.7;
      if (reduce) {
        rot.yaw = tyaw;
        rot.pitch = tpitch;
      } else {
        const k = 26, damp = Math.exp(-7 * dt);
        rot.vy = (rot.vy + (Math.max(-0.75, Math.min(0.75, tyaw)) - rot.yaw) * k * dt) * damp;
        rot.vp = (rot.vp + (Math.max(-0.35, Math.min(0.35, tpitch)) - rot.pitch) * k * dt) * damp;
        rot.yaw += rot.vy * dt * 3.5;
        rot.pitch += rot.vp * dt * 3.5;
      }

      // Candle: layered sines plus the occasional gust that nearly puts it out.
      if (!reduce && gust <= 0 && Math.random() < dt * 0.12) gust = 0.35;
      gust = Math.max(0, gust - dt);
      const gustDip = gust > 0 ? Math.sin((gust / 0.35) * Math.PI) * 0.45 : 0;
      const flame = reduce
        ? 0.9
        : 0.84 + Math.sin(t * 9.3) * 0.06 + Math.sin(t * 23.1 + 1.7) * 0.04 + (Math.random() - 0.5) * 0.05 - gustDip;

      // Ignition: density climbs from nothing when the lantern first lights.
      const ignite = reduce ? 1 : 1 - Math.pow(1 - Math.min(1, t / 1.6), 3);

      // Knife sweep for a recarve.
      const sweep = carveStart < 0 ? 2 : (now - carveStart) / 520;
      if (sweep >= 1 && prevFace) prevFace = null;

      const cy_ = Math.cos(-rot.yaw), sy_ = Math.sin(-rot.yaw);
      const cp_ = Math.cos(-rot.pitch), sp_ = Math.sin(-rot.pitch);

      const unit = Math.min(W / 2.5, H / 2.35);
      const cx = W / 2;
      const cyc = H * 0.53;
      const cw = Math.ceil(cellW * dpr), chh = Math.ceil(cellH * dpr);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const put = (col: number, row: number, ci: number, tone: number, alpha = 1) => {
        if (ci <= 0) return;
        ctx.globalAlpha = alpha;
        ctx.drawImage(atlas!, ci * cw, tone * chh, cw, chh, Math.round(col * cellW * dpr), Math.round(row * cellH * dpr), cw, chh);
      };

      let glowSum = 0, glowN = 0;

      for (let row = 0; row < rows; row++) {
        const py = (row + 0.5) * cellH;
        const wy = -(py - cyc) / unit;
        for (let col = 0; col < cols; col++) {
          const px = (col + 0.5) * cellW;
          const wx = (px - cx) / unit;

          const inBounds = Math.abs(wx) < 1.3 && wy < 1.25 && wy > -0.95;
          const ground = () => {
            // The pool of light the mouth throws on the floor, then a faint dot field.
            const gy = (wy + 0.84) / 0.16, gx = wx / 1.12;
            const pool = 1 - (gx * gx + gy * gy);
            if (wy < -0.7 && pool > 0) {
              const v = pool * flame * ignite;
              put(col, row, Math.max(1, Math.min(6, Math.round(v * 7))), Math.min(3, Math.round(v * 3.5)), 0.85);
            } else if (col % 3 === 0 && row % 2 === 0) {
              put(col, row, 1, 0, 0.35 * ignite);
            }
          };
          if (!inBounds) {
            ground();
            continue;
          }

          // March an orthographic ray from the viewer into the scene.
          let tz = 0;
          let hit = false;
          let ox = 0, oy = 0, oz = 0;
          for (let i = 0; i < 40; i++) {
            const wz = 1.6 - tz;
            // world -> object: Rx(-pitch) then Ry(-yaw)
            const y1 = wy * cp_ - wz * sp_;
            const z1 = wy * sp_ + wz * cp_;
            ox = wx * cy_ + z1 * sy_;
            oz = -wx * sy_ + z1 * cy_;
            oy = y1;
            const d = sdScene(ox, oy, oz);
            if (d < 0.003) { hit = true; break; }
            tz += d;
            if (tz > 3.2) break;
          }

          if (!hit) {
            ground();
            continue;
          }

          const isStem = sdStem(ox, oy, oz) < sdBody(ox, oy, oz) + 0.001;

          // Tetrahedral normal
          const e = 0.004;
          const n1 = sdScene(ox + e, oy - e, oz - e);
          const n2 = sdScene(ox - e, oy - e, oz + e);
          const n3 = sdScene(ox - e, oy + e, oz - e);
          const n4 = sdScene(ox + e, oy + e, oz + e);
          let nx = n1 - n2 - n3 + n4, ny = -n1 - n2 + n3 + n4, nz = -n1 + n2 - n3 + n4;
          const nl = Math.hypot(nx, ny, nz) || 1;
          nx /= nl; ny /= nl; nz /= nl;
          // Moonlight from upper left, in object space it's fine to approximate in world
          const lam = Math.max(0, nx * -0.45 + ny * 0.62 + nz * 0.64);
          const rim = Math.pow(1 - Math.max(0, nz), 3) * 0.25;

          let lum: number;
          let tone: number;
          let ci: number;

          const f = prevFace && px / W > sweep ? prevFace : face;
          const knife = prevFace && Math.abs(px / W - sweep) < 0.012;
          const sd = !isStem && oz > 0.05 ? f.sd(ox, oy) : 9;

          if (knife) {
            ci = RAMP.length + (row % 2 ? 1 : 2);
            tone = 7;
          } else if (sd < 0) {
            // Through the hole: the lit inside of the shell.
            const depth = Math.min(1, -sd * 9);
            lum = flame * (0.82 + depth * 0.18);
            glowSum += lum; glowN++;
            ci = RAMP.length - 1 - (lum < 0.7 ? 1 : 0);
            tone = lum > 0.66 ? 7 : 6;
          } else if (sd < 0.04) {
            // The carved edge, lit from inside.
            lum = flame * (0.9 - sd * 10);
            ci = Math.max(6, Math.round(lum * (RAMP.length - 2)));
            tone = 4 + Math.round(lum);
          } else if (isStem) {
            lum = 0.18 + lam * 0.45;
            ci = RAMP.length + 0; // |
            tone = lum > 0.4 ? 2 : 1;
          } else {
            const groove = 0.55 + 0.45 * Math.sqrt(Math.abs(Math.cos(Math.atan2(oz, ox) * 5)));
            const spill = sd < 0.3 ? (0.3 - sd) * 0.9 * flame : 0;
            lum = Math.min(1, (0.08 + lam * 0.55 + rim) * groove + spill);
            ci = Math.max(1, Math.round(lum * (RAMP.length - 3)));
            tone = Math.min(3, Math.round(lum * 3.6 + spill * 2));
          }

          // Ignition hides the sparse end of the ramp first.
          if (ignite < 1 && Math.random() > ignite) continue;
          put(col, row, ci, tone);
        }
      }

      ctx.globalAlpha = 1;
      if (readoutRef.current && Math.floor(t * 6) !== Math.floor((t - dt) * 6)) {
        const pct = Math.min(100, glowN ? Math.round((glowSum / glowN) * 100) : 0);
        const filled = Math.round(pct / 10);
        readoutRef.current.textContent = "#".repeat(filled) + ".".repeat(10 - filled);
        if (pctRef.current) pctRef.current.textContent = String(pct).padStart(3, "0");
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - last >= 1000 / 30 || last === 0) draw(now);
      if (!reduce || prevFace) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    recarveRef.current = () => {
      prevFace = reduce ? null : face;
      face = carve(Math.floor(Math.random() * 9000) + 1000);
      carveStart = performance.now();
      setCarveNo();
      kick();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = wrap.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / Math.max(1, rect.width);
      pointer.y = (e.clientY - rect.top) / Math.max(1, rect.height);
      pointer.x = 0.5 + (pointer.x - 0.5) * 0.5;
      pointer.y = 0.5 + (pointer.y - 0.5) * 0.5;
      pointer.moved = performance.now();
    };

    const ro = new ResizeObserver(() => {
      resize();
      last = 0;
      kick();
    });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) kick();
    });
    const onVis = () => kick();

    void document.fonts.ready.then(() => {
      resize();
      ro.observe(wrap);
      io.observe(wrap);
      kick();
    });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density]);

  const recarve = useCallback(() => recarveRef.current(), []);

  return (
    <div ref={wrapRef} className={`lantern ${className}`}>
      <canvas
        ref={canvasRef}
        className="lantern-canvas"
        role="img"
        aria-label="A jack-o'-lantern drawn in typewriter characters. It turns to watch your cursor."
        onClick={recarve}
      />
      {label && (
        <div className="lantern-hud">
          <span>
            Carving no. <span ref={carveNoRef}>0000</span>
          </span>
          <span className="lantern-candle">
            Candle{" "}
            <span className="lantern-meter" aria-hidden="true">
              [<span ref={readoutRef}>..........</span>]
            </span>{" "}
            <span ref={pctRef}>000</span>%
          </span>
          <button type="button" className="lantern-recarve" onClick={recarve}>
            [ Recarve ]
          </button>
        </div>
      )}
    </div>
  );
}
