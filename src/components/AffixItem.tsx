import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { AffixData } from '../types';
import { ALL_SIZES } from '../types';
import { t, formatListDescription } from '../utils';

interface AffixItemProps {
  affixDef: AffixData;
  chance?: number;
  tier: string;
  lang: string;
  activeTab: 'Simulator' | 'Database';
  isFavorite: boolean;
  toggleFavorite: (internalName: string) => void;
}

export const AffixItem: React.FC<AffixItemProps> = ({
  affixDef, chance, tier, lang, activeTab, isFavorite, toggleFavorite
}) => {
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
      className={`affix-item ${hoverClass} ${itemSpecialClass} ${affixDef.implicitCategory ? 'rarity-' + affixDef.implicitCategory.toLowerCase() : ''}`}
    >
      <div className="affix-info">
        <div className="affix-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleFavorite(affixDef.internalName); }}
            title="Toggle Favorite"
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          {localName} 
          <span className={`affix-rarity ${rarityClass}`}>{displayRarity}</span>
        </div>
        {tierStats ? (
          <div className="affix-desc">
            {formatListDescription(localDesc, min, max, localStat, t('roll', lang))}
          </div>
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
