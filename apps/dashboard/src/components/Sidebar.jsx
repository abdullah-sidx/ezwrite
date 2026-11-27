import { APP_INFO, NAV_ITEMS } from '@ezwrite/core';
import { HomeIcon, MicIcon, SettingsIcon, SparklesIcon } from './Icons.jsx';

const NAV_ICONS = {
  dashboard: HomeIcon,
  'voice-typing': MicIcon,
  'smart-writing': SparklesIcon,
  settings: SettingsIcon,
};

export default function Sidebar({ activeView, onSelectView }) {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          Ez
        </div>
        <div>
          <div className="brand-name">{APP_INFO.name}</div>
          <div className="brand-tagline">{APP_INFO.tagline}</div>
        </div>
      </div>

      <nav className="nav-list" aria-label="EzWrite sections">
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.id] || HomeIcon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectView(item.id)}
            >
              <span className="nav-icon">
                <Icon />
              </span>
              <span className="nav-text">
                <span className="nav-label">{item.label}</span>
                <span className="nav-desc">{item.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="env-pill">
          <span className="status-dot" aria-hidden="true" />
          Local Mode • No API Key
        </div>
        <p className="sidebar-note">
          Never auto-sends or auto-submits text. You review and edit everything first.
        </p>
      </div>
    </aside>
  );
}
