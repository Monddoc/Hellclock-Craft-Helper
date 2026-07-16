import React from 'react';
import { UI_TRANSLATIONS } from './types';

export const t = (key: string, currentLang: string) => {
  return UI_TRANSLATIONS[currentLang]?.[key] || UI_TRANSLATIONS['en'][key];
};
export const formatListDescription = (desc: string, min: number, max: number, statName: string, rollText: string): React.ReactNode => {
  if (!desc) return null;
  
  const is1Value = desc.includes('<style="TooltipValue">{1}</style>');
  const has0 = desc.includes('{0}');
  const has1 = desc.includes('{1}');
  
  let formatted = desc.replace(/<style="[^"]*">/g, '').replace(/<\/style>/g, '');
  
  if (min === 0 && max === 0) {
    return formatted.replace('{0}', statName).replace('{1}', statName);
  }

  const minF = min < 1 ? (min * 100).toFixed(1) + '%' : min.toFixed(1);
  const maxF = max < 1 ? (max * 100).toFixed(1) + '%' : max.toFixed(1);
  
  const rangeSpan = React.createElement('span', { className: 'affix-roll' }, `[${minF} - ${maxF}]`);

  if (!has0 && !has1) {
    return React.createElement(React.Fragment, null,
      formatted,
      React.createElement('br'),
      React.createElement('br'),
      React.createElement('strong', null, rollText),
      ' ',
      rangeSpan,
      ' ',
      statName
    );
  }

  let replace0 = statName;
  let replace1 = statName;
  
  if (is1Value) {
    replace1 = "RANGE_TOKEN";
    replace0 = statName;
  } else {
    replace0 = "RANGE_TOKEN";
    replace1 = statName;
  }

  formatted = formatted.replace('{0}', replace0).replace('{1}', replace1);
  const parts = formatted.split("RANGE_TOKEN");
  
  return React.createElement(React.Fragment, null,
    parts.map((part, index) => 
      React.createElement(React.Fragment, { key: index },
        part,
        index < parts.length - 1 ? rangeSpan : null
      )
    )
  );
};
