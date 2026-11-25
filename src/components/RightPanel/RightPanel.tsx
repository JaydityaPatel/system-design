import React from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { LanguageCode, Lesson, LessonStep } from '../../types/course';
import { UI_LABELS } from '../../data/viewsData';

interface RightPanelProps {
  lesson: Lesson;
  currentStepIndex: number;
  currentStep: LessonStep;
  onPrevStep: () => void;
  onNextStep: () => void;
  checkedObjectives: number[];
  onToggleObjective: (idx: number) => void;
  language: LanguageCode;
}

function renderFormattedText(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*.*?\*\*|\*[^*]+?\*|`.*?`)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={idx}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return <em key={idx}>{token.slice(1, -1)}</em>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={idx}
          style={{
            padding: '1px 5px',
            borderRadius: 4,
            backgroundColor: 'var(--bg-inset)',
            border: '1px solid var(--border-card)',
            fontSize: '0.92em',
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

export const RightPanel: React.FC<RightPanelProps> = ({
  lesson,
  currentStepIndex,
  currentStep,
  onPrevStep,
  onNextStep,
  checkedObjectives,
  onToggleObjective,
  language,
}) => {
  const labels = UI_LABELS[language];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex >= lesson.steps.length - 1;
  const nextStep = !isLast ? lesson.steps[currentStepIndex + 1] : null;

  return (
    <aside className="right-panel" aria-label="Step explanation and checklist">
      <div className="right-panel-scroll">
        <div key={`${lesson.id}-${currentStep.number}`} className="step-content-enter">
          <div className="step-meta-row">
            <span className="step-indicator">
              STEP {currentStep.number} / {lesson.steps.length}
            </span>
            <span className={`tag-badge ${currentStep.tag}`}>{currentStep.tag}</span>
          </div>

          <h2 className="step-heading">{currentStep.heading}</h2>

          {currentStep.paragraphs.map((p, idx) => (
            <p key={idx} className="step-paragraph">
              {renderFormattedText(p)}
            </p>
          ))}

          {currentStep.callout && (() => {
            const isIdea = currentStep.callout.title.toUpperCase() !== 'WATCH OUT';
            return (
              <div className={`callout-box ${isIdea ? 'idea' : ''}`}>
                {isIdea ? (
                  <Sparkles
                    size={15}
                    style={{ color: 'var(--purple-text)', flexShrink: 0, marginTop: 2 }}
                  />
                ) : (
                  <AlertTriangle
                    size={16}
                    style={{ color: 'var(--coral-text)', flexShrink: 0, marginTop: 2 }}
                  />
                )}
                <div>
                  <span className="callout-title">{currentStep.callout.title}</span>
                  <span>{currentStep.callout.body}</span>
                </div>
              </div>
            );
          })()}

          <div>
            <div className="what-changed-title">{labels.whatChanged}</div>
            <ul className="what-changed-list">
              {currentStep.whatChanged.map((item, idx) => (
                <li key={idx} className="what-changed-item">
                  <span className="delta-tilde">~</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Previous & Next Step Controls */}
      <div className="right-panel-nav">
        <div className="nav-buttons-row">
          <button
            type="button"
            className="tactile-btn"
            onClick={onPrevStep}
            disabled={isFirst}
          >
            <ArrowLeft size={13} />
            <span>{labels.back}</span>
          </button>

          <button
            type="button"
            className="tactile-btn primary nav-next-btn"
            onClick={onNextStep}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {nextStep ? `Next: ${nextStep.shortLabel}` : 'Complete Lesson'}
            </span>
            <ArrowRight size={13} style={{ flexShrink: 0 }} />
          </button>
        </div>

        <div className="shortcut-hint">
          <kbd className="shortcut-kbd">←</kbd>
          <kbd className="shortcut-kbd">→</kbd>
          <span>step ·</span>
          <kbd className="shortcut-kbd">R</kbd>
          <span>replay ·</span>
          <kbd className="shortcut-kbd">Space</kbd>
          <span>pause</span>
        </div>
      </div>

      {/* Learning Objectives Checklist */}
      <div className="learn-checklist-box">
        <div className="checklist-title">{labels.youllLearn}</div>
        <div className="checklist-items">
          {lesson.learningObjectives.map((obj, idx) => {
            const isChecked = checkedObjectives.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                className={`checklist-item ${isChecked ? 'checked' : ''}`}
                onClick={() => onToggleObjective(idx)}
              >
                <span className="custom-checkbox">
                  {isChecked && <Check size={10} strokeWidth={3} />}
                </span>
                <span>{obj}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
