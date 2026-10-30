import React from 'react';
import { t } from '../utils';
import { X, Languages } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  lang: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, lang }) => {
  return (
    <div className="control-group search-control-group" style={{ flexGrow: 1, minWidth: '250px', position: 'relative' }}>
      <label className="search-label">
        {t('searchLabel', lang)}
        <span className="search-hint">
          <Languages size={12} />
          {t('searchHint', lang)}
        </span>
      </label>
      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          className="search-bar" 
          placeholder={t('searchPlaceholder', lang)} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', paddingRight: searchQuery ? '2.5rem' : '1.25rem' }}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem',
            }}
            title="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
