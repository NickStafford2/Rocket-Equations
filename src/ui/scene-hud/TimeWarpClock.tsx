import { memo } from "react";
import { formatTimeWarp } from "../../mission";

type TimeWarpClockProps = {
  elapsedMissionHours: number;
  timeWarp: number;
  running: boolean;
};

const CLOCK_SIZE = 176;
const CLOCK_CENTER = CLOCK_SIZE / 2;
const CLOCK_RADIUS = 70;

export const TimeWarpClock = memo(function TimeWarpClock({
  elapsedMissionHours,
  timeWarp,
  running,
}: TimeWarpClockProps) {
  const normalizedHours = normalizeMissionHours(elapsedMissionHours);
  const totalSeconds = normalizedHours * 3600;
  const wholeHours = Math.floor(totalSeconds / 3600) % 24;
  const wholeMinutes = Math.floor(totalSeconds / 60) % 60;
  const wholeSeconds = Math.floor(totalSeconds) % 60;
  const minuteProgress = (totalSeconds % 3600) / 3600;
  const hourProgress = (normalizedHours % 12) / 12;
  const secondProgress = (totalSeconds % 60) / 60;

  const hourHand = describeHand({
    progress: hourProgress,
    length: 35,
    strokeWidth: 5,
    color: "#f8fbff",
  });
  const minuteHand = describeHand({
    progress: minuteProgress,
    length: 51,
    strokeWidth: 3.5,
    color: "#8be3ff",
  });
  const secondHand = describeHand({
    progress: secondProgress,
    length: 58,
    strokeWidth: 1.5,
    color: "#ffd07d",
  });

  return (
    <div className="pointer-events-none min-w-[210px] overflow-hidden rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="tracking-[0.18em] text-[0.68rem] text-slate-400 uppercase">
            Time Flow
          </div>
          <div className="mt-1 font-[var(--heading)] text-xl text-slate-50">
            {formatTimeWarp(timeWarp)}x
          </div>
        </div>
        <div
          className={`rounded-full border px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.18em] uppercase ${
            running
              ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
              : "border-white/12 bg-white/6 text-slate-300"
          }`}
        >
          {running ? "Live" : "Paused"}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(139,227,255,0.18),_transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))] px-2 py-3">
        <svg
          viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
          className="h-40 w-40 drop-shadow-[0_10px_22px_rgba(0,0,0,0.34)]"
          aria-label="Mission time analogue clock"
          role="img"
        >
          <defs>
            <radialGradient id="clock-face-fill" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="rgba(18, 35, 58, 0.94)" />
              <stop offset="70%" stopColor="rgba(5, 13, 24, 0.96)" />
              <stop offset="100%" stopColor="rgba(2, 6, 13, 1)" />
            </radialGradient>
          </defs>

          <circle
            cx={CLOCK_CENTER}
            cy={CLOCK_CENTER}
            r={CLOCK_RADIUS + 9}
            fill="rgba(139, 227, 255, 0.08)"
            stroke="rgba(139, 227, 255, 0.18)"
            strokeWidth="1.5"
          />
          <circle
            cx={CLOCK_CENTER}
            cy={CLOCK_CENTER}
            r={CLOCK_RADIUS}
            fill="url(#clock-face-fill)"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="2"
          />

          {Array.from({ length: 60 }, (_, index) => {
            const angle = (index / 60) * Math.PI * 2 - Math.PI / 2;
            const isHourMark = index % 5 === 0;
            const innerRadius = isHourMark ? CLOCK_RADIUS - 12 : CLOCK_RADIUS - 6;
            const outerRadius = CLOCK_RADIUS - 1;

            return (
              <line
                key={index}
                x1={CLOCK_CENTER + Math.cos(angle) * innerRadius}
                y1={CLOCK_CENTER + Math.sin(angle) * innerRadius}
                x2={CLOCK_CENTER + Math.cos(angle) * outerRadius}
                y2={CLOCK_CENTER + Math.sin(angle) * outerRadius}
                stroke={isHourMark ? "rgba(248,251,255,0.8)" : "rgba(148,163,184,0.45)"}
                strokeWidth={isHourMark ? 2.4 : 1}
                strokeLinecap="round"
              />
            );
          })}

          <circle
            cx={CLOCK_CENTER}
            cy={CLOCK_CENTER}
            r={CLOCK_RADIUS - 19}
            fill="none"
            stroke="rgba(139,227,255,0.12)"
            strokeWidth="1"
          />

          <line
            x1={CLOCK_CENTER}
            y1={CLOCK_CENTER + 9}
            x2={hourHand.x}
            y2={hourHand.y}
            stroke={hourHand.color}
            strokeWidth={hourHand.strokeWidth}
            strokeLinecap="round"
          />
          <line
            x1={CLOCK_CENTER}
            y1={CLOCK_CENTER + 11}
            x2={minuteHand.x}
            y2={minuteHand.y}
            stroke={minuteHand.color}
            strokeWidth={minuteHand.strokeWidth}
            strokeLinecap="round"
          />
          <line
            x1={CLOCK_CENTER}
            y1={CLOCK_CENTER + 14}
            x2={secondHand.x}
            y2={secondHand.y}
            stroke={secondHand.color}
            strokeWidth={secondHand.strokeWidth}
            strokeLinecap="round"
          />

          <circle
            cx={CLOCK_CENTER}
            cy={CLOCK_CENTER}
            r="5.5"
            fill="#f8fbff"
          />
          <circle
            cx={CLOCK_CENTER}
            cy={CLOCK_CENTER}
            r="2"
            fill="#07111f"
          />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[0.68rem]">
        <MetricChip label="Mission clock" value={formatMissionClockLabel(wholeHours, wholeMinutes, wholeSeconds)} />
        <MetricChip label="Real second" value={`${formatTimeWarp(timeWarp)} simulated sec`} />
      </div>
    </div>
  );
});

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="tracking-[0.16em] text-[0.6rem] text-slate-500 uppercase">
        {label}
      </div>
      <div className="mt-1 font-medium text-slate-100">{value}</div>
    </div>
  );
}

function normalizeMissionHours(hours: number) {
  if (!Number.isFinite(hours) || hours < 0) {
    return 0;
  }

  return hours;
}

function describeHand({
  progress,
  length,
  strokeWidth,
  color,
}: {
  progress: number;
  length: number;
  strokeWidth: number;
  color: string;
}) {
  const angle = progress * Math.PI * 2 - Math.PI / 2;

  return {
    x: CLOCK_CENTER + Math.cos(angle) * length,
    y: CLOCK_CENTER + Math.sin(angle) * length,
    strokeWidth,
    color,
  };
}

function formatMissionClockLabel(
  hours: number,
  minutes: number,
  seconds: number,
) {
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
