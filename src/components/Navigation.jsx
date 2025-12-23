import React, { memo } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff
} from 'lucide-react';

/**
 * Main navigation component
 */
const Navigation = memo(({
  tab,
  setTab,
  theme,
  setTheme,
  lang,
  setLang,
  privacyMode,
  setPrivacyMode,
  onUpdateAll,
  isUpdating,
  t
}) => {
  const tabs = [
    { key: 'overview', label: t.nav_overview },
    { key: 'analysis', label: t.nav_analysis },
    { key: 'perf', label: t.nav_perf },
    { key: 'calendar', label: t.nav_calendar },
    { key: 'brokers', label: t.nav_brokers },
    { key: 'settings', label: t.nav_settings }
  ];
  
  const btnClass = (active) => `
    px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-all whitespace-nowrap
    ${active 
      ? 'bg-blue-600 text-white shadow-md' 
      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }
  `;
  
  const iconBtnClass = `
    w-9 h-9 flex items-center justify-center rounded border 
    hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 
    transition-colors
  `;
  
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="font-bold text-lg flex gap-2 items-center flex-shrink-0">
          <BarChart3 className="text-blue-500" size={24} />
          <span>Portfolio</span>
          <span className="text-blue-500">V 2.0</span>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide mx-4 flex-1 justify-center">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={btnClass(tab === key)}
            >
              <span className="capitalize">{label}</span>
            </button>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 items-center flex-shrink-0">
          {/* Privacy Toggle */}
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`${iconBtnClass} ${privacyMode ? 'text-blue-500' : ''}`}
            title={t.privacy_mode}
          >
            {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          
          {/* Language Toggle */}
          <button
            onClick={() => setLang(l => l === 'sv' ? 'en' : 'sv')}
            className={`${iconBtnClass} text-xs font-bold`}
          >
            {lang.toUpperCase()}
          </button>
          
          {/* Update All Prices */}
          <button
            onClick={onUpdateAll}
            className={iconBtnClass}
            title={t.btn_update_all}
            disabled={isUpdating}
          >
            <RefreshCw 
              size={16} 
              className={isUpdating ? 'animate-spin text-blue-500' : ''} 
            />
          </button>
          
          {/* Theme Toggle - Toggles: light <-> dark */}
          <div className="relative">
            <button
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
              }}
              className={iconBtnClass}
              title={`Tema: ${theme === 'dark' ? 'Mörk' : 'Ljus'}`}
            >
              {theme === 'dark' ? (
                <Sun size={16} className="text-yellow-400" />
              ) : (
                <Moon size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;




