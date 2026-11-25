import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  BarChart2,
  ListChecks,
  RotateCcw,
  Pause,
  Play,
  Activity,
  Cpu,
  Gauge,
} from 'lucide-react';
import {
  CourseCategory,
  LanguageCode,
  Lesson,
  LessonStep,
  MetricSeverity,
  ThemeMode,
} from '../../types/course';
import { UI_LABELS } from '../../data/viewsData';
import { IsometricSimulation } from '../Simulation/IsometricSimulation';
import { LatencyCurveChart } from '../Simulation/LatencyCurveChart';
import { LessonProgress } from '../LessonProgress/LessonProgress';

interface MainContentProps {
  category: CourseCategory;
  lesson: Lesson;
  lessonIndexInCategory: number;
  currentStepIndex: number;
  currentStep: LessonStep;
  onSelectStep: (idx: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  replayKey: number;
  onReplay: () => void;
  theme: ThemeMode;
  language: LanguageCode;
}

function severityForLatency(label: string): MetricSeverity {
  if (label.includes('s') && !label.includes('ms')) return 'danger';
  const num = parseInt(label, 10);
  if (!Number.isNaN(num)) {
    if (num >= 500) return 'danger';
    if (num >= 180) return 'warn';
  }
  return 'neutral';
}

function severityForUtil(util: number): MetricSeverity {
  if (util >= 85) return 'danger';
  if (util >= 65) return 'warn';
  return 'good';
}

function parseMetric(label: string): { num: number; decimals: number; suffix: string; hasComma: boolean } | null {
  const m = label.trim().match(/^([\d,]+(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const rawNum = m[1];
  const hasComma = rawNum.includes(',');
  const num = parseFloat(rawNum.replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  const dotIdx = rawNum.indexOf('.');
  const decimals = dotIdx >= 0 ? rawNum.length - dotIdx - 1 : 0;
  return { num, decimals, suffix: m[2] ?? '', hasComma };
}

const AnimatedMetricValue: React.FC<{ label: string }> = ({ label }) => {
  const parsed = parseMetric(label);
  const [displayText, setDisplayText] = useState(label);
  const prevNumRef = useRef<number | null>(parsed ? parsed.num : null);

  useEffect(() => {
    const target = parseMetric(label);
    if (!target) {
      setDisplayText(label);
      prevNumRef.current = null;
      return;
    }

    const startNum = prevNumRef.current ?? target.num;
    const endNum = target.num;
    if (startNum === endNum) {
      setDisplayText(label);
      return;
    }

    const duration = 480;
    let startTime: number | null = null;
    let rafId: number;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = startNum + (endNum - startNum) * eased;

      if (t >= 1) {
        prevNumRef.current = endNum;
        setDisplayText(label);
        return;
      }

      const formatted =
        target.decimals > 0
          ? cur.toFixed(target.decimals)
          : target.hasComma
          ? Math.round(cur).toLocaleString()
          : `${Math.round(cur)}`;
      setDisplayText(`${formatted}${target.suffix}`);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [label]);

  return <>{displayText}</>;
};

export const MainContent: React.FC<MainContentProps> = ({
  category,
  lesson,
  lessonIndexInCategory,
  currentStepIndex,
  currentStep,
  onSelectStep,
  isPaused,
  onTogglePause,
  replayKey,
  onReplay,
  theme,
  language,
}) => {
  const labels = UI_LABELS[language];
  const sim = currentStep.simulation;

  const p50Severity = severityForLatency(sim.p50Label);
  const p99Severity = severityForLatency(sim.p99Label);
  const utilSeverity = severityForUtil(sim.utilization);

  return (
    <main className="main-card">
      {/* Header Row: Breadcrumb + Meta Badges */}
      <div className="lesson-header-top">
        <div className="breadcrumb">
          <span>{category.title}</span>
          <span className="breadcrumb-sep">/</span>
          <span>
            Lesson {lessonIndexInCategory + 1} of {category.lessons.length}
          </span>
        </div>

        <div className="lesson-badges">
          <span className="meta-badge amber">
            <Clock size={12} />
            {lesson.duration}
          </span>
          <span className="meta-badge green">
            <BarChart2 size={12} />
            {lesson.difficulty}
          </span>
          <span className="meta-badge purple">
            <ListChecks size={12} />
            {lesson.steps.length} steps
          </span>
        </div>
      </div>

      {/* Title & Subtitle */}
      <h1 className="lesson-heading">{lesson.title}</h1>
      <p className="lesson-subtitle">{lesson.description}</p>

      {/* Metrics Strip + Simulation Controls */}
      <div className="metrics-controls-row">
        <div className="metrics-strip">
          <div className={`metric-card severity-${p50Severity}`}>
            <div className="metric-label">
              <Clock size={10} />
              <span>P50 LATENCY</span>
            </div>
            <div className="metric-value"><AnimatedMetricValue label={sim.p50Label} /></div>
          </div>

          <div className={`metric-card severity-${p99Severity}`}>
            <div className="metric-label">
              <Gauge size={10} />
              <span>P99 LATENCY</span>
            </div>
            <div className="metric-value"><AnimatedMetricValue label={sim.p99Label} /></div>
          </div>

          <div className="metric-card severity-neutral">
            <div className="metric-label">
              <Activity size={10} />
              <span>THROUGHPUT</span>
            </div>
            <div className="metric-value"><AnimatedMetricValue label={sim.throughputLabel} /></div>
          </div>

          <div className={`metric-card severity-${utilSeverity}`}>
            <div className="metric-label">
              <Cpu size={10} />
              <span>UTILIZATION</span>
            </div>
            <div className="metric-value"><AnimatedMetricValue label={sim.utilizationLabel} /></div>
          </div>
        </div>

        <div className="sim-controls">
          <button
            type="button"
            className="tactile-btn"
            onClick={onReplay}
            title="Restart animation (R)"
          >
            <RotateCcw size={13} />
            <span>{labels.replay}</span>
          </button>

          <button
            type="button"
            className={`tactile-btn ${isPaused ? 'primary' : ''}`}
            onClick={onTogglePause}
            title={isPaused ? 'Resume animation (Space)' : 'Pause animation (Space)'}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            <span>{isPaused ? labels.resume : labels.pause}</span>
          </button>
        </div>
      </div>

      {/* Central Isometric Simulation Stage */}
      <div className="sim-stage-wrap">
        {sim.showChart !== false && (
          <LatencyCurveChart
            utilization={sim.utilization}
            theme={theme}
            transitionKey={`${lesson.id}-${currentStepIndex}-${replayKey}`}
            isPaused={isPaused}
          />
        )}
        <IsometricSimulation
          config={sim}
          isPaused={isPaused}
          replayKey={replayKey}
          theme={theme}
          transitionKey={`${lesson.id}-${currentStepIndex}-${replayKey}`}
          stepInfo={{
            stepNumber: currentStep.number,
            stepHeading: currentStep.heading,
            stepTag: currentStep.tag,
            lessonTitle: lesson.title,
          }}
        />
      </div>

      {/* Simulation Legend */}
      <div className="sim-legend" aria-label="Simulation particle legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#E86156' }} />
          <span>request</span>
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#7EB865' }} />
          <span>response</span>
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#E5A93E' }} />
          <span>slow request</span>
        </span>
        <span className="legend-item">
          <span
            className="legend-dot"
            style={{
              backgroundColor: '#E5A93E',
              boxShadow: '0 0 0 2px rgba(229, 169, 62, 0.28)',
            }}
          />
          <span>waiting in queue</span>
        </span>
      </div>

      {/* Bottom Step Timeline */}
      <LessonProgress
        steps={lesson.steps}
        currentStepIndex={currentStepIndex}
        onSelectStep={onSelectStep}
        language={language}
      />
    </main>
  );
};
