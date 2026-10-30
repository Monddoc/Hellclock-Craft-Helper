import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { ANY_SIZE } from '../types';

const parseUrlCategory = (urlCat: string | null) => {
  if (!urlCat) return null;
  const cat = urlCat.toLowerCase();
  if (cat === 'rare') return 'Special';
  if (cat === 'common') return 'Common';
  if (cat === 'corrupted') return 'Corrupted';
  if (cat === 'faithimbued') return 'FaithImbued';
  if (cat === 'furyimbued') return 'FuryImbued';
  if (cat === 'disciplineimbued') return 'DisciplineImbued';
  return urlCat;
};

export function useUrlState() {
  const searchParams = new URLSearchParams(window.location.search);
  
  // Old links to the removed "All Affixes" tab (?tab=Database) open the "Any" relic size instead
  const [size, setSize] = useState<string>(searchParams.get('size') || (searchParams.get('tab') === 'Database' ? ANY_SIZE : 'Exalted'));
  const [tier, setTier] = useState<string>(searchParams.get('tier') || '4');
  const [upgradeLevel, setUpgradeLevel] = useState<number>(Number(searchParams.get('upgrade')) || 0);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const [lang, setLang] = useState<string>(searchParams.get('lang') || 'en');
  const [activeCategory, setActiveCategory] = useState<string | null>(parseUrlCategory(searchParams.get('category')));
  
  useEffect(() => {
    const params = new URLSearchParams();
    if (lang !== 'en') params.set('lang', lang);
    if (searchQuery) params.set('q', searchQuery);
    if (upgradeLevel !== 0) params.set('upgrade', String(upgradeLevel));
    if (tier !== '4') params.set('tier', tier);
    if (size !== 'Exalted') params.set('size', size);
    if (activeCategory) {
      const urlCat = activeCategory === 'Special' ? 'rare' : activeCategory.toLowerCase();
      params.set('category', urlCat);
    }

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [lang, tier, upgradeLevel, size, searchQuery, activeCategory]);

  return {
    size, setSize,
    tier, setTier,
    upgradeLevel, setUpgradeLevel,
    searchQuery, setSearchQuery,
    debouncedSearchQuery,
    lang, setLang,
    activeCategory, setActiveCategory
  };
}
