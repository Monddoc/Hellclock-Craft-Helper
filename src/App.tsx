import { useState, useEffect } from 'react';

interface TierData { min: number; max: number; }
interface AffixData {
  internalId: number;
  internalName: string;
  nameLocalizations: Record<string, string>;
  descLocalizations: Record<string, string>;
  statLocalizations: Record<string, string>;
  rarity: string;
  implicitCategory?: string;
  skillName?: string;
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

const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  'en': {
    title: 'Hell Clock Craft',
    tabSimulator: 'Crafting Pools',
    tabDatabase: 'All Affixes',
    language: 'Language',
    tierRolls: 'Tier Rolls',
    tier: 'Tier',
    relicSize: 'Relic Size',
    sortBy: 'Sort By',
    nameAZ: 'Name (A-Z)',
    nameZA: 'Name (Z-A)',
    rarity: 'Rarity',
    searchLabel: 'Search Affixes',
    searchPlaceholder: 'Search by name, stat, or description...',
    noRolls: 'Does not roll at this tier',
    craftableOn: 'Craftable on:',
    allSizes: 'All Sizes',
    chance: 'chance',
    noResults: 'No affixes found matching your search.',
    rareAffixes: 'Rare Affixes',
    prefixes: 'Prefixes',
    suffixes: 'Suffixes',
    roll: 'Roll:',
    sortByCorrupted: 'Corrupted',
    sortByFaith: 'Faith Imbued',
    sortByFury: 'Fury Imbued',
    sortByDiscipline: 'Discipline Imbued'
  },
  'pt-br': {
    title: 'Hell Clock Craft',
    tabSimulator: 'Simulador',
    tabDatabase: 'Todos os Afixos',
    language: 'Idioma',
    tierRolls: 'Grau do Afixo',
    tier: 'Grau',
    relicSize: 'Tamanho da Relíquia',
    sortBy: 'Ordenar Por',
    nameAZ: 'Nome (A-Z)',
    nameZA: 'Nome (Z-A)',
    rarity: 'Raridade',
    searchLabel: 'Buscar Afixos',
    searchPlaceholder: 'Busque por nome, atributo ou descrição...',
    noRolls: 'Não pode ser obtido neste grau',
    craftableOn: 'Pode ser criado em:',
    allSizes: 'Todos os Tamanhos',
    chance: 'chance',
    noResults: 'Nenhum afixo encontrado.',
    rareAffixes: 'Afixos Raros',
    prefixes: 'Prefixos',
    suffixes: 'Sufixos',
    roll: 'Valor:'
  },
  'es': {
    title: 'Hell Clock Craft',
    tabSimulator: 'Simulador',
    tabDatabase: 'Todos los Afijos',
    language: 'Idioma',
    tierRolls: 'Nivel de Afijo',
    tier: 'Nivel',
    relicSize: 'Tamaño de Reliquia',
    sortBy: 'Ordenar Por',
    nameAZ: 'Nombre (A-Z)',
    nameZA: 'Nombre (Z-A)',
    rarity: 'Rareza',
    searchLabel: 'Buscar Afijos',
    searchPlaceholder: 'Buscar por nombre, atributo...',
    noRolls: 'No se puede obtener en este nivel',
    craftableOn: 'Se puede crear en:',
    allSizes: 'Todos los tamaños',
    chance: 'probabilidad',
    noResults: 'No se encontraron afijos.',
    rareAffixes: 'Afijos Raros',
    prefixes: 'Prefijos',
    suffixes: 'Sufijos',
    roll: 'Valor:'
  },
  'de': {
    tabSimulator: 'Crafting-Pools',
    tabDatabase: 'Alle Affixe',
    language: 'Sprache',
    tierRolls: 'Tier-Rollen',
    tier: 'Tier',
    relicSize: 'Reliktgröße',
    searchLabel: 'Affixe suchen',
    searchPlaceholder: 'Suche nach Name, Wert...',
    noRolls: 'Rollt nicht auf diesem Tier',
    craftableOn: 'Herstellbar auf:',
    allSizes: 'Alle Größen',
    chance: 'Chance',
    noResults: 'Keine Affixe gefunden.',
    rareAffixes: 'Seltene Affixe',
    prefixes: 'Präfixe',
    suffixes: 'Suffixe',
    roll: 'Wert:'
  }
};

const t = (key: string, currentLang: string) => {
  return UI_TRANSLATIONS[currentLang]?.[key] || UI_TRANSLATIONS['en'][key];
};

const formatListDescription = (desc: string, min: number, max: number, statName: string, rollText: string) => {
  if (!desc) return { __html: '' };
  
  const is1Value = desc.includes('<style="TooltipValue">{1}</style>');
  const has0 = desc.includes('{0}');
  const has1 = desc.includes('{1}');
  
  let formatted = desc.replace(/<style="[^"]*">/g, '').replace(/<\/style>/g, '');
  
  // If min and max are 0, there is no roll scaling at all
  if (min === 0 && max === 0) {
    return { __html: formatted.replace('{0}', statName).replace('{1}', statName) };
  }

  let minF = min < 1 ? (min * 100).toFixed(1) + '%' : min.toFixed(1);
  let maxF = max < 1 ? (max * 100).toFixed(1) + '%' : max.toFixed(1);
  const rangeStr = `<span class="affix-roll">[${minF} - ${maxF}]</span>`;

  if (is1Value) {
    formatted = formatted.replace('{1}', rangeStr).replace('{0}', statName);
  } else if (has0 || has1) {
    formatted = formatted.replace('{0}', rangeStr).replace('{1}', statName);
  } else {
    // FIX: If the game data description lacks {0} but DOES have a tier roll range, append it to the end so it's not invisible!
    formatted = `${formatted}<br/><br/><strong>${rollText}</strong> ${rangeStr} ${statName}`;
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
    
    const baseLocalName = affixDef.nameLocalizations[lang] || affixDef.nameLocalizations['en'] || 'Unknown';
    const localName = affixDef.skillName ? affixDef.skillName : baseLocalName;
    const localDesc = affixDef.descLocalizations[lang] || affixDef.descLocalizations['en'] || '';
    const localStat = affixDef.statLocalizations[lang] || affixDef.statLocalizations['en'] || '';
    
    let displayRarity = affixDef.rarity === 'Special' ? 'Rare' : affixDef.rarity;
    let rarityClass = `rarity-${affixDef.rarity.toLowerCase()}`;
    
    if (affixDef.implicitCategory) {
      displayRarity += ` - ${affixDef.implicitCategory.replace('Imbued', ' Imbued')}`;
      rarityClass += ` rarity-${affixDef.implicitCategory.toLowerCase()}`;
    }

    const hoverClass = affixDef.rarity === 'Special' ? 'special-hover' : 'common-hover';
    
    const craftableSizes = ALL_SIZES.filter(s => !affixDef.blockedSizes.includes(s));
    const locationsText = craftableSizes.length === ALL_SIZES.length ? t('allSizes', lang) : craftableSizes.join(', ');

    return (
      <div key={affixDef.internalName} className={`affix-item ${hoverClass}`}>
        <div className="affix-info">
          <div className="affix-name">
            {localName} 
            <span className={`affix-rarity ${rarityClass}`}>{displayRarity}</span>
          </div>
          {tierStats ? (
            <div className="affix-desc" dangerouslySetInnerHTML={formatListDescription(localDesc, min, max, localStat, t('roll', lang))} />
          ) : (
            <div className="affix-desc" style={{ color: '#ef4444' }}>{t('noRolls', lang)}</div>
          )}
          {activeTab === 'Database' && (
            <div className="affix-locations">
              {t('craftableOn', lang)} <strong>{locationsText}</strong>
            </div>
          )}
        </div>
        <div className="affix-stats">
          {chance !== undefined && chance > 0 && <div className="affix-chance">{chance.toFixed(2)}% {t('chance', lang)}</div>}
        </div>
      </div>
    );
  };

  const renderAffixGroup = (title: string, list: { affixDef: AffixData, chance: number }[]) => {
    if (list.length === 0 && searchQuery) return null;
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

  let filteredAffixes = allValidAffixes.filter(a => matchesSearch(a));
  
  filteredAffixes.sort((a, b) => {
    const nameA = a.nameLocalizations[lang] || a.nameLocalizations['en'] || '';
    const nameB = b.nameLocalizations[lang] || b.nameLocalizations['en'] || '';
    
    if (sortBy === 'NameAZ') {
      return nameA.localeCompare(nameB);
    } else if (sortBy === 'NameZA') {
      return nameB.localeCompare(nameA);
    } else if (sortBy === 'Rarity') {
      if (a.rarity === b.rarity) return nameA.localeCompare(nameB);
      return a.rarity === 'Special' ? -1 : 1;
    } else if (['Corrupted', 'FaithImbued', 'FuryImbued', 'DisciplineImbued'].includes(sortBy)) {
      if (a.implicitCategory === sortBy && b.implicitCategory !== sortBy) return -1;
      if (b.implicitCategory === sortBy && a.implicitCategory !== sortBy) return 1;
      return nameA.localeCompare(nameB);
    }
    return 0;
  });

  return (
    <div className="app-container">
      <header className="header">
        <div className="title-container">
          <h2>{t('title', lang)}</h2>
          <div className="tabs" style={{marginTop: '1.25rem'}}>
            <button className={`tab-button ${activeTab === 'Simulator' ? 'active' : ''}`} onClick={() => setActiveTab('Simulator')}>
              {t('tabSimulator', lang)}
            </button>
            <button className={`tab-button ${activeTab === 'Database' ? 'active' : ''}`} onClick={() => setActiveTab('Database')}>
              {t('tabDatabase', lang)}
            </button>
          </div>
        </div>
        
        <div className="global-controls">
          <div className="control-group">
            <label>{t('language', lang)}</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="controls">
        <div className="control-group">
          <label>{t('tierRolls', lang)}</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
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
        
        {activeTab === 'Database' && (
          <div className="control-group">
            <label>{t('sortBy', lang)}</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="NameAZ">{t('nameAZ', lang)}</option>
              <option value="NameZA">{t('nameZA', lang)}</option>
              <option value="Rarity">{t('rarity', lang)}</option>
              <option value="Corrupted">{t('sortByCorrupted', lang)}</option>
              <option value="FaithImbued">{t('sortByFaith', lang)}</option>
              <option value="FuryImbued">{t('sortByFury', lang)}</option>
              <option value="DisciplineImbued">{t('sortByDiscipline', lang)}</option>
            </select>
          </div>
        )}

        <div className="control-group" style={{marginLeft: 'auto'}}>
          <label>{t('searchLabel', lang)}</label>
          <input 
            type="text" 
            className="search-bar" 
            placeholder={t('searchPlaceholder', lang)} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="main-content">
        <div className="database-panel">
          {activeTab === 'Simulator' ? (
            <div className="db-content">
              {renderAffixGroup(t('rareAffixes', lang), rareAffixesList)}
              {renderAffixGroup(t('prefixes', lang), primaryAffixesList)}
              {renderAffixGroup(t('suffixes', lang), secondaryAffixesList)}
              {rareAffixesList.length === 0 && primaryAffixesList.length === 0 && secondaryAffixesList.length === 0 && (
                <div style={{color: 'var(--text-muted)'}}>{t('noResults', lang)}</div>
              )}
            </div>
          ) : (
            <div className="db-content">
              <div className="affix-list">
                {filteredAffixes.map(affixDef => renderAffixItem(affixDef))}
                {filteredAffixes.length === 0 && <div style={{color: 'var(--text-muted)'}}>{t('noResults', lang)}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
