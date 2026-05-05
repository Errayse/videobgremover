import { spawn } from "node:child_process";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";

/**
 * @param {{
 *   inputPath: string;
 *   outputPath: string;
 *   keyHex: string;
 *   similarity: number;
 *   blend: number;
 *   crf: number;
 *   format: "webm-alpha" | "mov-prores4444";
 *   mirror?: boolean;
 *   trimStart?: number;
 *   trimEnd?: number;
 * }} opts
 */
export function runChromaExport(opts) {
  const ffmpegPath = ffmpegStatic;
  if (!ffmpegPath) {
    return Promise.reject(new Error("ffmpeg-static binary not found"));
  }

  const key = normalizeKeyHex(opts.keyHex);
  const similarity = clamp(opts.similarity, 0.01, 0.55);
  const blend = clamp(opts.blend, 0.01, 0.35);
  const crf = Math.round(clamp(opts.crf, 4, 63));
  const mirror = Boolean(opts.mirror);

  const ts = Number(opts.trimStart ?? 0);
  const te = opts.trimEnd != null ? Number(opts.trimEnd) : NaN;
  const eps = 0.06;
  let useTrim =
    Number.isFinite(ts) &&
    Number.isFinite(te) &&
    te - ts > eps;
  let trimDur = useTrim ? te - ts : 0;

  if (useTrim && trimDur < eps) useTrim = false;

  const ck = `chromakey=${key}:${similarity}:${blend}`;
  const vfCore = mirror ? `hflip,${ck}` : ck;

  /** @type {string[]} */
  let args;

  const inputArgs = ["-y"];
  if (useTrim && ts > eps) {
    inputArgs.push("-ss", String(Math.max(0, ts)));
  }
  inputArgs.push("-i", opts.inputPath);
  if (useTrim && trimDur > eps) {
    inputArgs.push("-t", String(trimDur));
  }

  if (opts.format === "mov-prores4444") {
    args = [
      ...inputArgs,
      "-vf",
      `${vfCore},format=yuva444p`,
      "-c:v",
      "prores_ks",
      "-profile:v",
      "4444",
      "-pix_fmt",
      "yuva444p10le",
      "-c:a",
      "pcm_s16le",
      opts.outputPath,
    ];
  } else {
    args = [
      ...inputArgs,
      "-vf",
      `${vfCore},format=yuva420p`,
      "-c:v",
      "libvpx-vp9",
      "-pix_fmt",
      "yuva420p",
      "-auto-alt-ref",
      "0",
      "-crf",
      String(crf),
      "-b:v",
      "0",
      "-row-mt",
      "1",
      "-c:a",
      "libopus",
      "-b:a",
      "192k",
      opts.outputPath,
    ];
  }

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

export async function ensureUploadsDir(baseDir) {
  const dir = path.join(baseDir, "uploads");
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function safeUnlink(p) {
  try {
    await unlink(p);
  } catch {
    /* ignore */
  }
}

function normalizeKeyHex(hex) {
  const h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(h)) return `0x${h}`;
  throw new Error("Invalid key color");
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
