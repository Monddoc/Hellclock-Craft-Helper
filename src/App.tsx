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
import type { PoolEntry, AffixData } from './types';

export default function App() {
  const {
    activeTab, setActiveTab,
    size, setSize,
    tier, setTier,
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

  const buildList = (pool: Record<string, PoolEntry>) => {
    let list = Object.entries(pool)
      .map(([affixId, poolEntry]) => {
        const affixDef = data?.affixes[affixId];
        if (!affixDef || affixDef.rarity === 'Unique' || affixDef.blockedSizes.includes(size)) return null;
        if (!matchesSearch(affixDef)) return null;
        return { affixDef, chance: poolEntry.chance };
      })
      .filter(Boolean) as { affixDef: AffixData, chance: number }[];
    if (showFavorites) return list.filter(item => favorites.includes(item.affixDef.internalName));
    return list;
  };

  const primaryAffixesList = useMemo(() => buildList(currentSizeData?.primaryPool || {}), [currentSizeData, size, debouncedSearchQuery, showFavorites, favorites, lang]);
  const secondaryAffixesList = useMemo(() => buildList(currentSizeData?.secondaryPool || {}), [currentSizeData, size, debouncedSearchQuery, showFavorites, favorites, lang]);

  const specialAffixes = useMemo(() => allValidAffixes.filter(a => a.rarity === 'Special' && !a.blockedSizes.includes(size)), [allValidAffixes, size]);
  const rareChance = specialAffixes.length > 0 ? (100 / specialAffixes.length) : 0;
  
  const rareAffixesList = useMemo(() => specialAffixes
    .filter(a => matchesSearch(a))
    .filter(a => showFavorites ? favorites.includes(a.internalName) : true)
    .map(affixDef => ({ 
      affixDef, 
      chance: rareChance 
    })), [specialAffixes, debouncedSearchQuery, showFavorites, favorites, rareChance, lang]);

  const buildImplicitList = (category: string) => {
    return allValidAffixes
      .filter(a => a.implicitCategory === category && !a.blockedSizes.includes(size))
      .filter(a => matchesSearch(a))
      .filter(a => showFavorites ? favorites.includes(a.internalName) : true)
      .map(affixDef => ({ affixDef }));
  };

  const furyList = useMemo(() => buildImplicitList('FuryImbued'), [allValidAffixes, size, debouncedSearchQuery, showFavorites, favorites, lang]);
  const faithList = useMemo(() => buildImplicitList('FaithImbued'), [allValidAffixes, size, debouncedSearchQuery, showFavorites, favorites, lang]);
  const disciplineList = useMemo(() => buildImplicitList('DisciplineImbued'), [allValidAffixes, size, debouncedSearchQuery, showFavorites, favorites, lang]);
  const corruptedList = useMemo(() => buildImplicitList('Corrupted'), [allValidAffixes, size, debouncedSearchQuery, showFavorites, favorites, lang]);

  const filteredAffixes = useMemo(() => {
    let list = allValidAffixes.filter(a => matchesSearch(a));
    if (showFavorites) {
      list = list.filter(a => favorites.includes(a.internalName));
    }
    if (activeCategory === 'Special') {
      list = list.filter(a => a.rarity === 'Special' && !a.implicitCategory);
    } else if (activeCategory === 'Common') {
      list = list.filter(a => a.rarity === 'Common' && !a.implicitCategory);
    } else if (activeCategory) {
      list = list.filter(a => a.implicitCategory === activeCategory);
    }
    
    list.sort((a, b) => {
      const nameA = a.nameLocalizations[lang] || a.nameLocalizations['en'] || '';
      const nameB = b.nameLocalizations[lang] || b.nameLocalizations['en'] || '';
      return nameA.localeCompare(nameB);
    });
    return list;
  }, [allValidAffixes, debouncedSearchQuery, showFavorites, favorites, activeCategory, lang]);

  const EmptyState = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', gap: '1rem' }}>
      <SearchX size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{t('noResults', lang)}</h3>
      <p style={{ textAlign: 'center', maxWidth: '400px' }}>Try adjusting your search query, tier, or size filters to find what you're looking for.</p>
    </div>
  );

  const renderItem = (item: { affixDef: AffixData, chance?: number }) => (
    <AffixItem 
      key={item.affixDef.internalName} 
      affixDef={item.affixDef} 
      chance={item.chance} 
      tier={tier} 
      lang={lang} 
      activeTab={activeTab} 
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
      <Header activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} setLang={setLang} />
      
      <ControlsBar 
        tier={tier} setTier={setTier} 
        size={size} setSize={setSize} sizesAvailable={sizesAvailable} 
        activeTab={activeTab} 
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
          {activeTab === 'Simulator' ? (
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
          ) : (
            <div className="db-content" ref={dbContentRef} onScroll={handleScroll}>
              <div className="affix-list">
                <AnimatePresence mode="popLayout">
                  {filteredAffixes.map(a => renderItem({ affixDef: a }))}
                </AnimatePresence>
                {filteredAffixes.length === 0 && <EmptyState />}
              </div>
            </div>
          )}

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
