import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import {
  ALL_LESSONS,
  COURSE_CATEGORIES,
  DEFAULT_ACTIVE_LESSON_ID,
  INITIAL_COMPLETED_LESSON_IDS,
} from './data/courseData';
import { LanguageCode, NavSection, ThemeMode } from './types/course';
import { TopNavigation } from './components/TopNavigation/TopNavigation';
import { SearchModal } from './components/TopNavigation/SearchModal';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ProgressModal } from './components/Sidebar/ProgressModal';
import { MainContent } from './components/MainContent/MainContent';
import { RightPanel } from './components/RightPanel/RightPanel';
import { PracticeView } from './components/Views/PracticeView';
import { DesignLabView } from './components/Views/DesignLabView';
import { CheatsheetsView } from './components/Views/CheatsheetsView';
import { ClosedOverview } from './components/Views/ClosedOverview';

const STORAGE_KEYS = {
  completedLessons: 'sdr_completed_lessons_v1',
  activeLesson: 'sdr_active_lesson_v1',
  stepByLesson: 'sdr_step_by_lesson_v1',
  checkedByLesson: 'sdr_checked_by_lesson_v1',
} as const;

const VALID_LESSON_IDS = new Set(ALL_LESSONS.map((l) => l.id));

function readStorageJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorageJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

function resolveInitialLessonId(completedIds: string[]): string {
  if (completedIds.length === 0) {
    return DEFAULT_ACTIVE_LESSON_ID;
  }
  const savedActive = readStorageJson<string | null>(STORAGE_KEYS.activeLesson, null);
  if (savedActive && VALID_LESSON_IDS.has(savedActive) && !completedIds.includes(savedActive)) {
    return savedActive;
  }
  const nextUncompleted = ALL_LESSONS.find((l) => !completedIds.includes(l.id));
  return nextUncompleted?.id ?? ALL_LESSONS[ALL_LESSONS.length - 1]?.id ?? DEFAULT_ACTIVE_LESSON_ID;
}

export const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavSection>('learn');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [language, setLanguage] = useState<LanguageCode>('EN');

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    const saved = readStorageJson<unknown>(
      STORAGE_KEYS.completedLessons,
      INITIAL_COMPLETED_LESSON_IDS
    );
    if (!Array.isArray(saved)) return INITIAL_COMPLETED_LESSON_IDS;
    return saved.filter((id): id is string => typeof id === 'string' && VALID_LESSON_IDS.has(id));
  });

  const [activeLessonId, setActiveLessonId] = useState<string>(() =>
    resolveInitialLessonId(completedLessonIds)
  );
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>(() => {
    const initialLesson =
      ALL_LESSONS.find((l) => l.id === activeLessonId) ?? ALL_LESSONS[0];
    return [initialLesson?.categoryId ?? 'foundations'];
  });

  // Per-lesson step index
  const [stepByLesson, setStepByLesson] = useState<Record<string, number>>(() => {
    const saved = readStorageJson<Record<string, number>>(STORAGE_KEYS.stepByLesson, {});
    const initial: Record<string, number> = {};
    for (const l of ALL_LESSONS) {
      const savedStep = saved[l.id];
      initial[l.id] =
        typeof savedStep === 'number' && Number.isFinite(savedStep)
          ? Math.max(0, Math.min(l.steps.length - 1, savedStep))
          : (l.defaultStepIndex ?? 0);
    }
    return initial;
  });

  // Per-lesson learning objectives checklist state
  const [checkedByLesson, setCheckedByLesson] = useState<Record<string, number[]>>(() => {
    const saved = readStorageJson<Record<string, number[]>>(STORAGE_KEYS.checkedByLesson, {});
    const initial: Record<string, number[]> = {};
    for (const l of ALL_LESSONS) {
      const savedChecked = saved[l.id];
      initial[l.id] = Array.isArray(savedChecked)
        ? savedChecked.filter((idx) => typeof idx === 'number')
        : (l.defaultCheckedIndices ?? [0]);
    }
    return initial;
  });

  const [isPaused, setIsPaused] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isLessonClosed, setIsLessonClosed] = useState(false);

  // Sync theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist lesson progress and active position
  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.completedLessons, completedLessonIds);
  }, [completedLessonIds]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.activeLesson, activeLessonId);
  }, [activeLessonId]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.stepByLesson, stepByLesson);
  }, [stepByLesson]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.checkedByLesson, checkedByLesson);
  }, [checkedByLesson]);

  const handleToggleTheme = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      type ViewTransitionDoc = Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      };
      const doc = document as ViewTransitionDoc;

      if (doc.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const transition = doc.startViewTransition(() => {
          flushSync(() => {
            setTheme(nextTheme);
          });
          document.documentElement.setAttribute('data-theme', nextTheme);
        });

        transition.ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 620,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        });
      } else {
        setTheme(nextTheme);
      }
    },
    [theme]
  );

  const activeLesson = useMemo(
    () => ALL_LESSONS.find((l) => l.id === activeLessonId) ?? ALL_LESSONS[0],
    [activeLessonId]
  );

  const activeCategory = useMemo(
    () =>
      COURSE_CATEGORIES.find((c) => c.id === activeLesson.categoryId) ??
      COURSE_CATEGORIES[0],
    [activeLesson]
  );

  const lessonIndexInCategory = useMemo(
    () => Math.max(0, activeCategory.lessons.findIndex((l) => l.id === activeLesson.id)),
    [activeCategory, activeLesson]
  );

  const currentStepIndex = Math.min(
    stepByLesson[activeLesson.id] ?? 0,
    activeLesson.steps.length - 1
  );
  const currentStep = activeLesson.steps[currentStepIndex];

  const handleSelectLesson = useCallback((lessonId: string) => {
    const target = ALL_LESSONS.find((l) => l.id === lessonId);
    if (!target) return;
    setActiveLessonId(lessonId);
    setActiveNav('learn');
    setIsLessonClosed(false);
    setIsPaused(false);
    setReplayKey((k) => k + 1);
    setExpandedCategoryIds((prev) =>
      prev.includes(target.categoryId) ? prev : [...prev, target.categoryId]
    );
  }, []);

  const handleToggleCategory = useCallback((categoryId: string) => {
    setExpandedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const handleSelectStep = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(activeLesson.steps.length - 1, idx));
      setStepByLesson((prev) => ({ ...prev, [activeLesson.id]: clamped }));
      setReplayKey((k) => k + 1);
    },
    [activeLesson]
  );

  const handlePrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      handleSelectStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, handleSelectStep]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < activeLesson.steps.length - 1) {
      handleSelectStep(currentStepIndex + 1);
    } else {
      // Mark lesson completed and move to next lesson if available
      setCompletedLessonIds((prev) =>
        prev.includes(activeLesson.id) ? prev : [...prev, activeLesson.id]
      );
      const flatIndex = ALL_LESSONS.findIndex((l) => l.id === activeLesson.id);
      if (flatIndex >= 0 && flatIndex + 1 < ALL_LESSONS.length) {
        handleSelectLesson(ALL_LESSONS[flatIndex + 1].id);
      }
    }
  }, [currentStepIndex, activeLesson, handleSelectStep, handleSelectLesson]);

  const handleResetProgress = useCallback(() => {
    setCompletedLessonIds([]);
    setActiveLessonId(DEFAULT_ACTIVE_LESSON_ID);
    setExpandedCategoryIds(['foundations']);
    setStepByLesson(() => {
      const reset: Record<string, number> = {};
      for (const l of ALL_LESSONS) {
        reset[l.id] = l.defaultStepIndex ?? 0;
      }
      return reset;
    });
    setCheckedByLesson(() => {
      const reset: Record<string, number[]> = {};
      for (const l of ALL_LESSONS) {
        reset[l.id] = l.defaultCheckedIndices ?? [0];
      }
      return reset;
    });
    setActiveNav('learn');
    setIsLessonClosed(false);
    setReplayKey((k) => k + 1);
  }, []);

  const handleToggleObjective = useCallback(
    (objIdx: number) => {
      setCheckedByLesson((prev) => {
        const current = prev[activeLesson.id] ?? [];
        const updated = current.includes(objIdx)
          ? current.filter((i) => i !== objIdx)
          : [...current, objIdx];
        return { ...prev, [activeLesson.id]: updated };
      });
    },
    [activeLesson.id]
  );

  // Global keyboard shortcuts (Ctrl+K, Left/Right arrows, R replay, Space pause)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsProgressOpen(false);
        setIsMobileSidebarOpen(false);
        return;
      }

      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (isSearchOpen || isProgressOpen || activeNav !== 'learn' || isLessonClosed) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setReplayKey((k) => k + 1);
      } else if (e.key === ' ') {
        if (tag !== 'BUTTON') {
          e.preventDefault();
          setIsPaused((p) => !p);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isSearchOpen,
    isProgressOpen,
    activeNav,
    isLessonClosed,
    handleNextStep,
    handlePrevStep,
  ]);

  return (
    <div className="app-shell">
      <TopNavigation
        activeNav={activeNav}
        onSelectNav={(nav) => {
          setActiveNav(nav);
          if (nav === 'learn') setIsLessonClosed(false);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onSelectLanguage={setLanguage}
        onOpenSearch={() => setIsSearchOpen(true)}
        isLessonClosed={isLessonClosed}
        onToggleCloseLesson={() => {
          setActiveNav('learn');
          setIsLessonClosed((c) => !c);
        }}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((o) => !o)}
      />

      <div className="app-workspace">
        {activeNav === 'learn' && (
          <Sidebar
            activeLessonId={activeLesson.id}
            onSelectLesson={handleSelectLesson}
            expandedCategoryIds={expandedCategoryIds}
            onToggleCategory={handleToggleCategory}
            completedLessonIds={completedLessonIds}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            onOpenProgress={() => setIsProgressOpen(true)}
            language={language}
          />
        )}

        {activeNav === 'learn' && isLessonClosed && (
          <div key="overview" className="view-enter">
            <ClosedOverview
              activeLessonId={activeLesson.id}
              completedLessonIds={completedLessonIds}
              onResumeLesson={handleSelectLesson}
            />
          </div>
        )}

        {activeNav === 'learn' && !isLessonClosed && (
          <div key={`learn-${activeLesson.id}`} className="content-grid view-enter">
            <MainContent
              category={activeCategory}
              lesson={activeLesson}
              lessonIndexInCategory={lessonIndexInCategory}
              currentStepIndex={currentStepIndex}
              currentStep={currentStep}
              onSelectStep={handleSelectStep}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused((p) => !p)}
              replayKey={replayKey}
              onReplay={() => setReplayKey((k) => k + 1)}
              theme={theme}
              language={language}
            />

            <RightPanel
              lesson={activeLesson}
              currentStepIndex={currentStepIndex}
              currentStep={currentStep}
              onPrevStep={handlePrevStep}
              onNextStep={handleNextStep}
              checkedObjectives={checkedByLesson[activeLesson.id] ?? []}
              onToggleObjective={handleToggleObjective}
              language={language}
            />
          </div>
        )}

        {activeNav === 'practice' && (
          <div key="practice" className="view-enter">
            <PracticeView />
          </div>
        )}
        {activeNav === 'design-lab' && (
          <div key="design-lab" className="view-enter">
            <DesignLabView theme={theme} />
          </div>
        )}
        {activeNav === 'cheatsheets' && (
          <div key="cheatsheets" className="view-enter">
            <CheatsheetsView />
          </div>
        )}
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLesson={handleSelectLesson}
        completedLessonIds={completedLessonIds}
      />

      <ProgressModal
        isOpen={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
        completedLessonIds={completedLessonIds}
        onSelectLesson={handleSelectLesson}
        onResetProgress={handleResetProgress}
      />
    </div>
  );
};

export default App;
