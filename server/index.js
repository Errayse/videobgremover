import cors from "cors";
import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";

import { ensureUploadsDir, runChromaExport, safeUnlink } from "./export.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const isProd = process.env.NODE_ENV === "production";

const app = express();
const PORT = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const uploadsDirPromise = ensureUploadsDir(rootDir);

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const dir = await uploadsDirPromise;
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".mp4";
    cb(null, `${nanoid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 * 1024 },
});

app.post("/api/export", upload.single("video"), async (req, res) => {
  const file = req.file;
  if (!file?.path) {
    res.status(400).json({ error: "Файл video обязателен" });
    return;
  }

  let keyHex = String(req.body.keyHex ?? "#00ff00");
  const similarity = Number(req.body.similarity ?? 0.22);
  const blend = Number(req.body.blend ?? 0.12);
  const crf = Number(req.body.crf ?? 18);
  const format = req.body.format === "mov-prores4444" ? "mov-prores4444" : "webm-alpha";
  const mirror =
    req.body.mirror === true ||
    req.body.mirror === "true" ||
    req.body.mirror === "1";
  const trimStart = Number(req.body.trimStart ?? 0);
  const trimEndRaw = req.body.trimEnd;
  const trimEnd = trimEndRaw === undefined || trimEndRaw === "" ? NaN : Number(trimEndRaw);

  const outExt = format === "mov-prores4444" ? ".mov" : ".webm";
  const outPath = path.join(path.dirname(file.path), `${nanoid()}${outExt}`);

  try {
    keyHex = keyHex.startsWith("#") ? keyHex : `#${keyHex}`;
    await runChromaExport({
      inputPath: file.path,
      outputPath: outPath,
      keyHex,
      similarity,
      blend,
      crf,
      format,
      mirror,
      trimStart,
      trimEnd,
    });

    const downloadName =
      format === "mov-prores4444"
        ? `${stripExt(file.originalname)}-alpha.mov`
        : `${stripExt(file.originalname)}-alpha.webm`;

    res.download(outPath, downloadName, async (err) => {
      await safeUnlink(file.path);
      await safeUnlink(outPath);
      if (err && !res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });
  } catch (e) {
    await safeUnlink(file.path);
    await safeUnlink(outPath);
    const msg = e instanceof Error ? e.message : "Ошибка экспорта";
    res.status(500).json({ error: msg });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

if (isProd) {
  const clientDir = path.join(rootDir, "dist/client");
  app.use(express.static(clientDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API: http://127.0.0.1:${PORT}`);
});

function stripExt(name) {
  const base = path.basename(name || "video");
  return base.replace(/\.[^/.]+$/, "") || "video";
}
