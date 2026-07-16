import React from 'react';
import { LANGUAGES } from '../types';
import { t } from '../utils';

interface HeaderProps {
  activeTab: 'Simulator' | 'Database';
  setActiveTab: (tab: 'Simulator' | 'Database') => void;
  lang: string;
  setLang: (lang: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, lang, setLang }) => {
  return (
    <header className="header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2.5rem' }}>{t('title', lang)}</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'Simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('Simulator')}
          >
            {t('tabSimulator', lang)}
          </button>
          <button 
            className={`tab-button ${activeTab === 'Database' ? 'active' : ''}`}
            onClick={() => setActiveTab('Database')}
          >
            {t('tabDatabase', lang)}
          </button>
        </div>
        
        <div className="global-controls">
          <div className="control-group">
            <label>{t('language', lang)}</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
