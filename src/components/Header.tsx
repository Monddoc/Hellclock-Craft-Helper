import React from 'react';
import { LANGUAGES } from '../types';
import { t } from '../utils';

interface HeaderProps {
  lang: string;
  setLang: (lang: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang }) => {
  return (
    <header className="header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2.5rem' }}>{t('title', lang)}</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
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
