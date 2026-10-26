import { BookOpenText, Clock3, Command, Moon, Sun } from 'lucide-react';

export default function Navbar({ view, onNavigate, completedCount, theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => onNavigate('practice')} aria-label="MindForge home">
        <span className="brand-mark"><Command size={19} strokeWidth={2.4} /></span>
        <span className="brand-name">mindforge<span>.ai</span></span>
      </button>
      <div className="brand-promise">MASTER CONCEPTS. <span>SPEAK WITH AUTHORITY.</span></div>
      <nav className="nav-actions" aria-label="Main navigation">
        <button className={`nav-link ${view !== 'history' ? 'active' : ''}`} onClick={() => onNavigate('practice')} aria-label="Practice" title="Practice" aria-current={view !== 'history' ? 'page' : undefined}>
          <BookOpenText size={16} /> <span>Practice</span>
        </button>
        <button className={`nav-link ${view === 'history' ? 'active' : ''}`} onClick={() => onNavigate('history')} aria-label="Progress" title="Progress" aria-current={view === 'history' ? 'page' : undefined}>
          <Clock3 size={16} /> <span>Progress</span>
          {completedCount > 0 && <span className="nav-count">{completedCount}</span>}
        </button>
        <button className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>
    </header>
  );
}