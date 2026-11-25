import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  CheckCircle2,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { COURSE_CATEGORIES, ALL_LESSONS } from '../../data/courseData';
import { UI_LABELS } from '../../data/viewsData';
import { LanguageCode } from '../../types/course';

interface SidebarProps {
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  expandedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  completedLessonIds: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenProgress: () => void;
  language: LanguageCode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeLessonId,
  onSelectLesson,
  expandedCategoryIds,
  onToggleCategory,
  completedLessonIds,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenProgress,
  language,
}) => {
  const labels = UI_LABELS[language];

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      aria-label="Course curriculum navigation"
    >
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-title-group">
            <Folder size={14} style={{ color: 'var(--text-secondary)' }} />
            <span>{labels.course}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isCollapsed && (
            <span className="sidebar-count">
              {ALL_LESSONS.length} {labels.lessons}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              color: 'var(--text-muted)',
              display: 'inline-flex',
              padding: 3,
              borderRadius: 4,
            }}
          >
            {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>
      </div>

      {!isCollapsed ? (
        <>
          <div className="sidebar-tree">
            {COURSE_CATEGORIES.map((category) => {
              const isExpanded = expandedCategoryIds.includes(category.id);
              const completedInCat = category.lessons.filter((l) =>
                completedLessonIds.includes(l.id)
              ).length;

              return (
                <div key={category.id} className="category-block">
                  <button
                    type="button"
                    className="category-btn"
                    onClick={() => onToggleCategory(category.id)}
                    aria-expanded={isExpanded}
                  >
                    <span className="category-btn-left">
                      {isExpanded ? (
                        <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      ) : (
                        <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      )}
                      <Folder
                        size={14}
                        fill={category.folderColor}
                        stroke={category.folderColor}
                        style={{ flexShrink: 0 }}
                      />
                      <span className="category-name">{category.title}</span>
                    </span>
                    <span className="category-fraction">
                      {completedInCat}/{category.lessons.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="lessons-list">
                      {category.lessons.map((lesson) => {
                        const isActive = lesson.id === activeLessonId;
                        const isDone = completedLessonIds.includes(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            className={`lesson-item ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              onSelectLesson(lesson.id);
                              onCloseMobile();
                            }}
                          >
                            {isActive ? (
                              <FileText
                                size={13}
                                style={{ flexShrink: 0, color: 'var(--olive-text)' }}
                              />
                            ) : isDone ? (
                              <CheckCircle2
                                size={13}
                                style={{ flexShrink: 0, color: 'var(--green-text)' }}
                              />
                            ) : (
                              <span
                                style={{
                                  width: 11,
                                  height: 11,
                                  borderRadius: '50%',
                                  border: '1.5px solid var(--border-strong)',
                                  flexShrink: 0,
                                  marginLeft: 1,
                                  marginRight: 1,
                                }}
                              />
                            )}
                            <span className="lesson-title">{lesson.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <button
              type="button"
              className="progress-btn"
              onClick={onOpenProgress}
              title="View full course progress"
            >
              <span>{labels.progress}</span>
              <span className="progress-fraction">
                {completedLessonIds.length} / {ALL_LESSONS.length}
                <ChevronRight size={12} />
              </span>
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 12,
            gap: 10,
          }}
        >
          {COURSE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onToggleCollapse();
                if (!expandedCategoryIds.includes(cat.id)) {
                  onToggleCategory(cat.id);
                }
              }}
              title={cat.title}
              style={{ padding: 5, borderRadius: 6 }}
            >
              <Folder size={15} fill={cat.folderColor} stroke={cat.folderColor} />
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};
