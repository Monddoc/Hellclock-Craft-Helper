import { useState, useEffect } from 'react';
import type { AppData, AffixData } from '../types';
import { LANGUAGES } from '../types';

export function useGameData(debouncedSearchQuery: string, lang: string, setLang: (l: string) => void) {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    fetch('./assets/data.json')
      .then(res => res.json())
      .then((json) => setData(json))
      .catch(err => console.error('Error loading data:', err));
  }, []);

  const matchesSearchLang = (a: AffixData, checkLang: string, q: string) => {
    const lName = (a.nameLocalizations[checkLang] || '').toLowerCase();
    const lDesc = (a.descLocalizations[checkLang] || '').toLowerCase();
    const lStat = (a.statLocalizations[checkLang] || '').toLowerCase();
    return lName.includes(q) || lDesc.includes(q) || lStat.includes(q);
  };

  useEffect(() => {
    if (!debouncedSearchQuery || !data) return;
    const q = debouncedSearchQuery.toLowerCase();
    
    const currentMatches = Object.values(data.affixes).some(a => matchesSearchLang(a, lang, q));
    if (currentMatches) return;

    for (const l of LANGUAGES.map(x => x.code)) {
      if (l === lang) continue;
      const otherMatches = Object.values(data.affixes).some(a => matchesSearchLang(a, l, q));
      if (otherMatches) {
        setLang(l);
        break;
      }
    }
  }, [debouncedSearchQuery, data, lang, setLang]);

  return { data, matchesSearchLang };
}
