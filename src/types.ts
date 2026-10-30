export interface TierData { min: number; max: number; }

export type ValueFormat = 'percent' | 'mult' | 'multAdd' | 'decPercent' | 'rounded' | 'int' | 'default';

export type Placeholder =
  | { kind: 'roll' }
  | { kind: 'text'; loc: Record<string, string> }
  | { kind: 'value'; value: number; format: ValueFormat }
  | { kind: 'extras' };

export interface ExtraStat {
  statLoc: Record<string, string>;
  factor: number;
  applyRoll: boolean;
  format: ValueFormat;
}

export interface UpgradeConfig {
  type: 'Additive' | 'Multiplicative' | 'MultiplicativeAdditive';
  levels: Record<string, number>;
}

export interface AffixData {
  internalId: number;
  internalName: string;
  nameLocalizations: Record<string, string>;
  descLocalizations: Record<string, string>;
  statLocalizations: Record<string, string>;
  searchLocalizations?: Record<string, string>;
  rarity: string;
  implicitCategory?: string;
  implicitCategories?: string[];
  placeholders: Placeholder[];
  rollFormat: ValueFormat;
  rollPrefix: string;
  extras?: ExtraStat[] | null;
  upgrade?: UpgradeConfig;
  blockedSizes: string[];
  tiers: Record<string, TierData>;
}

export interface PoolEntry {
  weight: number;
  chance: number;
}

export interface SizeData {
  primaryPool: Record<string, PoolEntry>;
  secondaryPool: Record<string, PoolEntry>;
  implicitPools: Record<string, Record<string, PoolEntry>>;
}

export interface AppData {
  affixes: Record<string, AffixData>;
  sizes: Record<string, SizeData>;
  maxUpgradeLevel: number;
  statLineTemplates: Record<string, string>;
}

export const ALL_SIZES = ['Small', 'Large', 'Grand', 'Exalted'];

// Relic size filter value that lists the affixes of every size
export const ANY_SIZE = 'Any';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pt-br', label: 'Português (BR)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'pl', label: 'Polski' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'zh-cn', label: '简体中文' }
];

export const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  'en': {
    anySize: 'Any Size',
    affixType: 'Affix Type',
    searchHint: 'Type in any supported language, it switches automatically',
    upgradeLevel: 'Upgrade Level',
    title: 'Hell Clock Craft',
    language: 'Language',
    tierRolls: 'Tier Rolls',
    tier: 'Tier',
    relicSize: 'Relic Size',
    sortBy: 'Sort By',
    nameAZ: 'Name (A-Z)',
    nameZA: 'Name (Z-A)',
    rarity: 'Rarity',
    searchLabel: 'Search Affixes',
    searchPlaceholder: 'Search by name, stat, or description...',
    noRolls: 'Does not roll at this tier',
    craftableOn: 'Craftable on:',
    allSizes: 'All Sizes',
    chance: 'chance',
    noResults: 'No affixes found matching your search.',
    rareAffixes: 'Rare Affixes',
    commonAffixes: 'Common Affixes',
    prefixes: 'Prefixes',
    suffixes: 'Suffixes',
    roll: 'Roll:',
    sortByCorrupted: 'Corrupted',
    sortByFaith: 'Faith Imbued',
    sortByFury: 'Fury Imbued',
    sortByDiscipline: 'Discipline Imbued',
    favoritesOnly: 'Favorites Only'
  },
  'pt-br': {
    anySize: 'Qualquer Tamanho',
    affixType: 'Tipo de Afixo',
    searchHint: 'Digite em qualquer idioma suportado, ele muda automaticamente',
    upgradeLevel: 'Nível de Melhoria',
    title: 'Hell Clock Craft',
    language: 'Idioma',
    tierRolls: 'Grau do Afixo',
    tier: 'Grau',
    relicSize: 'Tamanho da Relíquia',
    sortBy: 'Ordenar Por',
    nameAZ: 'Nome (A-Z)',
    nameZA: 'Nome (Z-A)',
    rarity: 'Raridade',
    searchLabel: 'Buscar Afixos',
    searchPlaceholder: 'Busque por nome, atributo ou descrição...',
    noRolls: 'Não pode ser obtido neste grau',
    craftableOn: 'Pode ser criado em:',
    allSizes: 'Todos os Tamanhos',
    chance: 'chance',
    noResults: 'Nenhum afixo encontrado.',
    rareAffixes: 'Afixos Raros',
    commonAffixes: 'Afixos Comuns',
    prefixes: 'Prefixos',
    suffixes: 'Sufixos',
    roll: 'Valor:',
    favoritesOnly: 'Apenas Favoritos'
  },
  'es': {
    anySize: 'Cualquier Tamaño',
    affixType: 'Tipo de Afijo',
    searchHint: 'Escribe en cualquier idioma compatible, cambia automáticamente',
    upgradeLevel: 'Nivel de Mejora',
    title: 'Hell Clock Craft',
    language: 'Idioma',
    tierRolls: 'Nivel de Afijo',
    tier: 'Nivel',
    relicSize: 'Tamaño de Reliquia',
    sortBy: 'Ordenar Por',
    nameAZ: 'Nombre (A-Z)',
    nameZA: 'Nombre (Z-A)',
    rarity: 'Rareza',
    searchLabel: 'Buscar Afijos',
    searchPlaceholder: 'Buscar por nombre, atributo...',
    noRolls: 'No se puede obtener en este nivel',
    craftableOn: 'Se puede crear en:',
    allSizes: 'Todos los tamaños',
    chance: 'probabilidad',
    noResults: 'No se encontraron afijos.',
    rareAffixes: 'Afijos Raros',
    commonAffixes: 'Afijos Comunes',
    prefixes: 'Prefijos',
    suffixes: 'Sufijos',
    roll: 'Valor:',
    favoritesOnly: 'Solo Favoritos'
  },
  'de': {
    anySize: 'Jede Größe',
    affixType: 'Affix-Typ',
    searchHint: 'In jeder unterstützten Sprache eingeben, sie wechselt automatisch',
    upgradeLevel: 'Aufwertungsstufe',
    language: 'Sprache',
    tierRolls: 'Tier-Rollen',
    tier: 'Tier',
    relicSize: 'Reliktgröße',
    searchLabel: 'Affixe suchen',
    searchPlaceholder: 'Suche nach Name, Wert...',
    noRolls: 'Rollt nicht auf diesem Tier',
    craftableOn: 'Herstellbar auf:',
    allSizes: 'Alle Größen',
    chance: 'Chance',
    noResults: 'Keine Affixe gefunden.',
    rareAffixes: 'Seltene Affixe',
    commonAffixes: 'Gewöhnliche Affixe',
    prefixes: 'Präfixe',
    suffixes: 'Suffixe',
    roll: 'Wert:',
    favoritesOnly: 'Nur Favoriten'
  }
};
