import * as Slider from "@radix-ui/react-slider";

export type VideoTimelineProps = {
  duration: number;
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  onTrimChange: (start: number, end: number) => void;
  onSeek: (t: number) => void;
  disabled?: boolean;
};

function formatTc(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0").slice(0, 2)}`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function VideoTimeline({
  duration,
  currentTime,
  trimStart,
  trimEnd,
  onTrimChange,
  onSeek,
  disabled,
}: VideoTimelineProps) {
  const dMax = Math.max(duration, 0.01);
  const unusable = disabled || duration <= 0;

  const pct =
    duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;

  return (
    <div className="video-timeline">
      <div className="video-timeline-row">
        <span className="video-timeline-label muted tiny">Обрезка</span>
        <span className="video-timeline-times tiny">
          <span>{formatTc(trimStart)}</span>
          <span className="muted"> — </span>
          <span>{formatTc(trimEnd)}</span>
          <span className="muted"> · </span>
          <span>{formatTc(currentTime)}</span>
          <span className="muted"> / </span>
          <span>{formatTc(duration)}</span>
        </span>
        <button
          type="button"
          className="btn tiny-reset"
          disabled={unusable}
          onClick={() => onTrimChange(0, duration)}
          title="Сбросить обрезку"
        >
          Весь ролик
        </button>
      </div>

      <div className="timeline-stack">
        <Slider.Root
          className="trim-slider-root"
          min={0}
          max={dMax}
          step={0.03}
          value={[trimStart, trimEnd]}
          onValueChange={(v) => {
            const a = clamp(Math.min(v[0]!, v[1]!), 0, dMax);
            const b = clamp(Math.max(v[0]!, v[1]!), 0, dMax);
            if (b - a < 0.12) return;
            onTrimChange(a, b);
          }}
          disabled={unusable}
          aria-label="Обрезка по времени"
        >
          <Slider.Track className="trim-slider-track">
            <Slider.Range className="trim-slider-range" />
          </Slider.Track>
          <Slider.Thumb className="trim-slider-thumb" />
          <Slider.Thumb className="trim-slider-thumb" />
        </Slider.Root>
        <div className="timeline-playbar" aria-hidden>
          <div className="timeline-playhead" style={{ left: `${pct}%` }} />
        </div>
      </div>

      <div className="scrub-row">
        <span className="muted tiny">Позиция</span>
        <input
          type="range"
          className="scrub-slider slider-elegant"
          min={trimStart}
          max={trimEnd}
          step={0.02}
          value={clamp(currentTime, trimStart, trimEnd)}
          disabled={unusable || trimEnd - trimStart < 0.05}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Перемотка"
        />
      </div>
    </div>
  );
}
