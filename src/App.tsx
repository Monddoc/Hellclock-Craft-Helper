import { useState, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SearchX, ArrowUp } from 'lucide-react';

import { useUrlState } from './hooks/useUrlState';
import { useGameData } from './hooks/useGameData';
import { t } from './utils';

import { Header } from './components/Header';
import { ControlsBar } from './components/ControlsBar';
import { SearchBar } from './components/SearchBar';
import { AffixItem } from './components/AffixItem';
import { AffixGroup } from './components/AffixGroup';
import { ALL_SIZES, ANY_SIZE } from './types';
import type { PoolEntry, AffixData, SizeData } from './types';

interface AffixItemEntry {
  affixDef: AffixData;
  chance?: number;
  sizes?: string[];
  category?: string;
}

export default function App() {
  const {
    size, setSize,
    tier, setTier,
    upgradeLevel, setUpgradeLevel,
    searchQuery, setSearchQuery,
    debouncedSearchQuery,
    lang, setLang,
    activeCategory, setActiveCategory
  } = useUrlState();

  const { data, matchesSearchLang } = useGameData(debouncedSearchQuery, lang, setLang);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try { 
      const parsed = JSON.parse(localStorage.getItem('hcc_favorites') || '[]'); 
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [globalCollapseSignal, setGlobalCollapseSignal] = useState(0);
  const [isGlobalCollapsed, setIsGlobalCollapsed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const dbContentRef = useRef<HTMLDivElement>(null);

  const toggleFavorite = (internalName: string) => {
    setFavorites(prev => {
      const next = prev.includes(internalName) ? prev.filter(n => n !== internalName) : [...prev, internalName];
      localStorage.setItem('hcc_favorites', JSON.stringify(next));
      return next;
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 300);
  };

  const scrollToTop = () => {
    dbContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sizesAvailable = data ? Object.keys(data.sizes) : [];
  const currentSizeData = data ? data.sizes[size] : null;
  const allValidAffixes = data ? Object.values(data.affixes).filter(a => a.rarity !== 'Unique') : [];

  const matchesSearch = (a: AffixData) => {
    if (!debouncedSearchQuery) return true;
    return matchesSearchLang(a, lang, debouncedSearchQuery.toLowerCase());
  };

  const isAnySize = size === ANY_SIZE;

  const keepItem = (affixDef: AffixData) =>
    matchesSearch(affixDef) && (!showFavorites || favorites.includes(affixDef.internalName));

  const byName = (a: AffixItemEntry, b: AffixItemEntry) => {
    const nameA = a.affixDef.nameLocalizations[lang] || a.affixDef.nameLocalizations['en'] || '';
    const nameB = b.affixDef.nameLocalizations[lang] || b.affixDef.nameLocalizations['en'] || '';
    return nameA.localeCompare(nameB);
  };

  // With a specific size: the affixes of that size's pool with their chance.
  // With "Any" size: every affix that is in that pool on at least one size, with the sizes it rolls on.
  const buildList = (getPool: (sizeData: SizeData) => Record<string, PoolEntry> | undefined, category?: string): AffixItemEntry[] => {
    if (!data) return [];
    if (!isAnySize) {
      const pool = (currentSizeData && getPool(currentSizeData)) || {};
      return Object.entries(pool)
        .map(([affixId, poolEntry]) => ({ affixDef: data.affixes[affixId], chance: poolEntry.chance, category }))
        .filter(item => item.affixDef && item.affixDef.rarity !== 'Unique' && !item.affixDef.blockedSizes.includes(size) && keepItem(item.affixDef));
    }
    const sizesByAffix: Record<string, string[]> = {};
    for (const sizeName of ALL_SIZES) {
      const sizeData = data.sizes[sizeName];
      if (!sizeData) continue;
      for (const affixId of Object.keys(getPool(sizeData) || {})) {
        if (data.affixes[affixId]?.blockedSizes.includes(sizeName)) continue;
        (sizesByAffix[affixId] ??= []).push(sizeName);
      }
    }
    return Object.entries(sizesByAffix)
      .map(([affixId, sizes]) => ({ affixDef: data.affixes[affixId], sizes, category }))
      .filter(item => item.affixDef && item.affixDef.rarity !== 'Unique' && keepItem(item.affixDef))
      .sort(byName);
  };

  const primaryAffixesList = useMemo(() => buildList(s => s.primaryPool), [data, currentSizeData, size, debouncedSearchQuery, showFavorites, favorites, lang]);
  const secondaryAffixesList = useMemo(() => buildList(s => s.secondaryPool), [data, currentSizeData, size, debouncedSearchQuery, showFavorites, favorites, lang]);

  // Rare affixes are picked uniformly among the ones not blocked on the relic size
  const rareAffixesList = useMemo((): AffixItemEntry[] => {
    const specialAffixes = allValidAffixes.filter(a => a.rarity === 'Special' && (isAnySize || !a.blockedSizes.includes(size)));
    const rareChance = specialAffixes.length > 0 ? (100 / specialAffixes.length) : 0;
    const list = specialAffixes
      .filter(keepItem)
      .map(affixDef => isAnySize
        ? { affixDef, sizes: ALL_SIZES.filter(s => !affixDef.blockedSizes.includes(s)) }
        : { affixDef, chance: rareChance });
    return isAnySize ? list.sort(byName) : list;
  }, [data, size, debouncedSearchQuery, showFavorites, favorites, lang]);

  const buildImplicitList = (category: string) => buildList(s => s.implicitPools?.[category], category);

  const furyList = useMemo(() => buildImplicitList('FuryImbued'), [data, currentSizeData, size, debouncedSearchQuery, showFavorites, favorites, lang]);
  const faithList = useMemo(() => buildImplicitList('FaithImbued'), [data, currentSizeData, size, debouncedSearchQuery, showFavorites, favorites, lang]);
  const disciplineList = useMemo(() => buildImplicitList('DisciplineImbued'), [data, currentSizeData, size, debouncedSearchQuery, showFavorites, favorites, lang]);
  const corruptedList = useMemo(() => buildImplicitList('Corrupted'), [data, currentSizeData, size, debouncedSearchQuery, showFavorites, favorites, lang]);

  const EmptyState = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', gap: '1rem' }}>
      <SearchX size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{t('noResults', lang)}</h3>
      <p style={{ textAlign: 'center', maxWidth: '400px' }}>Try adjusting your search query, tier, or size filters to find what you're looking for.</p>
    </div>
  );

  const renderItem = (item: AffixItemEntry) => (
    <AffixItem
      key={item.affixDef.internalName}
      affixDef={item.affixDef}
      chance={item.chance}
      sizes={item.sizes}
      category={item.category}
      tier={tier}
      upgradeLevel={upgradeLevel}
      statLineTemplates={data?.statLineTemplates || {}}
      lang={lang}
      isFavorite={favorites.includes(item.affixDef.internalName)} 
      toggleFavorite={toggleFavorite} 
    />
  );

  const simulatorGroups = useMemo(() => [
    { title: t('rareAffixes', lang), list: rareAffixesList, show: !activeCategory || activeCategory === 'Special' },
    { title: t('prefixes', lang), list: primaryAffixesList, show: !activeCategory || activeCategory === 'Common' },
    { title: t('suffixes', lang), list: secondaryAffixesList, show: !activeCategory || activeCategory === 'Common' },
    { title: t('sortByFury', lang), list: furyList, show: !activeCategory || activeCategory === 'FuryImbued' },
    { title: t('sortByFaith', lang), list: faithList, show: !activeCategory || activeCategory === 'FaithImbued' },
    { title: t('sortByDiscipline', lang), list: disciplineList, show: !activeCategory || activeCategory === 'DisciplineImbued' },
    { title: t('sortByCorrupted', lang), list: corruptedList, show: !activeCategory || activeCategory === 'Corrupted' }
  ], [rareAffixesList, primaryAffixesList, secondaryAffixesList, furyList, faithList, disciplineList, corruptedList, activeCategory, lang]);

  if (!data) return <div style={{color: 'white', padding: '2rem'}}>Loading Database...</div>;

  return (
    <div className="app-container">
      <Header lang={lang} setLang={setLang} />

      <ControlsBar
        tier={tier} setTier={setTier}
        upgradeLevel={upgradeLevel} setUpgradeLevel={setUpgradeLevel} maxUpgradeLevel={data.maxUpgradeLevel ?? 5}
        size={size} setSize={setSize} sizesAvailable={sizesAvailable}
        activeCategory={activeCategory} setActiveCategory={setActiveCategory} 
        showFavorites={showFavorites} setShowFavorites={setShowFavorites} 
        lang={lang} 
        searchBarNode={<SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} lang={lang} />}
        isGlobalCollapsed={isGlobalCollapsed}
        onToggleCollapseAll={() => {
          setIsGlobalCollapsed(!isGlobalCollapsed);
          setGlobalCollapseSignal(prev => prev + 1);
        }}
      />

      <div className="main-content" style={{ position: 'relative' }}>
        <div className="database-panel">
          <div className="db-content" ref={dbContentRef} onScroll={handleScroll}>
            {simulatorGroups.map(group => group.show && (
              <AffixGroup
                key={group.title}
                title={group.title}
                isSearching={!!debouncedSearchQuery}
                list={group.list.map(renderItem)}
                globalCollapseSignal={globalCollapseSignal}
                isGlobalCollapsed={isGlobalCollapsed}
              />
            ))}

            {simulatorGroups.every(g => !g.show || g.list.length === 0) && <EmptyState />}
          </div>

          <AnimatePresence>
            {showScrollTop && (
              <motion.button 
                className="scroll-top-btn"
                onClick={scrollToTop}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                title="Scroll to Top"
              >
                <ArrowUp />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
