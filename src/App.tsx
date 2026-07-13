import { useState, useEffect } from 'react';

interface TierData { min: number; max: number; }
interface AffixData {
  internalId: number;
  internalName: string;
  nameLocalizations: Record<string, string>;
  descLocalizations: Record<string, string>;
  statLocalizations: Record<string, string>;
  rarity: string;
  blockedSizes: string[];
  tiers: Record<string, TierData>;
}

interface PoolEntry {
  weight: number;
  chance: number;
}

interface SizeData {
  primaryPool: Record<string, PoolEntry>;
  secondaryPool: Record<string, PoolEntry>;
  implicits: Record<string, number>;
}

interface AppData {
  affixes: Record<string, AffixData>;
  sizes: Record<string, SizeData>;
}

const ALL_SIZES = ['Small', 'Large', 'Grand', 'Exalted'];
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
  { code: 'pl', label: 'Polski' },
  { code: 'pt-br', label: 'Português (BR)' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'zh-cn', label: '简体中文' }
];

const formatListDescription = (desc: string, min: number, max: number, statName: string) => {
  if (!desc) return { __html: '' };
  let is1Value = desc.includes('<style="TooltipValue">{1}</style>');
  let formatted = desc.replace(/<style="[^"]*">/g, '').replace(/<\/style>/g, '');
  
  let minF = min < 1 ? (min * 100).toFixed(1) + '%' : min.toFixed(1);
  let maxF = max < 1 ? (max * 100).toFixed(1) + '%' : max.toFixed(1);
  const rangeStr = `<span class="affix-roll">[${minF} - ${maxF}]</span>`;

  if (is1Value) {
    formatted = formatted.replace('{1}', rangeStr).replace('{0}', statName);
  } else {
    formatted = formatted.replace('{0}', rangeStr).replace('{1}', statName);
  }

  return { __html: formatted };
};

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<'Simulator' | 'Database'>('Simulator');
  
  const [size, setSize] = useState<string>('Exalted');
  const [tier, setTier] = useState<string>('4');
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<string>('en');
  const [sortBy, setSortBy] = useState<string>('NameAZ');

  useEffect(() => {
    fetch('./assets/data.json')
      .then(res => res.json())
      .then((json) => setData(json))
      .catch(err => console.error('Error loading data:', err));
  }, []);

  if (!data) return <div style={{color: 'white', padding: '2rem'}}>Loading Database...</div>;

  const sizesAvailable = Object.keys(data.sizes);
  const currentSizeData = data.sizes[size];

  // Common Search Filter Logic
  const matchesSearch = (a: AffixData) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const lName = (a.nameLocalizations[lang] || '').toLowerCase();
    const lDesc = (a.descLocalizations[lang] || '').toLowerCase();
    const lStat = (a.statLocalizations[lang] || '').toLowerCase();
    return lName.includes(q) || lDesc.includes(q) || lStat.includes(q);
  };

  const allValidAffixes = Object.values(data.affixes).filter(a => a.rarity !== 'Unique');

  const buildList = (pool: Record<string, PoolEntry>) => {
    return Object.entries(pool)
      .map(([affixId, poolEntry]) => {
        const affixDef = data.affixes[affixId];
        if (!affixDef || affixDef.rarity === 'Unique' || affixDef.blockedSizes.includes(size)) return null;
        if (!matchesSearch(affixDef)) return null;
        return { affixDef, chance: poolEntry.chance };
      })
      .filter(Boolean) as { affixDef: AffixData, chance: number }[];
  };

  const primaryAffixesList = buildList(currentSizeData?.primaryPool || {});
  const secondaryAffixesList = buildList(currentSizeData?.secondaryPool || {});

  const specialAffixes = allValidAffixes.filter(a => a.rarity === 'Special' && !a.blockedSizes.includes(size));
  const rareChance = specialAffixes.length > 0 ? (100 / specialAffixes.length) : 0;
  
  const rareAffixesList = specialAffixes
    .filter(a => matchesSearch(a))
    .map(affixDef => ({ 
      affixDef, 
      chance: rareChance 
    }));

  const renderAffixItem = (affixDef: AffixData, chance?: number) => {
    const tierStats = affixDef.tiers[tier];
    const min = tierStats ? tierStats.min : 0;
    const max = tierStats ? tierStats.max : 0;
    
    const localName = affixDef.nameLocalizations[lang] || affixDef.nameLocalizations['en'] || 'Unknown';
    const localDesc = affixDef.descLocalizations[lang] || affixDef.descLocalizations['en'] || '';
    const localStat = affixDef.statLocalizations[lang] || affixDef.statLocalizations['en'] || '';
    
    const displayRarity = affixDef.rarity === 'Special' ? 'Rare' : affixDef.rarity;
    const rarityClass = `rarity-${affixDef.rarity.toLowerCase()}`;
    const hoverClass = affixDef.rarity === 'Special' ? 'special-hover' : 'common-hover';
    
    const craftableSizes = ALL_SIZES.filter(s => !affixDef.blockedSizes.includes(s));
    const locationsText = craftableSizes.length === ALL_SIZES.length ? 'All Sizes' : craftableSizes.join(', ');

    return (
      <div key={affixDef.internalName} className={`affix-item ${hoverClass}`}>
        <div className="affix-info">
          <div className="affix-name">
            {localName} 
            <span className={`affix-rarity ${rarityClass}`}>{displayRarity}</span>
          </div>
          {tierStats ? (
            <div className="affix-desc" dangerouslySetInnerHTML={formatListDescription(localDesc, min, max, localStat)} />
          ) : (
            <div className="affix-desc" style={{ color: '#ef4444' }}>Does not roll at this tier</div>
          )}
          {activeTab === 'Database' && (
            <div className="affix-locations">
              Craftable on: <strong>{locationsText}</strong>
            </div>
          )}
        </div>
        <div className="affix-stats">
          {chance !== undefined && chance > 0 && <div className="affix-chance">{chance.toFixed(2)}% chance</div>}
        </div>
      </div>
    );
  };

  const renderAffixGroup = (title: string, list: { affixDef: AffixData, chance: number }[]) => {
    if (list.length === 0 && searchQuery) return null; // Don't show empty headers if searching
    if (list.length === 0) return null;
    list.sort((a, b) => b.chance - a.chance);

    return (
      <div style={{marginBottom: '3rem'}}>
        <h3 className="affix-group-title">{title}</h3>
        <div className="affix-list">
          {list.map(({ affixDef, chance }) => renderAffixItem(affixDef, chance))}
        </div>
      </div>
    );
  };

  // Database Tab Logic
  let filteredAffixes = allValidAffixes.filter(a => matchesSearch(a));
  
  // Sort Logic for All Affixes list
  filteredAffixes.sort((a, b) => {
    const nameA = a.nameLocalizations[lang] || a.nameLocalizations['en'] || '';
    const nameB = b.nameLocalizations[lang] || b.nameLocalizations['en'] || '';
    
    if (sortBy === 'NameAZ') {
      return nameA.localeCompare(nameB);
    } else if (sortBy === 'NameZA') {
      return nameB.localeCompare(nameA);
    } else if (sortBy === 'Rarity') {
      // Sort Rare (Special) first, then Common
      if (a.rarity === b.rarity) return nameA.localeCompare(nameB);
      return a.rarity === 'Special' ? -1 : 1;
    }
    return 0;
  });

  return (
    <div className="app-container">
      <header className="header">
        <div className="title-container">
          <h2>Relic Affix Database</h2>
          <div className="tabs" style={{marginTop: '1.25rem'}}>
            <button className={`tab-button ${activeTab === 'Simulator' ? 'active' : ''}`} onClick={() => setActiveTab('Simulator')}>
              Crafting Pools
            </button>
            <button className={`tab-button ${activeTab === 'Database' ? 'active' : ''}`} onClick={() => setActiveTab('Database')}>
              All Affixes
            </button>
          </div>
        </div>
        
        <div className="global-controls">
          <div className="control-group">
            <label>Language</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="controls">
        <div className="control-group">
          <label>Tier Rolls</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
            <option value="4">Tier 4</option>
          </select>
        </div>
        
        {activeTab === 'Simulator' && (
          <div className="control-group">
            <label>Relic Size</label>
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
        
        {activeTab === 'Database' && (
          <div className="control-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="NameAZ">Name (A-Z)</option>
              <option value="NameZA">Name (Z-A)</option>
              <option value="Rarity">Rarity</option>
            </select>
          </div>
        )}

        <div className="control-group" style={{marginLeft: 'auto'}}>
          <label>Search Affixes</label>
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Search by name, stat, or description..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="main-content">
        <div className="database-panel">
          {activeTab === 'Simulator' ? (
            <div className="db-content">
              {renderAffixGroup("Rare Affixes", rareAffixesList)}
              {renderAffixGroup("Prefixes", primaryAffixesList)}
              {renderAffixGroup("Suffixes", secondaryAffixesList)}
              {rareAffixesList.length === 0 && primaryAffixesList.length === 0 && secondaryAffixesList.length === 0 && (
                <div style={{color: 'var(--text-muted)'}}>No affixes found matching your search.</div>
              )}
            </div>
          ) : (
            <div className="db-content">
              <div className="affix-list">
                {filteredAffixes.map(affixDef => renderAffixItem(affixDef))}
                {filteredAffixes.length === 0 && <div style={{color: 'var(--text-muted)'}}>No affixes found matching your search.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
