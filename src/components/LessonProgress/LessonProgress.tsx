import React from 'react';
import { LessonStep, LanguageCode } from '../../types/course';
import { UI_LABELS } from '../../data/viewsData';

interface LessonProgressProps {
  steps: LessonStep[];
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  language: LanguageCode;
}

export const LessonProgress: React.FC<LessonProgressProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
  language,
}) => {
  const labels = UI_LABELS[language];

  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <span className="timeline-title">{labels.inThisLesson}</span>
        <span className="timeline-counter">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
      </div>

      <div className="timeline-track" role="tablist" aria-label="Lesson steps">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;

          return (
            <button
              key={step.number}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`timeline-step-btn ${isCompleted ? 'completed' : ''} ${
                isActive ? 'active' : ''
              }`}
              onClick={() => onSelectStep(idx)}
            >
              <span className="step-circle">{step.number}</span>
              <span className="step-label">{step.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
