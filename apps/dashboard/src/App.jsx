import { useEffect, useState } from 'react';
import { APP_INFO, DEFAULT_SETTINGS, NAV_ITEMS } from '@ezwrite/core';
import Sidebar from './components/Sidebar.jsx';
import DashboardOverview from './pages/DashboardOverview.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import SmartWritingPage from './pages/SmartWritingPage.jsx';
import VoiceTypingPage from './pages/VoiceTypingPage.jsx';

const VALID_VIEWS = new Set(NAV_ITEMS.map((item) => item.id));

function getViewFromHash() {
  const raw = window.location.hash.replace(/^#/, '');
  return VALID_VIEWS.has(raw) ? raw : 'dashboard';
}

export default function App() {
  const [activeView, setActiveView] = useState(getViewFromHash);
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS }));

  useEffect(() => {
    function handleHashChange() {
      setActiveView(getViewFromHash());
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function navigateTo(viewId) {
    if (!VALID_VIEWS.has(viewId)) return;
    setActiveView(viewId);
    if (window.location.hash !== `#${viewId}`) {
      window.location.hash = viewId;
    }
  }

  function updateSettings(patch) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function resetSettings() {
    setSettings({ ...DEFAULT_SETTINGS });
  }

  const currentNav = NAV_ITEMS.find((item) => item.id === activeView) || NAV_ITEMS[0];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Sidebar activeView={activeView} onSelectView={navigateTo} />

      <div className="workspace">
        <header className="topbar">
          <div>
            <h1 className="page-title">{currentNav.label}</h1>
            <p className="page-subtitle">{currentNav.description}</p>
          </div>
          <div className="topbar-badges">
            <span className="pill pill-green">{APP_INFO.prototypeStage}</span>
          </div>
        </header>

        <main id="main-content" className="main-content" tabIndex={-1}>
          {activeView === 'dashboard' ? <DashboardOverview onNavigate={navigateTo} /> : null}
          {activeView === 'voice-typing' ? (
            <VoiceTypingPage settings={settings} onUpdateSettings={updateSettings} />
          ) : null}
          {activeView === 'smart-writing' ? <SmartWritingPage settings={settings} /> : null}
          {activeView === 'settings' ? (
            <SettingsPage
              settings={settings}
              onUpdateSettings={updateSettings}
              onResetSettings={resetSettings}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
