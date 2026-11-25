import React from 'react';
import { X, CheckCircle2, Trophy } from 'lucide-react';
import { ALL_LESSONS, COURSE_CATEGORIES } from '../../data/courseData';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedLessonIds: string[];
  onSelectLesson: (lessonId: string) => void;
  onResetProgress?: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  onClose,
  completedLessonIds,
  onSelectLesson,
  onResetProgress,
}) => {
  if (!isOpen) return null;

  const pct = Math.round((completedLessonIds.length / ALL_LESSONS.length) * 100);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Course progress summary"
    >
      <div className="modal-panel" style={{ padding: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Trophy size={18} style={{ color: 'var(--amber-text)' }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Course Progress</span>
          </div>
          <button
            type="button"
            className="icon-pill-btn"
            style={{ height: 28, padding: '0 8px' }}
            onClick={onClose}
            aria-label="Close progress modal"
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 9,
            backgroundColor: 'var(--bg-inset)',
            border: '1px solid var(--border-card)',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            <span>
              {completedLessonIds.length} of {ALL_LESSONS.length} lessons completed
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {onResetProgress && completedLessonIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onResetProgress();
                    onClose();
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Reset progress
                </button>
              )}
              <span style={{ color: 'var(--green-text)' }}>{pct}%</span>
            </div>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-strong)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: 'var(--green-text)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div style={{ overflowY: 'auto', maxHeight: '46vh', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {COURSE_CATEGORIES.map((cat) => {
            const done = cat.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
            return (
              <div
                key={cat.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-inset)',
                  border: '1px solid var(--border-card)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  <span>{cat.title}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {done}/{cat.lessons.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cat.lessons.map((l) => {
                    const isDone = completedLessonIds.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          onSelectLesson(l.id);
                          onClose();
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10.5,
                          padding: '3px 7px',
                          borderRadius: 5,
                          border: '1px solid var(--border-strong)',
                          backgroundColor: isDone ? 'var(--green-bg)' : 'var(--bg-panel)',
                          color: isDone ? 'var(--green-text)' : 'var(--text-secondary)',
                        }}
                      >
                        {isDone && <CheckCircle2 size={11} />}
                        {l.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
