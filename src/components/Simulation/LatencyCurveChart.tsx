import React, { useEffect, useRef, useState } from 'react';
import { ThemeMode } from '../../types/course';

interface LatencyCurveChartProps {
  utilization: number;
  theme: ThemeMode;
  transitionKey?: string | number;
  isPaused?: boolean;
}

export const LatencyCurveChart: React.FC<LatencyCurveChartProps> = ({
  utilization,
  theme,
  transitionKey,
  isPaused = false,
}) => {
  const targetUtil = Math.max(0, Math.min(100, utilization));
  const [animatedUtil, setAnimatedUtil] = useState(targetUtil);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [isAnimatingEntry, setIsAnimatingEntry] = useState(false);

  const animatedUtilRef = useRef(targetUtil);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Smoothly interpolate dot along the curve when utilization or transitionKey changes
  useEffect(() => {
    const startVal = animatedUtilRef.current;
    const endVal = targetUtil;
    const duration = 520;
    let startTime: number | null = null;
    let rafId: number;

    setIsAnimatingEntry(true);
    const entryTimer = window.setTimeout(() => setIsAnimatingEntry(false), 450);

    const step = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const nextVal = startVal + (endVal - startVal) * eased;
      animatedUtilRef.current = nextVal;
      setAnimatedUtil(nextVal);

      if (t < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(entryTimer);
    };
  }, [targetUtil, transitionKey]);

  // Subtle ambient pulse on the active dot
  useEffect(() => {
    let rafId: number;
    let lastTime: number | null = null;

    const tick = (now: number) => {
      if (lastTime === null) lastTime = now;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!isPausedRef.current) {
        setPulsePhase((p) => (p + dt * 2.6) % (Math.PI * 2));
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const displayUtil = Math.round(animatedUtil);
  const utilColor =
    animatedUtil >= 85 ? '#E0554B' : animatedUtil >= 65 ? '#E5A93E' : '#7EB865';

  // Inner SVG coordinates inside 236x138 box
  const chartX0 = 24;
  const chartW = 186;
  const chartY0 = 110;
  const chartH = 80;

  const evalCurveY = (uNorm: number) => {
    const yNorm = 0.04 + 0.08 * uNorm + 0.88 * Math.pow(uNorm, 5.5);
    return chartY0 - Math.min(0.98, yNorm) * chartH;
  };

  const curvePoints: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const px = chartX0 + t * chartW;
    const py = evalCurveY(t);
    curvePoints.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  const curvePath = curvePoints.join(' ');
  const dotX = chartX0 + (animatedUtil / 100) * chartW;
  const dotY = evalCurveY(animatedUtil / 100);
  const dangerX = chartX0 + 0.8 * chartW;

  return (
    <div
      className={`sim-chart-overlay ${isAnimatingEntry ? 'chart-pop' : ''}`}
      aria-label={`Latency vs how busy chart: ${displayUtil}% utilization`}
    >
      <svg
        viewBox="0 0 238 138"
        width="100%"
        height="100%"
        style={{ display: 'block', userSelect: 'none' }}
      >
        {/* Header */}
        <path
          d="M 14 21 L 18 17 L 21 19 L 26 13"
          fill="none"
          stroke={utilColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="33"
          y="20"
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="0.55"
          fill="var(--text-secondary)"
        >
          LATENCY VS. HOW BUSY
        </text>
        <line x1="12" y1="28" x2="226" y2="28" stroke="var(--border-subtle)" strokeWidth="1" />

        {/* Danger Zone Shading (>80%) */}
        <rect
          x={dangerX}
          y={chartY0 - chartH}
          width={chartX0 + chartW - dangerX}
          height={chartH}
          fill="rgba(232, 97, 86, 0.14)"
        />

        {/* Axes */}
        <line
          x1={chartX0}
          y1={chartY0 - chartH}
          x2={chartX0}
          y2={chartY0}
          stroke="var(--sim-chart-axis)"
          strokeWidth="1.2"
        />
        <line
          x1={chartX0}
          y1={chartY0}
          x2={chartX0 + chartW + 8}
          y2={chartY0}
          stroke="var(--sim-chart-axis)"
          strokeWidth="1.2"
        />

        <text x={chartX0 + 5} y={chartY0 - chartH + 10} fontSize="8.5" fill="var(--text-muted)">
          latency
        </text>
        <text
          x={chartX0 + chartW + 7}
          y={chartY0 + 14}
          fontSize="8.5"
          textAnchor="end"
          fill="var(--text-muted)"
        >
          utilization →
        </text>

        {/* Hockey Stick Curve */}
        <path
          d={curvePath}
          fill="none"
          stroke="var(--sim-chart-curve)"
          strokeWidth="2.1"
          strokeLinecap="round"
        />

        {/* Vertical drop-line */}
        <line
          x1={dotX}
          y1={dotY}
          x2={dotX}
          y2={chartY0}
          stroke={utilColor}
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />

        {/* Active pulse halo + dot */}
        <circle
          cx={dotX}
          cy={dotY}
          r={6.5 + Math.sin(pulsePhase) * 2}
          fill={utilColor}
          opacity="0.22"
        />
        <circle
          cx={dotX}
          cy={dotY}
          r="4.3"
          fill={utilColor}
          stroke={theme === 'light' ? '#26221F' : '#181614'}
          strokeWidth="1.5"
        />

        <text
          x={Math.min(dotX - 9, chartX0 + chartW - 22)}
          y={Math.max(dotY - 8, 41)}
          fontSize="10"
          fontWeight="700"
          textAnchor="end"
          fill="var(--text-primary)"
        >
          {displayUtil}%
        </text>
      </svg>
    </div>
  );
};
