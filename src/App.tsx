import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, SearchX, Star } from 'lucide-react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
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
    sortByDiscipline: 'Discipline Imbued',
    favoritesOnly: 'Favorites Only'
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
    roll: 'Valor:',
    favoritesOnly: 'Apenas Favoritos'
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
    roll: 'Valor:',
    favoritesOnly: 'Solo Favoritos'
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
    roll: 'Wert:',
    favoritesOnly: 'Nur Favoriten'
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
  
  const searchParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState<'Simulator' | 'Database'>((searchParams.get('tab') as 'Simulator' | 'Database') || 'Simulator');
  const [size, setSize] = useState<string>(searchParams.get('size') || 'Exalted');
  const [tier, setTier] = useState<string>(searchParams.get('tier') || '4');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const [lang, setLang] = useState<string>(searchParams.get('lang') || 'en');
  const [activeCategory, setActiveCategory] = useState<string | null>(searchParams.get('category') || null);
  
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { 
      const parsed = JSON.parse(localStorage.getItem('hcc_favorites') || '[]'); 
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [showFavorites, setShowFavorites] = useState(false);

  const toggleFavorite = (internalName: string) => {
    setFavorites(prev => {
      const next = prev.includes(internalName) ? prev.filter(n => n !== internalName) : [...prev, internalName];
      localStorage.setItem('hcc_favorites', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'Simulator') params.set('tab', activeTab);
    if (lang !== 'en') params.set('lang', lang);
    if (tier !== '4') params.set('tier', tier);
    if (size !== 'Exalted') params.set('size', size);
    if (searchQuery) params.set('q', searchQuery);
    if (activeCategory) params.set('category', activeCategory);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [activeTab, lang, tier, size, searchQuery, activeCategory]);

  useEffect(() => {
    fetch('./assets/data.json')
      .then(res => res.json())
      .then((json) => setData(json))
      .catch(err => console.error('Error loading data:', err));
  }, []);

  // Common Search Filter Logic
  const matchesSearchLang = (a: AffixData, checkLang: string, q: string) => {
    const lName = (a.nameLocalizations[checkLang] || '').toLowerCase();
    const lDesc = (a.descLocalizations[checkLang] || '').toLowerCase();
    const lStat = (a.statLocalizations[checkLang] || '').toLowerCase();
    return lName.includes(q) || lDesc.includes(q) || lStat.includes(q);
  };

  const matchesSearch = (a: AffixData) => {
    if (!debouncedSearchQuery) return true;
    return matchesSearchLang(a, lang, debouncedSearchQuery.toLowerCase());
  };

  useEffect(() => {
    if (!debouncedSearchQuery || !data) return;
    const q = debouncedSearchQuery.toLowerCase();
    
    // 1. Check if current language has a match
    const currentMatches = Object.values(data.affixes).some(a => matchesSearchLang(a, lang, q));
    if (currentMatches) return; // All good

    // 2. If not, check other languages
    for (const l of LANGUAGES.map(x => x.code)) {
      if (l === lang) continue;
      const otherMatches = Object.values(data.affixes).some(a => matchesSearchLang(a, l, q));
      if (otherMatches) {
        setLang(l);
        break;
      }
    }
  }, [debouncedSearchQuery, data, lang]);

  if (!data) return <div style={{color: 'white', padding: '2rem'}}>Loading Database...</div>;

  const sizesAvailable = Object.keys(data.sizes);
  const currentSizeData = data.sizes[size];
  const allValidAffixes = Object.values(data.affixes).filter(a => a.rarity !== 'Unique');

  const buildList = (pool: Record<string, PoolEntry>) => {
    let list = Object.entries(pool)
      .map(([affixId, poolEntry]) => {
        const affixDef = data.affixes[affixId];
        if (!affixDef || affixDef.rarity === 'Unique' || affixDef.blockedSizes.includes(size)) return null;
        if (!matchesSearch(affixDef)) return null;
        return { affixDef, chance: poolEntry.chance };
      })
      .filter(Boolean) as { affixDef: AffixData, chance: number }[];
    if (showFavorites) return list.filter(item => favorites.includes(item.affixDef.internalName));
    return list;
  };

  const primaryAffixesList = buildList(currentSizeData?.primaryPool || {});
  const secondaryAffixesList = buildList(currentSizeData?.secondaryPool || {});

  const specialAffixes = allValidAffixes.filter(a => a.rarity === 'Special' && !a.blockedSizes.includes(size));
  const rareChance = specialAffixes.length > 0 ? (100 / specialAffixes.length) : 0;
  
  const rareAffixesList = specialAffixes
    .filter(a => matchesSearch(a))
    .filter(a => showFavorites ? favorites.includes(a.internalName) : true)
    .map(affixDef => ({ 
      affixDef, 
      chance: rareChance 
    }));

  const renderAffixItem = (affixDef: AffixData, chance?: number) => {
    const tierStats = affixDef.tiers[tier];
    const min = tierStats ? tierStats.min : 0;
    const max = tierStats ? tierStats.max : 0;
    
    const baseLocalName = affixDef.nameLocalizations[lang] || affixDef.nameLocalizations['en'] || affixDef.statLocalizations[lang] || affixDef.statLocalizations['en'] || 'Unknown';
    const localName = affixDef.skillName ? affixDef.skillName : baseLocalName;
    const localDesc = affixDef.descLocalizations[lang] || affixDef.descLocalizations['en'] || '';
    const localStat = affixDef.statLocalizations[lang] || affixDef.statLocalizations['en'] || '';
    
    let displayRarity = affixDef.rarity === 'Special' ? 'Rare' : affixDef.rarity;
    let rarityClass = `rarity-${affixDef.rarity.toLowerCase()}`;
    
    if (affixDef.implicitCategory) {
      displayRarity = `Implicit - ${affixDef.implicitCategory.replace('Imbued', ' Imbued')}`;
      rarityClass = `rarity-${affixDef.implicitCategory.toLowerCase()}`;
    }

    const hoverClass = affixDef.rarity === 'Special' ? 'special-hover' : 'common-hover';
    const itemSpecialClass = affixDef.rarity === 'Special' ? 'item-special' : '';


    const craftableSizes = ALL_SIZES.filter(s => !affixDef.blockedSizes.includes(s));
    const locationsText = craftableSizes.length === ALL_SIZES.length ? t('allSizes', lang) : craftableSizes.join(', ');

    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
        transition={{ duration: 0.15 }}
        key={affixDef.internalName} 
        className={`affix-item ${hoverClass} ${itemSpecialClass} ${affixDef.implicitCategory ? 'rarity-' + affixDef.implicitCategory.toLowerCase() : ''}`}
      >
        <div className="affix-info">
          <div className="affix-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className={`favorite-btn ${favorites.includes(affixDef.internalName) ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleFavorite(affixDef.internalName); }}
              title="Toggle Favorite"
            >
              <Star size={18} fill={favorites.includes(affixDef.internalName) ? "currentColor" : "none"} />
            </button>
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
      </motion.div>
    );
  };

  const renderAffixGroup = (title: string, list: { affixDef: AffixData, chance: number }[]) => {
    if (list.length === 0 && debouncedSearchQuery) return null;
    if (list.length === 0) return null;
    list.sort((a, b) => b.chance - a.chance);

    const isCollapsed = (collapsedSections[title] || false) && !debouncedSearchQuery;
    const toggleSection = () => setCollapsedSections(prev => ({...prev, [title]: !prev[title]}));

    return (
      <div style={{marginBottom: '3rem'}} key={title}>
        <h3 className="affix-group-title" onClick={toggleSection} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <span>{title}</span>
          <span style={{ color: 'var(--text-muted)' }}>
            {isCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </span>
        </h3>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="affix-list" style={{ paddingTop: '1rem' }}>
                <AnimatePresence>
                  {list.map(({ affixDef, chance }) => renderAffixItem(affixDef, chance))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const EmptyState = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', gap: '1rem' }}
    >
      <SearchX size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{t('noResults', lang)}</h3>
      <p style={{ textAlign: 'center', maxWidth: '400px' }}>Try adjusting your search query, tier, or size filters to find what you're looking for.</p>
    </motion.div>
  );

  let filteredAffixes = allValidAffixes.filter(a => matchesSearch(a));
  if (showFavorites) {
    filteredAffixes = filteredAffixes.filter(a => favorites.includes(a.internalName));
  }
  if (activeCategory === 'Special') {
    filteredAffixes = filteredAffixes.filter(a => a.rarity === 'Special');
  } else if (activeCategory) {
    filteredAffixes = filteredAffixes.filter(a => a.implicitCategory === activeCategory);
  }
  
  filteredAffixes.sort((a, b) => {
    const nameA = a.nameLocalizations[lang] || a.nameLocalizations['en'] || '';
    const nameB = b.nameLocalizations[lang] || b.nameLocalizations['en'] || '';
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="app-container">
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
            <label style={{ visibility: 'hidden' }}>Icons</label>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <button className={`icon-filter-btn ${activeCategory === 'Special' ? 'active special' : ''}`} onClick={() => setActiveCategory(activeCategory === 'Special' ? null : 'Special')} title={t('rareAffixes', lang)}>
                <img src="./assets/icons/IconTool_GreaterEnhancement.png" alt="Rare" />
              </button>
              <button className={`icon-filter-btn ${activeCategory === 'Corrupted' ? 'active corrupted' : ''}`} onClick={() => setActiveCategory(activeCategory === 'Corrupted' ? null : 'Corrupted')} title={t('sortByCorrupted', lang)}>
                <img src="./assets/icons/IconTool_Corrupted.png" alt="Corrupted" />
              </button>
              <button className={`icon-filter-btn ${activeCategory === 'FaithImbued' ? 'active faith' : ''}`} onClick={() => setActiveCategory(activeCategory === 'FaithImbued' ? null : 'FaithImbued')} title={t('sortByFaith', lang)}>
                <img src="./assets/icons/IconTool_Faith.png" alt="Faith Imbued" />
              </button>
              <button className={`icon-filter-btn ${activeCategory === 'FuryImbued' ? 'active fury' : ''}`} onClick={() => setActiveCategory(activeCategory === 'FuryImbued' ? null : 'FuryImbued')} title={t('sortByFury', lang)}>
                <img src="./assets/icons/IconTool_Fury.png" alt="Fury Imbued" />
              </button>
              <button className={`icon-filter-btn ${activeCategory === 'DisciplineImbued' ? 'active discipline' : ''}`} onClick={() => setActiveCategory(activeCategory === 'DisciplineImbued' ? null : 'DisciplineImbued')} title={t('sortByDiscipline', lang)}>
                <img src="./assets/icons/IconTool_Discipline.png" alt="Discipline Imbued" />
              </button>
            </div>
          </div>
        )}

        <div className="control-group">
          <label style={{ visibility: 'hidden' }}>Filter</label>
          <button 
            className={`filter-btn ${showFavorites ? 'active' : ''}`}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Star size={18} fill={showFavorites ? "currentColor" : "none"} />
            {t('favoritesOnly', lang)}
          </button>
        </div>

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
                <EmptyState />
              )}
            </div>
          ) : (
            <div className="db-content">
              <div className="affix-list">
                <AnimatePresence mode="popLayout">
                  {filteredAffixes.map(affixDef => renderAffixItem(affixDef))}
                </AnimatePresence>
                {filteredAffixes.length === 0 && <EmptyState />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
