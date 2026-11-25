import React from 'react';
import { ArrowRight, CheckCircle2, PlayCircle, Folder } from 'lucide-react';
import { ALL_LESSONS, COURSE_CATEGORIES } from '../../data/courseData';

interface ClosedOverviewProps {
  activeLessonId: string;
  completedLessonIds: string[];
  onResumeLesson: (lessonId: string) => void;
}

export const ClosedOverview: React.FC<ClosedOverviewProps> = ({
  activeLessonId,
  completedLessonIds,
  onResumeLesson,
}) => {
  const activeLesson = ALL_LESSONS.find((l) => l.id === activeLessonId) ?? ALL_LESSONS[1];

  return (
    <div className="secondary-view">
      <div className="view-container">
        <div
          className="view-card"
          style={{
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>
              CURRICULUM OVERVIEW
            </div>
            <h1 style={{ margin: '4px 0', fontSize: 20, fontWeight: 700 }}>
              System Design Interactive Course
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
              {completedLessonIds.length} of {ALL_LESSONS.length} lessons completed. Pick any
              lesson below or resume where you left off.
            </p>
          </div>
          <button
            type="button"
            className="tactile-btn primary"
            onClick={() => onResumeLesson(activeLesson.id)}
          >
            <PlayCircle size={14} />
            <span>Resume: {activeLesson.title}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 12,
          }}
        >
          {COURSE_CATEGORIES.map((cat) => (
            <div key={cat.id} className="view-card" style={{ padding: 14 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 12.5 }}>
                  <Folder size={14} fill={cat.folderColor} stroke={cat.folderColor} />
                  <span>{cat.title}</span>
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  {cat.lessons.length} lessons
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {cat.lessons.map((lesson) => {
                  const isDone = completedLessonIds.includes(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      className={`lesson-item ${lesson.id === activeLessonId ? 'active' : ''}`}
                      onClick={() => onResumeLesson(lesson.id)}
                    >
                      {isDone && (
                        <CheckCircle2 size={13} style={{ color: 'var(--green-text)', flexShrink: 0 }} />
                      )}
                      <span className="lesson-title">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
