import React from 'react';
import { Star } from 'lucide-react';
import { t } from '../utils';

interface ControlsBarProps {
  tier: string;
  setTier: (tier: string) => void;
  size: string;
  setSize: (size: string) => void;
  sizesAvailable: string[];
  activeTab: 'Simulator' | 'Database';
  activeCategory: string | null;
  setActiveCategory: (cat: string | null) => void;
  showFavorites: boolean;
  setShowFavorites: (show: boolean) => void;
  lang: string;
  searchBarNode: React.ReactNode;
  isGlobalCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  tier, setTier, size, setSize, sizesAvailable, activeTab,
  activeCategory, setActiveCategory, showFavorites, setShowFavorites, lang, searchBarNode,
  isGlobalCollapsed, onToggleCollapseAll
}) => {
  return (
    <div className="controls">
      <div className="control-group">
        <label>{t('tierRolls', lang)}</label>
        <select value={tier} onChange={(e) => setTier(e.target.value)} style={{ minWidth: '110px' }}>
          <option value="1">{t('tier', lang)} 1</option>
          <option value="2">{t('tier', lang)} 2</option>
          <option value="3">{t('tier', lang)} 3</option>
          <option value="4">{t('tier', lang)} 4</option>
        </select>
      </div>
      
      {activeTab === 'Simulator' && (
        <div className="control-group">
          <label>{t('relicSize', lang)}</label>
          <select value={size} onChange={(e) => setSize(e.target.value)}>
            {sizesAvailable.map(s => {
              const labels: Record<string, string> = {
                Small: 'Small (1x1)',
                Large: 'Large (2x1)',
                Grand: 'Grand (2x2)',
                Exalted: 'Exalted (4x1)'
              };
              return <option key={s} value={s}>{labels[s] || s}</option>
            })}
          </select>
        </div>
      )}
      
      <div className="control-group">
        <label style={{ visibility: 'hidden' }}>Icons</label>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className={`icon-filter-btn ${activeCategory === 'Common' ? 'active common' : ''}`} onClick={() => setActiveCategory(activeCategory === 'Common' ? null : 'Common')} title={t('commonAffixes', lang)}>
            <img src="./assets/icons/IconTool_Tinkering.png" alt="Common" />
          </button>
          <button className={`icon-filter-btn ${activeCategory === 'Special' ? 'active special' : ''}`} onClick={() => setActiveCategory(activeCategory === 'Special' ? null : 'Special')} title={t('rareAffixes', lang)}>
            <img src="./assets/icons/IconTool_GreaterEnhancement.png" alt="Rare" />
          </button>
          <button className={`icon-filter-btn ${activeCategory === 'FuryImbued' ? 'active fury' : ''}`} onClick={() => setActiveCategory(activeCategory === 'FuryImbued' ? null : 'FuryImbued')} title={t('sortByFury', lang)}>
            <img src="./assets/icons/IconTool_Fury.png" alt="Fury Imbued" />
          </button>
          <button className={`icon-filter-btn ${activeCategory === 'FaithImbued' ? 'active faith' : ''}`} onClick={() => setActiveCategory(activeCategory === 'FaithImbued' ? null : 'FaithImbued')} title={t('sortByFaith', lang)}>
            <img src="./assets/icons/IconTool_Faith.png" alt="Faith Imbued" />
          </button>
          <button className={`icon-filter-btn ${activeCategory === 'DisciplineImbued' ? 'active discipline' : ''}`} onClick={() => setActiveCategory(activeCategory === 'DisciplineImbued' ? null : 'DisciplineImbued')} title={t('sortByDiscipline', lang)}>
            <img src="./assets/icons/IconTool_Discipline.png" alt="Discipline Imbued" />
          </button>
          <button className={`icon-filter-btn ${activeCategory === 'Corrupted' ? 'active corrupted' : ''}`} onClick={() => setActiveCategory(activeCategory === 'Corrupted' ? null : 'Corrupted')} title={t('sortByCorrupted', lang)}>
            <img src="./assets/icons/IconTool_Corrupted.png" alt="Corrupted" />
          </button>
        </div>
      </div>

      <div className="control-group">
        <label style={{ visibility: 'hidden' }}>Filter</label>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <button 
            className={`filter-btn ${showFavorites ? 'active' : ''}`}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Star size={18} fill={showFavorites ? 'currentColor' : 'none'} />
            <span>Favorites Only</span>
          </button>

          {activeTab === 'Simulator' && onToggleCollapseAll && (
            <button 
              className="filter-btn"
              onClick={onToggleCollapseAll}
              style={{ width: 'auto', padding: '0 1rem' }}
              title={isGlobalCollapsed ? "Expand All" : "Collapse All"}
            >
              {isGlobalCollapsed ? "Expand All" : "Collapse All"}
            </button>
          )}
        </div>
      </div>

      {searchBarNode}
    </div>
  );
};
