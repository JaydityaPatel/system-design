export type NavSection = 'learn' | 'practice' | 'design-lab' | 'cheatsheets';

export type ThemeMode = 'dark' | 'light';

export type LanguageCode = 'EN' | 'ES' | 'FR' | 'DE' | 'JA';

export type StepTag = 'SETUP' | 'PROBLEM' | 'CONCEPT' | 'SOLUTION' | 'RECAP';

export type MetricSeverity = 'neutral' | 'good' | 'warn' | 'danger';

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  severity: MetricSeverity;
}

export interface SimulationConfig {
  usersCount: number;
  usersLabel: string;
  utilization: number; // 0-100
  queueCount: number;
  serverCount: number;
  fanOutCount: number;
  linkLength: 'normal' | 'long';
  batchMode: boolean;
  p50Label: string;
  p99Label: string;
  throughputLabel: string;
  utilizationLabel: string;
  particleSpeed: number;
  slowRatio: number; // 0-1
  diagramLabel?: string;
  showChart?: boolean;
  serverScale?: number;
}

export interface LessonStep {
  number: number;
  shortLabel: string;
  heading: string;
  tag: StepTag;
  paragraphs: string[];
  callout?: {
    title: string;
    body: string;
  };
  whatChanged: string[];
  simulation: SimulationConfig;
}

export interface Lesson {
  id: string;
  categoryId: string;
  title: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  learningObjectives: string[];
  defaultCheckedIndices?: number[];
  defaultStepIndex?: number;
  steps: LessonStep[];
}

export interface CourseCategory {
  id: string;
  number: string;
  title: string;
  folderColor: string;
  lessons: Lesson[];
}
