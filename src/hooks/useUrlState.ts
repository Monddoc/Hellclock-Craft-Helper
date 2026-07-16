import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

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
  
  const [activeTab, setActiveTab] = useState<'Simulator' | 'Database'>((searchParams.get('tab') as 'Simulator' | 'Database') || 'Simulator');
  const [size, setSize] = useState<string>(searchParams.get('size') || 'Exalted');
  const [tier, setTier] = useState<string>(searchParams.get('tier') || '4');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const [lang, setLang] = useState<string>(searchParams.get('lang') || 'en');
  const [activeCategory, setActiveCategory] = useState<string | null>(parseUrlCategory(searchParams.get('category')));
  
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'Simulator') params.set('tab', activeTab);
    if (lang !== 'en') params.set('lang', lang);
    if (searchQuery) params.set('q', searchQuery);
    
    if (activeTab === 'Simulator') {
      if (tier !== '4') params.set('tier', tier);
      if (size !== 'Exalted') params.set('size', size);
    } else if (activeTab === 'Database') {
      if (activeCategory) {
        const urlCat = activeCategory === 'Special' ? 'rare' : activeCategory.toLowerCase();
        params.set('category', urlCat);
      }
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [activeTab, lang, tier, size, searchQuery, activeCategory]);

  return {
    activeTab, setActiveTab,
    size, setSize,
    tier, setTier,
    searchQuery, setSearchQuery,
    debouncedSearchQuery,
    lang, setLang,
    activeCategory, setActiveCategory
  };
}
