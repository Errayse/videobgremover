import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChromaPreview } from "./components/ChromaPreview";
import { VideoTimeline } from "./components/VideoTimeline";
import {
  IconDropper,
  IconExport,
  IconFeather,
  IconFilm,
  IconInfo,
  IconMirror,
  IconPause,
  IconPlay,
  IconQuality,
  IconScissors,
  IconSensitivity,
  IconUpload,
} from "./icons";
import "./app.css";

type ExportFormat = "webm-alpha" | "mov-prores4444";

function formatLabel(f: ExportFormat): string {
  switch (f) {
    case "webm-alpha":
      return "WebM · альфа";
    case "mov-prores4444":
      return "MOV · ProRes 4444";
    default: {
      const _exhaustive: never = f;
      return _exhaustive;
    }
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export default function App() {
  const fileRef = useRef<File | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playhead, setPlayhead] = useState(0);
  const [mirror, setMirror] = useState(false);

  const [keyHex, setKeyHex] = useState("#00ff00");
  const [sensitivity, setSensitivity] = useState(42);
  const [edgeSoftness, setEdgeSoftness] = useState(35);
  const [qualityCrf, setQualityCrf] = useState(16);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("webm-alpha");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const similarity = useMemo(() => {
    const t = sensitivity / 100;
    return 0.05 + t * 0.42;
  }, [sensitivity]);

  const blend = useMemo(() => {
    const t = edgeSoftness / 100;
    return 0.04 + t * 0.22;
  }, [edgeSoftness]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
    setVideoEl((prev) => (prev === node ? prev : node));
  }, []);

  const onPickFile = useCallback((file: File | null) => {
    fileRef.current = file;
    setExportError(null);
    setPlaybackError(null);
    setVideoReady(false);
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setPlayhead(0);
    setFileName(file?.name ?? null);
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (
        f &&
        (f.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|m4v)$/i.test(f.name))
      ) {
        onPickFile(f);
      }
    },
    [onPickFile],
  );

  const togglePlay = useCallback(() => {
    const v = videoEl;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [videoEl]);

  useEffect(() => {
    const v = videoEl;
    if (!v || !objectUrl) return;

    setVideoReady(false);
    setPlaybackError(null);

    const kickPlay = () => {
      void v.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    };

    const markReady = () => {
      if (v.videoWidth > 0) setVideoReady(true);
    };

    v.defaultMuted = true;
    v.muted = true;
    v.loop = false;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.preload = "auto";

    v.src = objectUrl;
    v.load();

    const onMeta = () => {
      markReady();
      kickPlay();
    };
    const onLoadedData = () => {
      markReady();
      kickPlay();
    };
    const onCanPlay = () => {
      markReady();
      kickPlay();
    };
    const onErr = () => {
      const code = v.error?.code;
      const hint =
        code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "Кодек не поддерживается. Конвертируйте в MP4 (H.264 + AAC)."
          : "Файл не читается как видео.";
      setPlaybackError(hint);
      setVideoReady(false);
    };

    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("loadeddata", onLoadedData);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onErr);

    markReady();
    kickPlay();

    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("loadeddata", onLoadedData);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onErr);
    };
  }, [objectUrl, videoEl]);

  useEffect(() => {
    const v = videoEl;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [videoEl]);

  useEffect(() => {
    const v = videoEl;
    if (!v || !objectUrl) return;

    const onDur = () => {
      const d = v.duration;
      if (Number.isFinite(d) && d > 0) {
        setDuration(d);
        setTrimStart(0);
        setTrimEnd(d);
        setPlayhead((t) => clamp(t, 0, d));
      }
    };

    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("durationchange", onDur);
    onDur();

    return () => {
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("durationchange", onDur);
    };
  }, [videoEl, objectUrl]);

  useEffect(() => {
    const v = videoEl;
    if (!v) return;

    const sync = () => setPlayhead(v.currentTime);
    v.addEventListener("timeupdate", sync);
    v.addEventListener("seeked", sync);
    sync();

    return () => {
      v.removeEventListener("timeupdate", sync);
      v.removeEventListener("seeked", sync);
    };
  }, [videoEl]);

  useEffect(() => {
    const v = videoEl;
    if (!v || duration <= 0) return;

    const onTime = () => {
      const t = v.currentTime;
      if (t < trimStart - 0.03) {
        v.currentTime = trimStart;
        return;
      }
      if (t >= trimEnd - 0.06) {
        v.currentTime = trimStart;
        if (!v.paused) void v.play();
      }
    };

    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [videoEl, duration, trimStart, trimEnd]);

  const onSeek = useCallback(
    (t: number) => {
      const v = videoEl;
      if (!v) return;
      const x = clamp(t, trimStart, trimEnd);
      v.currentTime = x;
      setPlayhead(x);
    },
    [videoEl, trimStart, trimEnd],
  );

  const onTrimChange = useCallback(
    (a: number, b: number) => {
      const hi = duration > 0 ? duration : b;
      const start = clamp(Math.min(a, b), 0, hi);
      const end = clamp(Math.max(a, b), start + 0.12, hi);
      setTrimStart(start);
      setTrimEnd(end);

      const v = videoEl;
      if (!v) return;
      if (v.currentTime < start || v.currentTime > end) {
        v.currentTime = start;
        setPlayhead(start);
      }
    },
    [videoEl, duration],
  );

  const exportVideo = useCallback(async () => {
    const file = fileRef.current;
    if (!file) {
      setExportError("Выберите видео");
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const fd = new FormData();
      fd.append("video", file);
      fd.append("keyHex", keyHex);
      fd.append("similarity", String(similarity));
      fd.append("blend", String(blend));
      fd.append("crf", String(qualityCrf));
      fd.append("format", exportFormat);
      fd.append("mirror", mirror ? "1" : "0");
      fd.append("trimStart", String(trimStart));
      fd.append("trimEnd", String(trimEnd));

      const res = await fetch("/api/export", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || `Сервер: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = exportFormat === "mov-prores4444" ? "mov" : "webm";
      a.href = url;
      a.download = `${stripExt(file.name)}-alpha.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Экспорт не удался");
    } finally {
      setExporting(false);
    }
  }, [
    blend,
    exportFormat,
    keyHex,
    mirror,
    qualityCrf,
    similarity,
    trimEnd,
    trimStart,
  ]);

  const colorPickerValue = /^#[0-9a-fA-F]{6}$/.test(keyHex) ? keyHex : "#00ff00";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden />
          <div className="brand-title">Video BG Remover</div>
        </div>

        <section className="panel">
          <div className="panel-head">
            <span className="panel-title">Файл</span>
          </div>
          <label
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept="video/*"
              className="visually-hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            <IconUpload size={22} />
            <span>Открыть видео</span>
          </label>
          {fileName ? <div className="file-pill">{fileName}</div> : null}
        </section>

        <section className="panel">
          <div className="panel-head">
            <span className="panel-title">Хромакей</span>
          </div>

          <div className="field">
            <div className="label-row">
              <IconDropper size={18} />
              <span>Ключ</span>
            </div>
            <div className="row">
              <input
                type="color"
                value={colorPickerValue}
                onChange={(e) => setKeyHex(e.target.value)}
                className="color-input"
                aria-label="Цвет ключа"
              />
              <input
                type="text"
                value={keyHex}
                onChange={(e) => setKeyHex(e.target.value)}
                className="text-input"
                spellCheck={false}
                placeholder="#00ff00"
              />
            </div>
          </div>

          <CtrlSlider
            icon={<IconSensitivity size={18} />}
            label="Чувствительность"
            value={sensitivity}
            onChange={setSensitivity}
          />
          <CtrlSlider
            icon={<IconFeather size={18} />}
            label="Край"
            value={edgeSoftness}
            onChange={setEdgeSoftness}
          />

          <div className="field">
            <div className="label-row">
              <IconFilm size={18} />
              <span>Экспорт</span>
              <span style={{ flex: 1 }} />
              <span
                className="icon-tip"
                title="WebM — веб/preview. MOV ProRes — монтаж, очень тяжёлый файл."
              >
                <IconInfo size={16} />
              </span>
            </div>
            <div className="format-row">
              <select
                className="select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                aria-label="Формат экспорта"
              >
                <option value="webm-alpha">{formatLabel("webm-alpha")}</option>
                <option value="mov-prores4444">{formatLabel("mov-prores4444")}</option>
              </select>
            </div>
          </div>

          {exportFormat === "webm-alpha" ? (
            <CtrlSlider
              icon={<IconQuality size={18} />}
              label="Качество"
              value={qualityCrf}
              onChange={setQualityCrf}
              display={`${qualityCrf}`}
              min={10}
              max={28}
            />
          ) : null}

          <button
            type="button"
            className="btn primary"
            disabled={!fileName || exporting}
            onClick={() => void exportVideo()}
          >
            <IconExport size={20} />
            {exporting ? "Кодирование…" : "Экспорт"}
          </button>
          {exportError ? <p className="error">{exportError}</p> : null}
        </section>
      </aside>

      <main className="stage">
        <header className="stage-toolbar">
          <div className="toolbar-title">
            <IconScissors size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Превью
          </div>
          <div className="toolbar-actions">
            <button
              type="button"
              className={`tool-btn ${mirror ? "active" : ""}`}
              onClick={() => setMirror((m) => !m)}
              disabled={!objectUrl}
              aria-pressed={mirror}
              aria-label="Зеркало по горизонтали"
              title="Зеркало"
            >
              <IconMirror size={20} />
            </button>
            <button
              type="button"
              className="tool-btn"
              onClick={togglePlay}
              disabled={!objectUrl}
              aria-label={playing ? "Пауза" : "Играть"}
              title={playing ? "Пауза" : "Играть"}
            >
              {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
            </button>
          </div>
        </header>

        <div className="stage-body">
          <div className="canvas-wrap checker">
            {objectUrl ? (
              <div className="preview-stack">
                <video
                  key={objectUrl}
                  ref={handleVideoRef}
                  className="video-decode"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                />
                {playbackError ? (
                  <div className="preview-loading">
                    <div>
                      <p className="preview-error-title">Нет картинки</p>
                      <p className="muted tiny">{playbackError}</p>
                    </div>
                  </div>
                ) : null}
                {!playbackError && !videoReady ? (
                  <div className="preview-loading muted tiny">Загрузка…</div>
                ) : null}
                {!playbackError && videoEl ? (
                  <ChromaPreview
                    video={videoEl}
                    keyHex={keyHex}
                    similarity={similarity}
                    blend={blend}
                    mirror={mirror}
                  />
                ) : null}
              </div>
            ) : (
              <div className="empty-state muted tiny">
                <strong>Откройте видео</strong>
                <div style={{ marginTop: 8 }}>Превью появится здесь.</div>
              </div>
            )}
          </div>

          {objectUrl && !playbackError ? (
            <div className="timeline-dock">
              <VideoTimeline
                duration={duration}
                currentTime={playhead}
                trimStart={trimStart}
                trimEnd={trimEnd}
                onTrimChange={onTrimChange}
                onSeek={onSeek}
                disabled={!videoReady || duration <= 0}
              />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function CtrlSlider(props: {
  icon: ReactNode;
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  display?: string;
}) {
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const display = props.display ?? `${props.value}`;
  return (
    <div className="ctrl">
      <div className="ctrl-head">
        {props.icon}
        <span className="ctrl-label">{props.label}</span>
        <span className="ctrl-val">{display}</span>
      </div>
      <input
        type="range"
        className="slider-elegant"
        min={min}
        max={max}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        aria-label={props.label}
      />
    </div>
  );
}

function stripExt(name: string): string {
  return name.replace(/\.[^/.]+$/, "") || "video";
}
