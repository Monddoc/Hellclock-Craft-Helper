import React from 'react';
import { UI_TRANSLATIONS } from './types';
import type { AffixData, ValueFormat, UpgradeConfig } from './types';

export const t = (key: string, currentLang: string) => {
  return UI_TRANSLATIONS[currentLang]?.[key] || UI_TRANSLATIONS['en'][key];
};

// Percentages below these get extra decimals, like the game's UIConfig rounding thresholds
const MIN_VALUE_TO_ROUND_PERCENTAGE = 0.1;
const MIN_VALUE_TO_INCREASE_PERCENTAGE_PRECISION = 0.01;

const trimNumber = (value: number) => String(Math.round(value * 100) / 100);

// Signed amount a value represents, e.g. a 1.1 multiplier is +0.1 (10%)
const toAmount = (value: number, format: ValueFormat) => {
  if (format === 'mult' || format === 'multAdd' || format === 'decPercent') return value - 1;
  if (format === 'rounded') return Math.floor(value);
  return value;
};

// Mirrors FormatExtensions.Format for the absolute amount (signs are handled by the caller)
const formatAmount = (amount: number, format: ValueFormat) => {
  const abs = Math.abs(amount);
  switch (format) {
    case 'percent':
    case 'mult':
    case 'multAdd':
    case 'decPercent': {
      const rounded = Math.round(abs * 10000) / 10000;
      let pct: number;
      if (abs < MIN_VALUE_TO_INCREASE_PERCENTAGE_PRECISION) pct = Math.floor(rounded * 4000 + 1e-6) / 4000;
      else if (abs < MIN_VALUE_TO_ROUND_PERCENTAGE) pct = Math.floor(rounded * 400 + 1e-6) / 400;
      else pct = Math.floor(abs * 100 + 1e-3) / 100;
      return trimNumber(pct * 100) + '%';
    }
    case 'int':
    case 'rounded':
      return String(Math.round(abs));
    default:
      return trimNumber(abs < 1 ? Math.floor(abs * 400 + 1e-6) / 400 : Math.floor(abs * 4 + 1e-6) / 4);
  }
};

const formatSuffix = (format: ValueFormat) => format === 'mult' ? '[x]' : format === 'multAdd' ? '[+]' : '';

// prefix: 'sign' shows + or - from the value, any other string is written as-is before the absolute value
export const formatRange = (min: number, max: number, format: ValueFormat, prefix: string) => {
  // Reductions roll from the biggest amount (e.g. 0.7 to 0.75 is 30% to 25%), show them smallest first
  const [low, high] = Math.abs(toAmount(min, format)) <= Math.abs(toAmount(max, format)) ? [min, max] : [max, min];
  const minAmount = toAmount(low, format);
  const maxAmount = toAmount(high, format);
  const minText = formatAmount(minAmount, format);
  const maxText = formatAmount(maxAmount, format);
  const sign = prefix === 'sign' ? (maxAmount < 0 ? '-' : '+') : prefix;
  const range = minText === maxText ? minText : `${minText}–${maxText}`;
  return `${sign}${range}${formatSuffix(format)}`;
};

// RelicAffixDefinition.RemapValueWithUpgrade
export const applyUpgrade = (value: number, upgrade: UpgradeConfig | undefined, level: number) => {
  if (!upgrade || !upgrade.levels) return value;
  const modifier = upgrade.levels[level] ?? (upgrade.type === 'Additive' ? 0 : 1);
  if (upgrade.type === 'Additive') return value + modifier;
  if (upgrade.type === 'MultiplicativeAdditive') return (value - 1) * modifier + 1;
  return value * modifier;
};

const withLineBreaks = (text: string, keyPrefix: string): React.ReactNode[] =>
  text.split('\n').flatMap((line, i) => i === 0 ? [line] : [React.createElement('br', { key: `${keyPrefix}-br${i}` }), line]);

export const formatAffixDescription = (
  affix: AffixData,
  lang: string,
  min: number,
  max: number,
  upgradeLevel: number,
  statLineTemplates: Record<string, string>
): React.ReactNode => {
  const template = (affix.descLocalizations[lang] || affix.descLocalizations['en'] || '')
    .replace(/<style="[^"]*">/g, '')
    .replace(/<\/style>/g, '');
  if (!template) return null;

  const rollMin = applyUpgrade(min, affix.upgrade, upgradeLevel);
  const rollMax = applyUpgrade(max, affix.upgrade, upgradeLevel);
  const rollSpan = (key: string) => React.createElement('span', { className: 'affix-roll', key },
    formatRange(rollMin, rollMax, affix.rollFormat, affix.rollPrefix));

  const placeholders = affix.placeholders || [];
  const nodes: React.ReactNode[] = [];
  template.split(/\{(\d+)\}/).forEach((part, i) => {
    if (i % 2 === 0) {
      nodes.push(...withLineBreaks(part, `t${i}`));
      return;
    }
    const placeholder = placeholders[Number(part)];
    if (!placeholder) return;
    if (placeholder.kind === 'roll') {
      nodes.push(rollSpan(`r${i}`));
    } else if (placeholder.kind === 'text') {
      nodes.push(placeholder.loc[lang] || placeholder.loc['en'] || '');
    } else if (placeholder.kind === 'value') {
      nodes.push(React.createElement('span', { className: 'affix-roll', key: `v${i}` },
        formatRange(placeholder.value, placeholder.value, placeholder.format, '')));
    } else if (placeholder.kind === 'extras') {
      // StatModifierAffixDefinition: one extra line per additional stat modifier
      const lineTemplate = (statLineTemplates[lang] || statLineTemplates['en'] || '{1} {0}')
        .replace(/<style="[^"]*">/g, '')
        .replace(/<\/style>/g, '');
      (affix.extras || []).forEach((extra, j) => {
        const extraMin = extra.applyRoll ? extra.factor * rollMin : extra.factor;
        const extraMax = extra.applyRoll ? extra.factor * rollMax : extra.factor;
        nodes.push(React.createElement('br', { key: `e${i}-${j}-br` }));
        lineTemplate.split(/\{(\d+)\}/).forEach((linePart, k) => {
          if (k % 2 === 0) nodes.push(linePart);
          else if (linePart === '0') nodes.push(extra.statLoc[lang] || extra.statLoc['en'] || '');
          else nodes.push(React.createElement('span', { className: 'affix-roll', key: `e${i}-${j}-${k}` },
            formatRange(extraMin, extraMax, extra.format, 'sign')));
        });
      });
    }
  });

  return React.createElement(React.Fragment, null, ...nodes);
};
