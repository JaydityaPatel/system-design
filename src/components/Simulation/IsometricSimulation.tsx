import React, { useEffect, useRef, useState } from 'react';
import { SimulationConfig, ThemeMode } from '../../types/course';

export interface StepContextInfo {
  stepNumber: number;
  stepHeading: string;
  stepTag: string;
  lessonTitle: string;
}

interface IsometricSimulationProps {
  config: SimulationConfig;
  isPaused: boolean;
  replayKey: number;
  theme: ThemeMode;
  transitionKey?: string | number;
  stepInfo?: StepContextInfo;
}

type HoveredPart =
  | { kind: 'users' }
  | { kind: 'link' }
  | { kind: 'queue' }
  | { kind: 'server'; label: string }
  | { kind: 'fanout'; label: string };

interface Particle {
  id: number;
  kind: 'request' | 'slow' | 'response';
  progress: number; // 0 -> 1
  speed: number;
}

interface Pt {
  x: number;
  y: number;
}

// Exact 5 cols (left-to-right along NW->SE) x 3 rows (back-to-front along SW->NE) color grid
const PERSON_COLOR_GRID: string[][] = [
  ['#B8AAD9', '#EFA56C', '#A0CC8A', '#F0CB78', '#8FBBE0'], // back row
  ['#8FBBE0', '#B8AAD9', '#EFA56C', '#B8AAD9', '#8FBBE0'], // middle row
  ['#8FBBE0', '#F0CB78', '#A0CC8A', '#EFA56C', '#B8AAD9'], // front row
];

function roundedPolygonPath(points: Pt[], radius: number): string {
  const n = points.length;
  if (n < 3) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const len1 = Math.hypot(v1x, v1y) || 1;
    const r1 = Math.min(radius, len1 * 0.42);

    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len2 = Math.hypot(v2x, v2y) || 1;
    const r2 = Math.min(radius, len2 * 0.42);

    const pStartX = curr.x + (v1x / len1) * r1;
    const pStartY = curr.y + (v1y / len1) * r1;
    const pEndX = curr.x + (v2x / len2) * r2;
    const pEndY = curr.y + (v2y / len2) * r2;

    if (i === 0) {
      d += `M ${pStartX.toFixed(2)} ${pStartY.toFixed(2)} `;
    } else {
      d += `L ${pStartX.toFixed(2)} ${pStartY.toFixed(2)} `;
    }
    d += `Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${pEndX.toFixed(2)} ${pEndY.toFixed(2)} `;
  }
  return `${d}Z`;
}

function createInitialParticles(config: SimulationConfig): Particle[] {
  const count = Math.max(5, Math.min(12, Math.round(config.usersCount * 0.7)));
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const isResp = i % 3 === 1;
    const isSlow = !isResp && i / count < config.slowRatio;
    particles.push({
      id: i,
      kind: isResp ? 'response' : isSlow ? 'slow' : 'request',
      progress: (i / count) % 1,
      speed: (isResp ? 0.34 : isSlow ? 0.22 : 0.36) * config.particleSpeed,
    });
  }
  return particles;
}

interface ImpactRipple {
  id: number;
  side: 'user' | 'server';
  serverIdx: number;
  progress: number; // 0 -> 1
}

export const IsometricSimulation: React.FC<IsometricSimulationProps> = ({
  config,
  isPaused,
  replayKey,
  theme,
  transitionKey,
  stepInfo,
}) => {
  const [hoveredPart, setHoveredPart] = useState<HoveredPart | null>(null);
  const [particles, setParticles] = useState<Particle[]>(() => createInitialParticles(config));
  const particlesRef = useRef<Particle[]>(particles);
  const [impactRipples, setImpactRipples] = useState<ImpactRipple[]>([]);
  const ripplesRef = useRef<ImpactRipple[]>([]);
  const nextRippleIdRef = useRef(1);
  const serverCountRef = useRef(config.serverCount);
  const [pulsePhase, setPulsePhase] = useState(0);

  const targetUtil = Math.max(0, Math.min(100, config.utilization));
  const [animatedUtil, setAnimatedUtil] = useState(targetUtil);
  const animatedUtilRef = useRef(targetUtil);

  const parsedUsers = parseInt(config.usersLabel.replace(/[^0-9]/g, ''), 10) || 1000;
  const [animatedUsers, setAnimatedUsers] = useState(parsedUsers);
  const animatedUsersRef = useRef(parsedUsers);

  const targetScale = config.serverScale ?? 1.0;
  const [animatedScale, setAnimatedScale] = useState(targetScale);
  const animatedScaleRef = useRef(targetScale);

  const targetSplit = config.serverCount >= 2 ? 1 : 0;
  const [splitProgress, setSplitProgress] = useState(targetSplit);
  const splitProgressRef = useRef(targetSplit);

  const [bounceProg, setBounceProg] = useState(0);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    serverCountRef.current = config.serverCount;
  }, [config.serverCount]);

  // Trigger smooth utilization, users count, server scale, split & initial transition ripples
  useEffect(() => {
    const startUtil = animatedUtilRef.current;
    const endUtil = targetUtil;
    const startUsers = animatedUsersRef.current;
    const endUsers = parsedUsers;
    const startScale = animatedScaleRef.current;
    const endScale = targetScale;
    const startSplit = splitProgressRef.current;
    const endSplit = targetSplit;

    const animDuration = 540;
    let startTime: number | null = null;
    let animId: number;

    setBounceProg(0);

    const animateTransition = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;

      const t = Math.min(1, elapsed / animDuration);
      const eased = 1 - Math.pow(1 - t, 3);

      const nextUtil = startUtil + (endUtil - startUtil) * eased;
      animatedUtilRef.current = nextUtil;
      setAnimatedUtil(nextUtil);

      const nextUsers = startUsers + (endUsers - startUsers) * eased;
      animatedUsersRef.current = nextUsers;
      setAnimatedUsers(nextUsers);

      const nextScale = startScale + (endScale - startScale) * eased;
      animatedScaleRef.current = nextScale;
      setAnimatedScale(nextScale);

      const nextSplit = startSplit + (endSplit - startSplit) * eased;
      splitProgressRef.current = nextSplit;
      setSplitProgress(nextSplit);

      setBounceProg(t);

      if (t < 1) {
        animId = requestAnimationFrame(animateTransition);
      }
    };

    animId = requestAnimationFrame(animateTransition);
    return () => cancelAnimationFrame(animId);
  }, [
    transitionKey,
    replayKey,
    targetUtil,
    parsedUsers,
    targetScale,
    targetSplit,
    config.usersCount,
    config.serverCount,
    config.fanOutCount,
    config.linkLength,
  ]);

  useEffect(() => {
    const fresh = createInitialParticles(config);
    particlesRef.current = fresh;
    setParticles(fresh);
    ripplesRef.current = [];
    setImpactRipples([]);
    lastTimeRef.current = null;
  }, [
    replayKey,
    config.usersCount,
    config.slowRatio,
    config.particleSpeed,
    config.serverCount,
    config.batchMode,
  ]);

  useEffect(() => {
    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (!isPausedRef.current) {
        setPulsePhase((p) => (p + dt * 2.6) % (Math.PI * 2));

        const spawned: ImpactRipple[] = [];
        const srvTotal = serverCountRef.current >= 2 ? 2 : 1;

        particlesRef.current = particlesRef.current.map((p) => {
          let nextProg = p.progress + p.speed * dt;
          if (nextProg >= 1) {
            nextProg -= 1;
            if (p.kind === 'response') {
              spawned.push({
                id: nextRippleIdRef.current++,
                side: 'user',
                serverIdx: p.id % srvTotal,
                progress: 0,
              });
            }
          }
          return { ...p, progress: nextProg };
        });
        setParticles(particlesRef.current);

        ripplesRef.current = [
          ...ripplesRef.current
            .map((r) => ({ ...r, progress: r.progress + dt / 0.65 }))
            .filter((r) => r.progress < 1),
          ...spawned,
        ];
        setImpactRipples(ripplesRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Geometry coordinates aligned strictly to 2:1 isometric axes
  const isLong = config.linkLength === 'long';
  const userAnchor = isLong ? { x: 204, y: 310 } : { x: 244, y: 292 };

  // User platform proportions matching reference close-up
  const uHalf = { x: 96, y: 48 };
  const vHalf = { x: 68, y: -34 };

  const pTop: Pt = {
    x: userAnchor.x - uHalf.x + vHalf.x,
    y: userAnchor.y - uHalf.y + vHalf.y,
  };
  const pRight: Pt = {
    x: userAnchor.x + uHalf.x + vHalf.x,
    y: userAnchor.y + uHalf.y + vHalf.y,
  };
  const pBottom: Pt = {
    x: userAnchor.x + uHalf.x - vHalf.x,
    y: userAnchor.y + uHalf.y - vHalf.y,
  };
  const pLeft: Pt = {
    x: userAnchor.x - uHalf.x - vHalf.x,
    y: userAnchor.y - uHalf.y - vHalf.y,
  };

  const slabDepth = 9;
  const topSlabPath = roundedPolygonPath([pTop, pRight, pBottom, pLeft], 16);
  const outerSlabPath = roundedPolygonPath(
    [
      pTop,
      pRight,
      { x: pRight.x, y: pRight.y + slabDepth },
      { x: pBottom.x, y: pBottom.y + slabDepth },
      { x: pLeft.x, y: pLeft.y + slabDepth },
      pLeft,
    ],
    16
  );

  // Subtle crease line along the top front edges
  const topCreasePath = `M ${(pLeft.x + 8).toFixed(1)} ${(pLeft.y + 4).toFixed(1)} L ${(pBottom.x - 10).toFixed(1)} ${(pBottom.y - 5).toFixed(1)} Q ${pBottom.x.toFixed(1)} ${pBottom.y.toFixed(1)} ${(pBottom.x + 10).toFixed(1)} ${(pBottom.y - 5).toFixed(1)} L ${(pRight.x - 8).toFixed(1)} ${(pRight.y + 4).toFixed(1)}`;

  // Conduit start point at exact center of NE edge of user platform
  const linkStart: Pt = {
    x: userAnchor.x + vHalf.x,
    y: userAnchor.y + vHalf.y,
  };

  const singleX = isLong ? 510 : 470;
  const singleY = isLong ? 125 : 145;

  const servers =
    splitProgress > 0.02
      ? [
          {
            cx: singleX + (488 - singleX) * splitProgress,
            cy: singleY + (148 - singleY) * splitProgress,
            label: splitProgress > 0.5 ? 'App 1' : 'App',
          },
          {
            cx: singleX + (530 - singleX) * splitProgress,
            cy: singleY + (226 - singleY) * splitProgress,
            label: 'App 2',
          },
        ]
      : [{ cx: singleX, cy: singleY, label: 'App' }];

  const primaryServer = servers[0];

  const util = Math.round(animatedUtil);
  const utilColor =
    animatedUtil >= 85 ? '#E0554B' : animatedUtil >= 65 ? '#E5A93E' : '#7EB865';

  // 15 stylized peg-people on 5 cols x 3 rows
  const peoplePositions: { x: number; y: number; color: string; id: number }[] = [];
  const totalPeople = Math.max(3, Math.min(15, config.usersCount));
  let idx = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      if (idx >= totalPeople) break;
      const uNorm = (c - 2) * 0.34;
      const vNorm = (r - 1) * 0.44;
      const px = userAnchor.x + uHalf.x * uNorm + vHalf.x * vNorm;
      const py = userAnchor.y + uHalf.y * uNorm + vHalf.y * vNorm - 4;
      peoplePositions.push({
        id: idx,
        x: px,
        y: py,
        color: PERSON_COLOR_GRID[r][c],
      });
      idx++;
    }
  }
  peoplePositions.sort((a, b) => a.y - b.y);

  // Isometric Grid Floor lines
  const gridLines: React.ReactNode[] = [];
  const stepX = 34;
  for (let i = -15; i <= 15; i++) {
    const x1 = 380 + i * stepX - 420;
    const y1 = 248 - 210;
    const x2 = 380 + i * stepX + 420;
    const y2 = 248 + 210;
    gridLines.push(
      <line
        key={`g1-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--sim-grid-stroke)"
        strokeWidth="1"
      />,
      <line
        key={`g2-${i}`}
        x1={x1}
        y1={y2}
        x2={x2}
        y2={y1}
        stroke="var(--sim-grid-stroke)"
        strokeWidth="1"
      />
    );
  }

  const fanOutNodes =
    config.fanOutCount > 0
      ? [
        { cx: primaryServer.cx + 126, cy: primaryServer.cy - 44, name: 'Auth' },
        { cx: primaryServer.cx + 150, cy: primaryServer.cy + 14, name: 'DB' },
        { cx: primaryServer.cx + 114, cy: primaryServer.cy + 68, name: 'Cache' },
      ].slice(0, config.fanOutCount)
      : [];

  // Primary conduit endpoint centered on SW wall of primary server
  const primaryEnd: Pt = { x: primaryServer.cx - 24, y: primaryServer.cy + 46 };
  const pDx = primaryEnd.x - linkStart.x;
  const pDy = primaryEnd.y - linkStart.y;
  const pLen = Math.hypot(pDx, pDy) || 1;
  const pUx = pDx / pLen;
  const pUy = pDy / pLen;

  // Queue beads stacked tightly along the solid line
  const qCount = Math.min(7, config.queueCount);
  const queueBeads: { x: number; y: number; color: string; isHead: boolean }[] = [];
  for (let q = 0; q < qCount; q++) {
    const backDist = 14 + q * 13.5;
    const isHead = q === 0 && util >= 90;
    queueBeads.push({
      x: primaryEnd.x - pUx * backDist,
      y: primaryEnd.y - pUy * backDist,
      color: isHead ? '#DC483E' : q % 2 === 1 ? '#EFA14D' : '#F0B038',
      isHead,
    });
  }
  const queueTailDist = qCount > 0 ? 14 + qCount * 13.5 : 10;
  const travelMaxRatio = Math.max(0.24, (pLen - queueTailDist) / pLen);

  // Colors
  const inkStroke = theme === 'light' ? '#26221F' : '#181614';
  const platformRimStroke = theme === 'light' ? '#26221F' : '#D5D0C5';
  const serverRimStroke =
    theme === 'light' ? '#26221F' : animatedUtil >= 85 ? '#EBB1A8' : '#B9A4B8';
  const conduitColor = theme === 'light' ? '#26221F' : '#B5ADA0';
  const pillBorder = theme === 'light' ? '#26221F' : '#8C857A';
  const userRippleStroke = theme === 'light' ? '#6BBF62' : '#7FD175';

  // Gentle spring bounce on transition
  const springBounce = 1 + 0.022 * Math.sin(bounceProg * Math.PI);

  // Tubelight color & phase-aware explanation card for hovered element
  const tubelightColor =
    hoveredPart?.kind === 'server'
      ? util >= 85
        ? '#F87171'
        : util >= 65
        ? '#FBBF24'
        : '#7DD3FC'
      : hoveredPart?.kind === 'queue'
      ? '#FBBF24'
      : hoveredPart?.kind === 'link'
      ? '#7FD175'
      : hoveredPart?.kind === 'fanout'
      ? '#C084FC'
      : '#7DD3FC';

  const hoverCard = (() => {
    if (!hoveredPart) return null;
    const phaseLabel = stepInfo
      ? `STEP ${stepInfo.stepNumber} · ${stepInfo.stepTag}`
      : 'LIVE SIMULATION';
    const stepHeading = stepInfo?.stepHeading ?? 'System Behavior';

    switch (hoveredPart.kind) {
      case 'users':
        return {
          title: `Client Pool (${config.usersLabel})`,
          badge: phaseLabel,
          accent: '#7DD3FC',
          body: config.batchMode
            ? `Clients are batching multiple operations into fewer round-trips during "${stepHeading}", keeping throughput at ${config.throughputLabel} while cutting per-item network overhead.`
            : util >= 85
            ? `${config.usersLabel} are sending bursts faster than the server can drain (${config.throughputLabel}). Returning green responses slow down to ${config.p99Label} at p99.`
            : `${config.usersLabel} generate ${config.throughputLabel}. Each green ripple marks a completed response returning in ~${config.p50Label} median.`,
        };
      case 'link':
        return {
          title: config.linkLength === 'long' ? 'Long-Haul Network Link' : 'Network Conduit',
          badge: phaseLabel,
          accent: '#7FD175',
          body:
            config.linkLength === 'long'
              ? `Greater physical distance sets a higher speed-of-light latency floor (${config.p50Label} p50). Adding more servers won't shorten the wire travel time.`
              : config.slowRatio > 0.25
              ? `Amber dots represent slow or queued requests (${Math.round(config.slowRatio * 100)}% slow tail), pushing p99 latency to ${config.p99Label}.`
              : `Carries outbound requests (amber) and returning responses (green) at ${config.throughputLabel} with ${config.p50Label} median round-trip.`,
        };
      case 'queue':
        return {
          title: `Request Queue (${config.queueCount} waiting)`,
          badge: phaseLabel,
          accent: '#FBBF24',
          body:
            util >= 85
              ? `At ${util}% utilization, incoming bursts pile up behind active work. By Little's Law, queue depth explodes and drives p99 latency to ${config.p99Label}.`
              : `${config.queueCount} requests are briefly buffered while micro-bursts overlap at ${util}% utilization, keeping p50 at ${config.p50Label} and p99 at ${config.p99Label}.`,
        };
      case 'fanout':
        return {
          title: `Downstream Service: ${hoveredPart.label}`,
          badge: phaseLabel,
          accent: '#C084FC',
          body: `Part of a ${config.fanOutCount}-way fan-out. The App Server must wait for the slowest of all ${config.fanOutCount} downstream calls before replying, amplifying tail latency (${config.p99Label} p99).`,
        };
      case 'server': {
        const srvName = `${hoveredPart.label} Server`;
        const headroom = Math.max(0, 100 - util);
        return {
          title: srvName,
          badge: phaseLabel,
          accent: util >= 85 ? '#F87171' : util >= 65 ? '#FBBF24' : '#7DD3FC',
          body:
            config.serverCount >= 2
              ? `Horizontally scaled across ${config.serverCount} servers during "${stepHeading}". Load is split so each node runs at ${util}% utilization (${headroom}% headroom) at ${config.throughputLabel}.`
              : config.fanOutCount > 0
              ? `Running at ${util}% CPU while fanning out each request to ${config.fanOutCount} downstream dependencies (${config.p99Label} p99).`
              : util >= 85
              ? `Near saturation at ${util}% busy (only ${headroom}% headroom). Incoming bursts cannot drain fast enough, causing ${config.queueCount} queued requests and ${config.p99Label} p99 latency.`
              : `Processing ${config.throughputLabel} at ${util}% utilization (${headroom}% spare headroom) during "${stepHeading}", returning responses in ${config.p50Label} median.`,
        };
      }
    }
  })();

  return (
    <div className="sim-interactive-stage">
      <svg
        viewBox="0 0 760 440"
        width="100%"
        height="100%"
        style={{ maxHeight: 520, display: 'block', userSelect: 'none' }}
        role="img"
        aria-label={`Interactive isometric server simulation showing ${config.usersLabel} and ${util}% utilization`}
      >
        <defs>
          <filter id="tubelight-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4.5" result="blur1" />
            <feGaussianBlur stdDeviation="9" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        <radialGradient id="grid-fade" cx="50%" cy="54%" r="48%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="65%" stopColor="white" stopOpacity="0.65" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="grid-mask">
          <rect x="0" y="0" width="760" height="440" fill="url(#grid-fade)" />
        </mask>

        <radialGradient id="server-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={utilColor} stopOpacity={theme === 'dark' ? 0.45 : 0.34} />
          <stop offset="55%" stopColor={utilColor} stopOpacity={theme === 'dark' ? 0.14 : 0.12} />
          <stop offset="100%" stopColor={utilColor} stopOpacity="0" />
        </radialGradient>

        <filter id="server-tight-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation={animatedUtil >= 80 ? '10' : '6'}
            floodColor={animatedUtil >= 80 ? utilColor : '#000000'}
            floodOpacity={
              animatedUtil >= 80
                ? theme === 'dark'
                  ? 0.45
                  : 0.38
                : theme === 'dark'
                  ? 0.45
                  : 0.14
            }
          />
        </filter>

        <linearGradient id="server-top-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            stopColor={
              animatedUtil < 40
                ? theme === 'dark'
                  ? '#475773'
                  : '#D5E2F5'
                : theme === 'dark'
                ? '#6D545D'
                : '#E3CFD6'
            }
          />
          <stop
            offset="100%"
            stopColor={
              animatedUtil < 40
                ? theme === 'dark'
                  ? '#38465E'
                  : '#C2D4EE'
                : theme === 'dark'
                ? '#523E47'
                : '#D5BFC9'
            }
          />
        </linearGradient>

        <linearGradient id="server-left-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={
              animatedUtil < 40
                ? theme === 'dark'
                  ? '#37445C'
                  : '#B5C8E6'
                : theme === 'dark'
                ? '#513D46'
                : '#C3AFC1'
            }
          />
          <stop
            offset="100%"
            stopColor={
              animatedUtil < 40
                ? theme === 'dark'
                  ? '#2A3548'
                  : '#A2B8DC'
                : theme === 'dark'
                ? '#3B2C33'
                : '#B7A2B6'
            }
          />
        </linearGradient>

        <linearGradient id="server-right-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={
              animatedUtil < 40
                ? theme === 'dark'
                  ? '#2E394E'
                  : '#A7BCE0'
                : theme === 'dark'
                ? '#42323A'
                : '#B5A1B4'
            }
          />
          <stop
            offset="100%"
            stopColor={
              animatedUtil < 40
                ? theme === 'dark'
                  ? '#222B3C'
                  : '#94ABD3'
                : theme === 'dark'
                ? '#30232A'
                : '#A691A7'
            }
          />
        </linearGradient>

        <filter id="soft-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="7"
            stdDeviation="6"
            floodColor="#000000"
            floodOpacity={theme === 'dark' ? 0.48 : 0.14}
          />
        </filter>
      </defs>

      {/* Isometric Grid Floor */}
      <g mask="url(#grid-mask)">{gridLines}</g>

      {/* Isometric Rounded User Platform + Peg-People (levitate together on hover) */}
      <g
        style={{
          cursor: 'pointer',
          transform: hoveredPart?.kind === 'users' ? 'translateY(-8px)' : 'translateY(0px)',
          transition: 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onMouseEnter={() => setHoveredPart({ kind: 'users' })}
        onMouseLeave={() => setHoveredPart((p) => (p?.kind === 'users' ? null : p))}
      >
        <g
          transform={`translate(${userAnchor.x}, ${userAnchor.y}) scale(${springBounce}) translate(${-userAnchor.x}, ${-userAnchor.y})`}
          filter="url(#soft-shadow)"
        >
          <path d={outerSlabPath} fill={theme === 'light' ? '#DBD5CA' : '#1B1815'} />
          <path d={topSlabPath} fill={theme === 'light' ? '#F6F3EC' : '#27231F'} />
          <path
            d={topCreasePath}
            fill="none"
            stroke={theme === 'light' ? 'rgba(38, 34, 31, 0.28)' : 'rgba(255, 255, 255, 0.20)'}
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d={outerSlabPath}
            fill="none"
            stroke={hoveredPart?.kind === 'users' ? '#7DD3FC' : platformRimStroke}
            strokeWidth={hoveredPart?.kind === 'users' ? '3' : '2'}
            strokeLinejoin="round"
            filter={hoveredPart?.kind === 'users' ? 'url(#tubelight-glow)' : undefined}
          />
        </g>

        {/* 15 Stylized Upright Peg-People with swift pop-in when count increases */}
        {peoplePositions.map((person, pOrder) => (
          <g key={`person-${person.id}`} transform={`translate(${person.x}, ${person.y})`}>
            <g
              className="person-pop"
              style={{ animationDelay: `${Math.min(220, pOrder * 16)}ms` }}
            >
              <path
                d="M -7.6 -0.5 C -7.6 -7.2, 7.6 -7.2, 7.6 -0.5 L 7.6 11.2 C 7.6 14.8, -7.6 14.8, -7.6 11.2 Z"
                fill={person.color}
                stroke={inkStroke}
                strokeWidth="1.9"
                strokeLinejoin="round"
              />
              <circle
                cx="0"
                cy="-11.5"
                r="6.1"
                fill="#FAF8F4"
                stroke={inkStroke}
                strokeWidth="1.9"
              />
            </g>
          </g>
        ))}
      </g>

      {/* Floating Users Count Pill */}
      <g transform={`translate(${userAnchor.x - 66}, ${userAnchor.y + 82})`}>
        {theme === 'light' && (
          <rect x="0" y="2.5" width="132" height="27" rx="13.5" fill="#26221F" />
        )}
        <rect
          x="0"
          y="0"
          width="132"
          height="27"
          rx="13.5"
          fill="var(--sim-pill-bg)"
          stroke={pillBorder}
          strokeWidth={theme === 'light' ? 1.8 : 1.2}
        />
        <g transform="translate(13, 7.5)" stroke="var(--sim-pill-text)" fill="none" strokeWidth="1.45">
          <circle cx="4" cy="3.5" r="2.2" />
          <path d="M 0.5 10.5 C 0.5 8, 7.5 8, 7.5 10.5" />
          <circle cx="9.8" cy="4.2" r="1.7" />
          <path d="M 8 10.5 C 8 8.5, 12 8.5, 12 10.5" />
        </g>
        <text
          x="77"
          y="17.5"
          fontSize="11.5"
          fontWeight="700"
          textAnchor="middle"
          fill="var(--sim-pill-text)"
        >
          {Math.round(animatedUsers).toLocaleString()} users
        </text>
      </g>

      {/* Solid Double-Headed Connecting Line(s) */}
      {servers.map((srv, sIdx) => {
        const sEnd = { x: srv.cx - 24, y: srv.cy + 46 };
        const dx = sEnd.x - linkStart.x;
        const dy = sEnd.y - linkStart.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const perpX = -uy;
        const perpY = ux;

        const headTip = { x: sEnd.x - ux * 2, y: sEnd.y - uy * 2 };
        const headPts = `${headTip.x},${headTip.y} ${headTip.x - ux * 9 + perpX * 4.5},${headTip.y - uy * 9 + perpY * 4.5
          } ${headTip.x - ux * 9 - perpX * 4.5},${headTip.y - uy * 9 - perpY * 4.5}`;

        const tailTip = { x: linkStart.x + ux * 2, y: linkStart.y + uy * 2 };
        const tailPts = `${tailTip.x},${tailTip.y} ${tailTip.x + ux * 9 + perpX * 4.5},${tailTip.y + uy * 9 + perpY * 4.5
          } ${tailTip.x + ux * 9 - perpX * 4.5},${tailTip.y + uy * 9 - perpY * 4.5}`;

        const isLinkHovered = hoveredPart?.kind === 'link';
        return (
          <g
            key={`link-${sIdx}`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredPart({ kind: 'link' })}
            onMouseLeave={() => setHoveredPart((p) => (p?.kind === 'link' ? null : p))}
          >
            <line
              x1={tailTip.x + ux * 5}
              y1={tailTip.y + uy * 5}
              x2={headTip.x - ux * 5}
              y2={headTip.y - uy * 5}
              stroke="transparent"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <line
              x1={tailTip.x + ux * 5}
              y1={tailTip.y + uy * 5}
              x2={headTip.x - ux * 5}
              y2={headTip.y - uy * 5}
              stroke={isLinkHovered ? '#7FD175' : conduitColor}
              strokeWidth={isLinkHovered ? '3.4' : '2.2'}
              strokeLinecap="round"
              filter={isLinkHovered ? 'url(#tubelight-glow)' : undefined}
            />
            <polygon
              points={headPts}
              fill={isLinkHovered ? '#7FD175' : conduitColor}
              filter={isLinkHovered ? 'url(#tubelight-glow)' : undefined}
            />
            <polygon
              points={tailPts}
              fill={isLinkHovered ? '#7FD175' : conduitColor}
              filter={isLinkHovered ? 'url(#tubelight-glow)' : undefined}
            />
          </g>
        );
      })}

      {/* Floating Diagram Callout Bubble on top of Users Box (e.g. "≈ 120 ms round trip") */}
      {config.diagramLabel && (() => {
        const pillW = Math.max(128, config.diagramLabel.length * 7.2 + 26);
        const pillX = userAnchor.x - pillW / 2;
        const pillY = userAnchor.y - 104;
        return (
          <g transform={`translate(${pillX}, ${pillY})`} filter="url(#soft-shadow)">
            {theme === 'light' && (
              <rect x="0" y="2.5" width={pillW} height="26" rx="13" fill="#26221F" />
            )}
            <rect
              x="0"
              y="0"
              width={pillW}
              height="26"
              rx="13"
              fill="var(--sim-pill-bg)"
              stroke={pillBorder}
              strokeWidth={theme === 'light' ? 1.7 : 1.15}
            />
            {/* Small pointer notch pointing down to users box */}
            <path
              d={`M ${pillW / 2 - 5} 25.5 L ${pillW / 2} 31 L ${pillW / 2 + 5} 25.5`}
              fill="var(--sim-pill-bg)"
              stroke={pillBorder}
              strokeWidth={theme === 'light' ? 1.5 : 1.1}
            />
            <text
              x={pillW / 2}
              y="16.5"
              fontSize="10.5"
              fontWeight="600"
              textAnchor="middle"
              fill="var(--sim-pill-text)"
            >
              {config.diagramLabel}
            </text>
          </g>
        );
      })()}

      {/* Fan-out downstream nodes (Step 8) */}
      {fanOutNodes.map((fn, fIdx) => (
        <g key={`fan-${fIdx}`}>
          <line
            x1={primaryServer.cx + 46}
            y1={primaryServer.cy + 8}
            x2={fn.cx - 24}
            y2={fn.cy}
            stroke={conduitColor}
            strokeWidth="1.8"
          />
          <g
            transform={`translate(${fn.cx}, ${fn.cy})`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredPart({ kind: 'fanout', label: fn.name })}
            onMouseLeave={() => setHoveredPart((p) => (p?.kind === 'fanout' ? null : p))}
          >
            <path
              d={roundedPolygonPath(
                [
                  { x: 0, y: -18 },
                  { x: 28, y: -4 },
                  { x: 28, y: 12 },
                  { x: 0, y: 26 },
                  { x: -28, y: 12 },
                  { x: -28, y: -4 },
                ],
                5
              )}
              fill="url(#server-left-grad)"
              stroke={
                hoveredPart?.kind === 'fanout' && hoveredPart.label === fn.name
                  ? '#C084FC'
                  : serverRimStroke
              }
              strokeWidth={
                hoveredPart?.kind === 'fanout' && hoveredPart.label === fn.name ? '2.8' : '1.5'
              }
              filter={
                hoveredPart?.kind === 'fanout' && hoveredPart.label === fn.name
                  ? 'url(#tubelight-glow)'
                  : undefined
              }
            />
            <path
              d={roundedPolygonPath(
                [
                  { x: 0, y: -18 },
                  { x: 28, y: -4 },
                  { x: 0, y: 10 },
                  { x: -28, y: -4 },
                ],
                4
              )}
              fill="url(#server-top-grad)"
            />
            <text
              x="0"
              y="-1"
              fontSize="8.5"
              fontWeight="700"
              textAnchor="middle"
              fill="var(--sim-server-text)"
            >
              {fn.name}
            </text>
          </g>
        </g>
      ))}

      {/* Animated Request / Response Dots Riding DEAD-CENTER on the Solid Line */}
      {particles.map((pt) => {
        const targetServer = servers[pt.id % servers.length];
        const sEnd = { x: targetServer.cx - 24, y: targetServer.cy + 46 };
        const maxR = servers.length === 1 ? travelMaxRatio : 0.9;
        const dir =
          pt.kind === 'response'
            ? 0.08 + (1 - pt.progress) * (maxR - 0.08)
            : 0.08 + pt.progress * (maxR - 0.08);

        const px = linkStart.x + (sEnd.x - linkStart.x) * dir;
        const py = linkStart.y + (sEnd.y - linkStart.y) * dir;

        if (pt.kind === 'response') {
          return (
            <circle
              key={`pt-${pt.id}`}
              cx={px}
              cy={py}
              r="5.6"
              fill="#7EB865"
              stroke={inkStroke}
              strokeWidth="1.7"
            />
          );
        }

        const color = pt.kind === 'slow' ? '#F0B038' : '#EFA14D';

        return (
          <g key={`pt-${pt.id}`}>
            <circle
              cx={px}
              cy={py}
              r={config.batchMode ? 6.2 : 5.5}
              fill={color}
              stroke={inkStroke}
              strokeWidth="1.8"
            />
            {config.batchMode && (
              <circle
                cx={px - 6}
                cy={py + 3}
                r="4.5"
                fill={color}
                stroke={inkStroke}
                strokeWidth="1.5"
              />
            )}
          </g>
        );
      })}

      {/* Waiting-in-Queue Beads Stacked Directly on the Solid Line */}
      {queueBeads.map((qb, qIdx) => (
        <g
          key={`qb-${qIdx}`}
          transform={`translate(${qb.x}, ${qb.y})`}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHoveredPart({ kind: 'queue' })}
          onMouseLeave={() => setHoveredPart((p) => (p?.kind === 'queue' ? null : p))}
          filter={hoveredPart?.kind === 'queue' ? 'url(#tubelight-glow)' : undefined}
        >
          {qb.isHead ? (
            <>
              <circle
                cx="0"
                cy="0"
                r="6.4"
                fill="#DC483E"
                stroke={hoveredPart?.kind === 'queue' ? '#FBBF24' : inkStroke}
                strokeWidth={hoveredPart?.kind === 'queue' ? '2.6' : '1.9'}
              />
              <circle
                cx="0"
                cy="0"
                r={3 + Math.sin(pulsePhase) * 0.6}
                fill="none"
                stroke="#FFF5F2"
                strokeWidth="1.6"
              />
            </>
          ) : (
            <circle
              cx="0"
              cy="0"
              r="6.2"
              fill={qb.color}
              stroke={hoveredPart?.kind === 'queue' ? '#FBBF24' : inkStroke}
              strokeWidth={hoveredPart?.kind === 'queue' ? '2.6' : '1.9'}
            />
          )}
        </g>
      ))}

      {/* Chunky Sculpted 3D Isometric App Server(s) + Green Floor Ripple */}
      {servers.map((srv, sIdx) => {
        const sTop = { x: 0, y: -32 };
        const sRight = { x: 64, y: 0 };
        const sFront = { x: 0, y: 32 };
        const sLeft = { x: -64, y: 0 };
        const h = 46;

        const outerPrism = roundedPolygonPath(
          [
            sTop,
            sRight,
            { x: sRight.x, y: sRight.y + h },
            { x: sFront.x, y: sFront.y + h },
            { x: sLeft.x, y: sLeft.y + h },
            sLeft,
          ],
          16
        );

        const topFace = roundedPolygonPath([sTop, sRight, sFront, sLeft], 14);
        const leftFace = roundedPolygonPath(
          [
            sLeft,
            sFront,
            { x: sFront.x, y: sFront.y + h },
            { x: sLeft.x, y: sLeft.y + h },
          ],
          12
        );
        const rightFace = roundedPolygonPath(
          [
            sFront,
            sRight,
            { x: sRight.x, y: sRight.y + h },
            { x: sFront.x, y: sFront.y + h },
          ],
          12
        );

        const isSrvHovered = hoveredPart?.kind === 'server' && hoveredPart.label === srv.label;
        return (
          <g
            key={`srv-${sIdx}`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredPart({ kind: 'server', label: srv.label })}
            onMouseLeave={() => setHoveredPart((p) => (p?.kind === 'server' ? null : p))}
          >
            {/* Floor Glow Aura under App Server */}
            <ellipse cx={srv.cx} cy={srv.cy + 26} rx="102" ry="62" fill="url(#server-aura)" />

            <g
              style={{
                transform: isSrvHovered ? 'translateY(-9px)' : 'translateY(0px)',
                transition: 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <g
                transform={`translate(${srv.cx}, ${srv.cy}) scale(${springBounce * animatedScale})`}
                filter={isSrvHovered ? 'url(#tubelight-glow)' : 'url(#server-tight-glow)'}
              >
              <path d={leftFace} fill="url(#server-left-grad)" />
              <path d={rightFace} fill="url(#server-right-grad)" />
              <path d={topFace} fill="url(#server-top-grad)" />

              <path
                d={outerPrism}
                fill="none"
                stroke={isSrvHovered ? tubelightColor : serverRimStroke}
                strokeWidth={isSrvHovered ? '3.4' : '2.1'}
                strokeLinejoin="round"
              />
              {isSrvHovered && (
                <path
                  d={outerPrism}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity="0.85"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              )}

              {/* Crisp Upright Server Rack Icon */}
              <g transform="translate(-14, -20)">
                <rect
                  x="0"
                  y="0"
                  width="28"
                  height="9.5"
                  rx="2.2"
                  fill="none"
                  stroke="var(--sim-server-text)"
                  strokeWidth="1.9"
                />
                <circle cx="5.5" cy="4.75" r="1.4" fill="var(--sim-server-text)" />
                <line
                  x1="15.5"
                  y1="4.75"
                  x2="22"
                  y2="4.75"
                  stroke="var(--sim-server-text)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <rect
                  x="0"
                  y="12.5"
                  width="28"
                  height="9.5"
                  rx="2.2"
                  fill="none"
                  stroke="var(--sim-server-text)"
                  strokeWidth="1.9"
                />
                <circle cx="5.5" cy="17.25" r="1.4" fill="var(--sim-server-text)" />
                <line
                  x1="15.5"
                  y1="17.25"
                  x2="22"
                  y2="17.25"
                  stroke="var(--sim-server-text)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </g>

              <text
                x="0"
                y="21"
                fontSize="16"
                fontWeight="700"
                textAnchor="middle"
                fill="var(--sim-server-text)"
              >
                {srv.label}
              </text>
              <text
                x="0"
                y="38"
                fontSize="15.5"
                fontWeight="700"
                textAnchor="middle"
                fill="var(--sim-server-text)"
              >
                Server
              </text>
              </g>
            </g>

            {/* Floating Utilization Pill above Primary Server */}
            {sIdx === 0 && (
              <g transform={`translate(${srv.cx - 60}, ${srv.cy - 68})`}>
                {theme === 'light' && (
                  <rect x="0" y="2.5" width="120" height="27" rx="13.5" fill="#26221F" />
                )}
                <rect
                  x="0"
                  y="0"
                  width="120"
                  height="27"
                  rx="13.5"
                  fill="var(--sim-pill-bg)"
                  stroke={pillBorder}
                  strokeWidth={theme === 'light' ? 1.8 : 1.2}
                />
                <g
                  transform="translate(11, 7.5)"
                  stroke="var(--text-secondary)"
                  fill="none"
                  strokeWidth="1.4"
                >
                  <circle cx="6" cy="6" r="3" />
                  <path
                    d="M 6 0.8 L 6 2.5 M 6 9.5 L 6 11.2 M 0.8 6 L 2.5 6 M 9.5 6 L 11.2 6 M 2.3 2.3 L 3.5 3.5 M 8.5 8.5 L 9.7 9.7 M 9.7 2.3 L 8.5 3.5 M 3.5 8.5 L 2.3 9.7"
                    strokeLinecap="round"
                  />
                </g>
                <rect x="29" y="9.2" width="46" height="8.5" rx="4.25" fill="var(--bg-inset)" />
                <rect
                  x="29"
                  y="9.2"
                  width={Math.max(5, (46 * animatedUtil) / 100)}
                  height="8.5"
                  rx="4.25"
                  fill={utilColor}
                />
                <text
                  x="96"
                  y="17.5"
                  fontSize="11.5"
                  fontWeight="700"
                  textAnchor="middle"
                  fill="var(--sim-pill-text)"
                >
                  {util}%
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Independent circular green impact ripples at user arrival */}
      <g pointerEvents="none">
        {impactRipples
          .filter((r) => r.side === 'user')
          .map((r) => {
            const eased = 1 - Math.pow(1 - r.progress, 2.2);
            const radius = 4 + eased * 18;
            const opacity = Math.max(0, (1 - eased) * 0.92);
            return (
              <circle
                key={`rip-${r.id}`}
                cx={linkStart.x}
                cy={linkStart.y}
                r={radius}
                fill="none"
                stroke={userRippleStroke}
                strokeWidth="2"
                strokeOpacity={opacity}
              />
            );
          })}
      </g>
    </svg>

      {hoverCard ? (
        <div
          className="sim-tubelight-card"
          style={{ ['--tube-color' as string]: hoverCard.accent }}
          role="status"
          aria-live="polite"
        >
          <div className="sim-tubelight-bar" />
          <div className="sim-tubelight-header">
            <span className="sim-tubelight-title">{hoverCard.title}</span>
            <span className="sim-tubelight-badge">{hoverCard.badge}</span>
          </div>
          <p className="sim-tubelight-body">{hoverCard.body}</p>
        </div>
      ) : (
        <div className="sim-hover-hint">Hover any node (App Server, Users, Link) to inspect</div>
      )}
    </div>
  );
};
