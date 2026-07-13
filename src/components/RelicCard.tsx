import React from 'react';

export interface CraftedAffix {
  id: string;
  name: string;
  formattedDesc: string;
  isRare: boolean;
}

interface RelicCardProps {
  size: string;
  tier: number;
  rarityLevel: 'Normal' | 'Magic' | 'Rare';
  affixes: CraftedAffix[];
  lockedAffixId: string | null;
  isCorrupted: boolean;
  imbuement: string | null;
}

export const RelicCard: React.FC<RelicCardProps> = ({ 
  size, tier, rarityLevel, affixes, lockedAffixId, isCorrupted, imbuement 
}) => {
  
  // Rarity color logic for title
  let titleColor = '#e5e7eb'; // normal
  if (rarityLevel === 'Magic') titleColor = '#60a5fa'; // magic
  if (rarityLevel === 'Rare') titleColor = '#fbbf24'; // rare
  
  // Separate affixes for visual grouping
  const rareAffixes = affixes.filter(a => a.isRare);
  const normalAffixes = affixes.filter(a => !a.isRare);

  return (
    <div className="relic-card" style={{ borderColor: titleColor }}>
      <h2 className="rc-title" style={{ color: titleColor }}>
        {imbuement ? `${imbuement} ` : ''}{size} Relic
      </h2>
      <div className="rc-subtitle">{rarityLevel} {size} Relic</div>
      <div className="rc-subtitle">Tier {tier === 4 ? 'IV' : tier === 3 ? 'III' : tier === 2 ? 'II' : 'I'}</div>
      <div className="rc-stars">✦ ✦ ✦ ✦ ✦</div>
      
      <div className="rc-divider"></div>
      
      <div className="rc-implicit">
        <div className="rc-implicit-icon"></div>
        <span className="rc-implicit-text">+19% All Resistances</span>
      </div>
      
      {(rareAffixes.length > 0 || normalAffixes.length > 0) && <div className="rc-divider"></div>}
      
      {rareAffixes.length > 0 && (
        <div className="rc-affixes" style={{ marginBottom: '0.5rem' }}>
          {rareAffixes.map(affix => (
            <div key={affix.id} className="rc-affix">
              <span className="rc-icon-red">✦</span>
              <span dangerouslySetInnerHTML={{ __html: affix.formattedDesc }} />
            </div>
          ))}
        </div>
      )}
      
      {normalAffixes.length > 0 && (
        <div className="rc-affixes">
          {normalAffixes.map(affix => {
            const isLocked = lockedAffixId === affix.id;
            return (
              <div key={affix.id} className="rc-affix">
                <span className={isLocked ? 'rc-icon-lock' : 'rc-icon-normal'}>
                  {isLocked ? '🔒' : '✦'}
                </span>
                <span dangerouslySetInnerHTML={{ __html: affix.formattedDesc }} />
              </div>
            );
          })}
        </div>
      )}
      
      {isCorrupted && <div className="rc-corrupted">CORRUPTED</div>}
    </div>
  );
};
