import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { AffixData } from '../types';
import { ALL_SIZES } from '../types';
import { t, formatAffixDescription } from '../utils';

interface AffixItemProps {
  affixDef: AffixData;
  chance?: number;
  // Relic sizes the affix rolls on, shown when listing every size
  sizes?: string[];
  category?: string;
  tier: string;
  upgradeLevel: number;
  statLineTemplates: Record<string, string>;
  lang: string;
  isFavorite: boolean;
  toggleFavorite: (internalName: string) => void;
}

export const AffixItem: React.FC<AffixItemProps> = ({
  affixDef, chance, sizes, category, tier, upgradeLevel, statLineTemplates, lang, isFavorite, toggleFavorite
}) => {
  // The badge shows the pool being listed
  const categories = category ? [category] : [];
  const mainCategory = categories[0];
  const tierStats = affixDef.tiers[tier];
  const min = tierStats ? tierStats.min : 0;
  const max = tierStats ? tierStats.max : 0;
  
  const localName = affixDef.nameLocalizations[lang] || affixDef.nameLocalizations['en'] || affixDef.statLocalizations[lang] || affixDef.statLocalizations['en'] || 'Unknown';

  let displayRarity = affixDef.rarity === 'Special' ? 'Rare' : affixDef.rarity;
  let rarityClass = `rarity-${affixDef.rarity.toLowerCase()}`;
  
  if (mainCategory) {
    displayRarity = `Implicit - ${categories.map(c => c.replace('Imbued', ' Imbued')).join(' / ')}`;
    rarityClass = `rarity-${mainCategory.toLowerCase()}`;
  }

  const hoverClass = affixDef.rarity === 'Special' ? 'special-hover' : 'common-hover';
  const itemSpecialClass = affixDef.rarity === 'Special' ? 'item-special' : '';

  const locationsText = sizes && (sizes.length === ALL_SIZES.length ? t('allSizes', lang) : sizes.join(', '));

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
      transition={{ duration: 0.15 }}
      className={`affix-item ${hoverClass} ${itemSpecialClass} ${mainCategory ? 'rarity-' + mainCategory.toLowerCase() : ''}`}
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
            {formatAffixDescription(affixDef, lang, min, max, upgradeLevel, statLineTemplates)}
          </div>
        ) : (
          <div className="affix-desc" style={{ color: '#ef4444' }}>{t('noRolls', lang)}</div>
        )}
        {locationsText && (
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
