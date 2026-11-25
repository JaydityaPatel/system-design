import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Settings2,
  PanelTop,
  FileSpreadsheet,
  Search,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  X,
  Check,
  PanelLeft,
} from 'lucide-react';
import { LanguageCode, NavSection, ThemeMode } from '../../types/course';
import { UI_LABELS } from '../../data/viewsData';

interface TopNavigationProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  theme: ThemeMode;
  onToggleTheme: (e: React.MouseEvent<HTMLButtonElement>) => void;
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onOpenSearch: () => void;
  isLessonClosed: boolean;
  onToggleCloseLesson: () => void;
  onToggleMobileSidebar: () => void;
}

const LANGUAGES: { code: LanguageCode; name: string }[] = [
  { code: 'EN', name: 'English' },
  { code: 'ES', name: 'Español' },
  { code: 'FR', name: 'Français' },
  { code: 'DE', name: 'Deutsch' },
  { code: 'JA', name: '日本語' },
];

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeNav,
  onSelectNav,
  theme,
  onToggleTheme,
  language,
  onSelectLanguage,
  onOpenSearch,
  isLessonClosed,
  onToggleCloseLesson,
  onToggleMobileSidebar,
}) => {
  const [langOpen, setLangOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const labels = UI_LABELS[language];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setAboutOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'learn', label: labels.learn, icon: <BookOpen size={14} /> },
    { id: 'practice', label: labels.practice, icon: <Settings2 size={14} /> },
    { id: 'design-lab', label: labels.designLab, icon: <PanelTop size={14} /> },
    { id: 'cheatsheets', label: labels.cheatsheets, icon: <FileSpreadsheet size={14} /> },
  ];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-pill-btn mobile-sidebar-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle course sidebar"
          title="Toggle course sidebar"
        >
          <PanelLeft size={15} />
        </button>

        <button
          type="button"
          className="brand-btn"
          onClick={() => {
            onSelectNav('learn');
            if (isLessonClosed) onToggleCloseLesson();
          }}
          title="System Design Home"
        >
          {/* Custom System Design node-tree SVG mark */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 6V11M12 11L6.5 16M12 11L17.5 16"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <rect
              x="8.5"
              y="2.5"
              width="7"
              height="4.5"
              rx="1.2"
              fill="#E5A93E"
              stroke="var(--border-tactile)"
              strokeWidth="1.3"
            />
            <rect
              x="2.5"
              y="15.5"
              width="7"
              height="5"
              rx="1.2"
              fill="#7EB865"
              stroke="var(--border-tactile)"
              strokeWidth="1.3"
            />
            <rect
              x="14.5"
              y="15.5"
              width="7"
              height="5"
              rx="1.2"
              fill="#9B86C9"
              stroke="var(--border-tactile)"
              strokeWidth="1.3"
            />
          </svg>
          <span>
            System <span className="brand-design">Design</span>
          </span>
        </button>

        <nav className="nav-tabs" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-tab ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => onSelectNav(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="search-trigger"
          onClick={onOpenSearch}
          title="Search lessons & concepts (Ctrl+K)"
        >
          <span className="search-trigger-left">
            <Search size={13} />
            <span className="search-placeholder">{labels.searchPlaceholder}</span>
          </span>
          <kbd className="kbd-pill">Ctrl K</kbd>
        </button>

        <div className="dropdown-wrap" ref={langRef}>
          <button
            type="button"
            className="icon-pill-btn"
            onClick={() => setLangOpen((prev) => !prev)}
            aria-expanded={langOpen}
            title="Select interface language"
          >
            <Globe size={13} />
            <span>{language}</span>
            <ChevronDown size={12} />
          </button>

          {langOpen && (
            <div className="dropdown-menu" role="menu">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  role="menuitem"
                  className={`dropdown-item ${language === l.code ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectLanguage(l.code);
                    setLangOpen(false);
                  }}
                >
                  <span>
                    {l.code} — {l.name}
                  </span>
                  {language === l.code && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-pill-btn theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          type="button"
          className="icon-pill-btn"
          onClick={onToggleCloseLesson}
          aria-label={isLessonClosed ? 'Resume active lesson' : 'Close current lesson'}
          title={isLessonClosed ? 'Resume active lesson' : 'Close current lesson'}
        >
          <X size={14} />
        </button>

        <div className="dropdown-wrap" ref={aboutRef}>
          <button
            type="button"
            className="attribution-btn"
            onClick={() => setAboutOpen((prev) => !prev)}
            title="Creator attribution & platform info"
          >
            <span className="attribution-text">
              <span className="attribution-label">Designed by</span>
              <span className="attribution-handle">@JaydityaP</span>
            </span>
          </button>

          {aboutOpen && (
            <div className="dropdown-menu" style={{ minWidth: 240, padding: '12px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                System Design Interactive
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Visual engineering guide designed by{' '}
                <strong style={{ color: 'var(--text-primary)' }}>@JaydityaP</strong>. Interactive
                recreation featuring 40 lessons, live isometric queueing simulation, Design Lab, and
                cheatsheets.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
