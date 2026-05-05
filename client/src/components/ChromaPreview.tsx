import { useEffect, useRef } from "react";

function hexToRgb01(hex: string): [number, number, number] {
  const raw = hex.replace("#", "").trim();
  const h =
    raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return [0, 1, 0];
  }
  const n = parseInt(h, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return [r, g, b];
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export type ChromaPreviewProps = {
  video: HTMLVideoElement | null;
  keyHex: string;
  similarity: number;
  blend: number;
  mirror?: boolean;
};

/**
 * Превью только через Canvas 2D + rAF: совместимо с blob:// и не зависит от WebGL-текстур.
 */
export function ChromaPreview({
  video,
  keyHex,
  similarity,
  blend,
  mirror = false,
}: ChromaPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  const paramsRef = useRef({ keyHex, similarity, blend, mirror });
  paramsRef.current = { keyHex, similarity, blend, mirror };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || !video) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const layout = { cw: 2, ch: 2 };

    const updateLayout = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return false;

      const cr = wrap.getBoundingClientRect();
      if (cr.width < 8 || cr.height < 8) return false;

      const bw = Math.max(64, cr.width - 8);
      const bh = Math.max(64, cr.height - 8);

      const maxPreviewSide = 768;
      const scaleFit = Math.min(bw / vw, bh / vh);
      const scaleCap = maxPreviewSide / Math.max(vw, vh);
      const scale = Math.min(1, scaleFit, scaleCap);

      layout.cw = Math.max(2, Math.floor(vw * scale));
      layout.ch = Math.max(2, Math.floor(vh * scale));

      canvas.style.width = `${layout.cw}px`;
      canvas.style.height = `${layout.ch}px`;
      return true;
    };

    let stopped = false;

    const tick = () => {
      if (stopped) return;

      updateLayout();

      const { keyHex: kh, similarity: sim, blend: bl, mirror: mir } =
        paramsRef.current;
      paintChroma(canvas, ctx, video, kh, sim, bl, layout, mir);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [video]);

  return (
    <div ref={wrapRef} className="chroma-wrap">
      <canvas ref={canvasRef} className="chroma-canvas" />
    </div>
  );
}

function paintChroma(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  keyHex: string,
  similarity: number,
  blend: number,
  layout: { cw: number; ch: number },
  mirror: boolean,
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;

  let { cw, ch } = layout;
  cw = Math.max(2, cw);
  ch = Math.max(2, ch);

  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  try {
    ctx.save();
    if (mirror) {
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, cw, ch);
    ctx.restore();
  } catch {
    return;
  }

  let img: ImageData;
  try {
    img = ctx.getImageData(0, 0, cw, ch);
  } catch {
    return;
  }

  const px = img.data;
  const [kr, kg, kb] = hexToRgb01(keyHex);
  const low = similarity;
  const high = similarity + Math.max(blend, 0.001);

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]! / 255;
    const g = px[i + 1]! / 255;
    const b = px[i + 2]! / 255;
    const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);
    const a = smoothstep(low, high, dist);
    px[i + 3] = Math.round(a * 255);
  }

  ctx.putImageData(img, 0, 0);
}
