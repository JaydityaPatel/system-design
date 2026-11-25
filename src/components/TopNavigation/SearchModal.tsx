import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import { ALL_LESSONS, COURSE_CATEGORIES } from '../../data/courseData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (lessonId: string) => void;
  completedLessonIds: string[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLesson,
  completedLessonIds,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_LESSONS.slice(0, 12);
    return ALL_LESSONS.filter(
      (lesson) =>
        lesson.title.toLowerCase().includes(q) ||
        lesson.description.toLowerCase().includes(q) ||
        lesson.learningObjectives.some((obj) => obj.toLowerCase().includes(q)) ||
        lesson.steps.some(
          (s) =>
            s.heading.toLowerCase().includes(q) ||
            s.shortLabel.toLowerCase().includes(q)
        )
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const getCategoryTitle = (catId: string) =>
    COURSE_CATEGORIES.find((c) => c.id === catId)?.title ?? catId;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, results.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectLesson(results[selectedIndex].id);
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search lessons and concepts"
    >
      <div className="modal-panel" onKeyDown={handleKeyDown}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 40 lessons, concepts (e.g., p99, hockey stick, caching)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            className="icon-pill-btn"
            style={{ height: 26, padding: '0 7px' }}
            onClick={onClose}
            aria-label="Close search"
          >
            <X size={13} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: 8, maxHeight: '55vh' }}>
          {results.length === 0 ? (
            <div
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 12,
              }}
            >
              No lessons matched "{query}". Try "latency", "sharding", or "rate".
            </div>
          ) : (
            results.map((lesson, idx) => {
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => {
                    onSelectLesson(lesson.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '9px 11px',
                    borderRadius: 8,
                    textAlign: 'left',
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                    border: isSelected
                      ? '1px solid var(--border-strong)'
                      : '1px solid transparent',
                    marginBottom: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {isCompleted ? (
                      <CheckCircle2 size={15} style={{ color: 'var(--green-text)', flexShrink: 0 }} />
                    ) : (
                      <FileText size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lesson.title}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        {getCategoryTitle(lesson.categoryId)} · {lesson.duration} · {lesson.difficulty}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </button>
              );
            })
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 10.5,
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-inset)',
          }}
        >
          <span>↑ ↓ navigate · Enter open · Esc close</span>
          <span>{results.length} shown</span>
        </div>
      </div>
    </div>
  );
};
