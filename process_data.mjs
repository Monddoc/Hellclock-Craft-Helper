import fs from 'fs';
import path from 'path';

const exportDir = '../../../hellclock-data-export-release-2.0';
const dataDir = path.join(exportDir, 'data');
const publicAssetsDir = './public/assets';

if (!fs.existsSync(publicAssetsDir)) {
    fs.mkdirSync(publicAssetsDir, { recursive: true });
}

console.log('Reading data files...');
const relicAffixes = JSON.parse(fs.readFileSync(path.join(dataDir, 'Relic Affixes.json'), 'utf8'))['Relic Affixes'];
const relics = JSON.parse(fs.readFileSync(path.join(dataDir, 'Relics.json'), 'utf8'))['Relics'];
const statsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'Stats.json'), 'utf8'))['Stats'];
const relicConfig = JSON.parse(fs.readFileSync(path.join(dataDir, 'Relic Inventory Config.json'), 'utf8'));

// Some implicit affixes share the same internal name (e.g. two different "Stat - Implicit - Attack Speed"),
// so duplicated names get the numeric id appended to stay unique in the output
const nameCounts = {};
for (const affix of relicAffixes) nameCounts[affix.name] = (nameCounts[affix.name] || 0) + 1;
const affixKey = (affix) => nameCounts[affix.name] > 1 ? `${affix.name} [${affix.id}]` : affix.name;
const affixById = {};
for (const affix of relicAffixes) affixById[affix.id] = affix;

// Build a map of Implicit Affix ID -> Categories (e.g. FuryImbued, Corrupted) and per-size implicit pools.
// An affix can belong to several categories (e.g. Minor Phys Damage is Fury, Discipline and Faith)
const implicitCategoryMap = {};
const implicitAllowedSizesMap = {};
const implicitPoolsBySize = {};
if (relicConfig && relicConfig.relicSizeConfigs) {
    for (const [sizeName, size] of Object.entries(relicConfig.relicSizeConfigs)) {
        if (size.implicitAffixPool) {
            implicitPoolsBySize[sizeName] = {};
            for (const [category, entries] of Object.entries(size.implicitAffixPool)) {
                const pool = {};
                let totalWeight = 0;
                for (const entry of entries) {
                    const match = entry.value.match(/\[(\d+)\]/);
                    if (match && affixById[match[1]]) {
                        const id = match[1];
                        if (!implicitCategoryMap[id]) implicitCategoryMap[id] = [];
                        if (!implicitCategoryMap[id].includes(category)) implicitCategoryMap[id].push(category);
                        if (!implicitAllowedSizesMap[id]) implicitAllowedSizesMap[id] = new Set();
                        implicitAllowedSizesMap[id].add(sizeName);
                        pool[affixKey(affixById[id])] = { weight: entry.weight };
                        totalWeight += entry.weight;
                    }
                }
                for (const poolEntry of Object.values(pool)) poolEntry.chance = (poolEntry.weight / totalWeight) * 100;
                implicitPoolsBySize[sizeName][category] = pool;
            }
        }
    }
}

// Build a fast lookup dictionary for Stat localization based on eStatDefinition internal name
const statsDict = {};
const statFormatDict = {};
for (const stat of statsData) {
    if (stat.localizedName) {
        statsDict[stat.name] = parseLocalization(stat.localizedName);
    }
    statFormatDict[stat.name] = stat.eStatFormat;
}

const statusData = JSON.parse(fs.readFileSync(path.join(dataDir, 'Status.json'), 'utf8'))['Status'];
const skillsConfig = JSON.parse(fs.readFileSync(path.join(dataDir, 'Skills Config.json'), 'utf8'));
const skillsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'Skills.json'), 'utf8'))['Skills'];
const skillNameDict = {};
for (const skill of skillsData) {
    if (skill.localizedName) skillNameDict[skill.name] = parseLocalization(skill.localizedName);
}
const statusNameDict = {};
for (const status of statusData) {
    if (status.statusDisplayInfo && status.statusDisplayInfo.nameKey) {
        statusNameDict[status.name] = parseLocalization(status.statusDisplayInfo.nameKey);
    }
}

// Value formats mirror the game's FormatExtensions / ModifierExtensions:
// 'percent' (0.1 => 10%), 'mult' (1.1 => 10%[x]), 'multAdd' (1.1 => 10%[+]), 'decPercent' (1.1 => 10%),
// 'rounded' (floored integer), 'int' and 'default' (up to 2 decimals)
function getStatValueFormat(modifierType, statName) {
    if (modifierType === 'Multiplicative') return 'mult';
    if (modifierType === 'MultiplicativeAdditive') return 'multAdd';
    return statFormatDict[statName] === 'PERCENTAGE' ? 'percent' : 'int';
}

function getVariableValueFormat(variableFormat) {
    switch (variableFormat) {
        case 'Multiplicative': return 'mult';
        case 'MultiplicativeAdditive': return 'multAdd';
        case 'Percentage': return 'percent';
        case 'Rounded': return 'rounded';
        default: return 'default';
    }
}

// Upgrade bonus per relic upgrade level (RelicAffixDefinition.RemapValueWithUpgrade)
function getUpgradeConfig(affix) {
    if (affix.upgradeModifierOverride) {
        return { type: affix.modifierType, levels: affix.upgradeModifierOverride };
    }
    const config = (affix.relicUpgradeModifierConfig && affix.relicUpgradeModifierConfig.upgradeModifier) ? affix.relicUpgradeModifierConfig : relicConfig.defaultRelicUpgradeModifier;
    return { type: config.modifierType, levels: config.upgradeModifier };
}

function parseLocalization(locArray) {
    if (!locArray) return {};
    const result = {};
    for (const loc of locArray) {
        if (loc.langCode && loc.langTranslation) {
            let text = loc.langTranslation;
            if (text.startsWith('TNF:(') && text.endsWith(')')) {
                text = text.substring(5, text.length - 1);
            }
            text = text.replace(/Stat - Implicit - /ig, '');
            result[loc.langCode] = text;
        }
    }
    return result;
}

const sizesData = {};
const processedSizes = new Set();
const craftableSet = new Set();

for (const relic of relics) {
    if (!relic.eRelicSize || processedSizes.has(relic.eRelicSize)) continue;
    if (relic.type !== 'RelicBaseDefinition') continue;
    
    processedSizes.add(relic.eRelicSize);

    const sizeData = {
        primaryPool: {},
        secondaryPool: {}
    };

    let totalPrimaryWeight = 0;
    if (relic.primaryAffixPool) {
        for (const entry of relic.primaryAffixPool) {
            totalPrimaryWeight += entry.weight;
            craftableSet.add(entry.value.name);
        }
        for (const entry of relic.primaryAffixPool) {
            sizeData.primaryPool[entry.value.name] = { weight: entry.weight, chance: (entry.weight / totalPrimaryWeight) * 100 };
        }
    }

    let totalSecondaryWeight = 0;
    if (relic.secondaryAffixPool) {
        for (const entry of relic.secondaryAffixPool) {
            totalSecondaryWeight += entry.weight;
            craftableSet.add(entry.value.name);
        }
        for (const entry of relic.secondaryAffixPool) {
            sizeData.secondaryPool[entry.value.name] = { weight: entry.weight, chance: (entry.weight / totalSecondaryWeight) * 100 };
        }
    }
    sizeData.implicitPools = implicitPoolsBySize[relic.eRelicSize] || {};
    sizesData[relic.eRelicSize] = sizeData;
}

const extractedAffixes = {};

function pascalToSpaced(str) {
    if (!str) return "";
    return str.replace(/([A-Z])/g, ' $1').trim().replace('Additional ', '');
}

for (const affix of relicAffixes) {
    const id = affixKey(affix); // Internal name (plus numeric id when the name is duplicated) as unique ID
    const implicitCategories = implicitCategoryMap[affix.id] || [];
    const implicitCategory = implicitCategories[0] || null;
    
    // FILTER: Only extract affixes that can actually be crafted or dropped normally
    if (!craftableSet.has(id) && !implicitCategory && affix.eAffixRarity !== 'Special') {
        continue;
    }
    const blockedSizes = Array.isArray(affix.blockCraftOnRelicSizes) ? affix.blockCraftOnRelicSizes : (affix.blockCraftOnRelicSizes ? [affix.blockCraftOnRelicSizes] : []);
    
    const tiers = {};
    if (affix.tierRollRanges) {
        for (const t of affix.tierRollRanges) {
            tiers[t.tier] = { min: t.rollRange[0], max: t.rollRange[1] };
        }
    }

    const nameLoc = parseLocalization(affix.nameLocalizationKey);
    const descLoc = parseLocalization(affix.description);
    
    if (implicitCategory) {
        const allowedSizes = implicitAllowedSizesMap[affix.id] || new Set();
        const allSizes = ['Small', 'Large', 'Grand', 'Exalted'];
        const implicitBlocked = allSizes.filter(s => !allowedSizes.has(s));
        for (const s of implicitBlocked) {
            if (!blockedSizes.includes(s)) blockedSizes.push(s);
        }
    }
    
    // DYNAMIC BLOCKED SIZES CHECK (for all affixes)
    const allSizesCheck = ['Small', 'Large', 'Grand', 'Exalted'];
    for (const s of allSizesCheck) {
        if (!sizesData[s]) continue;
        if (!sizesData[s].primaryPool[id] && !sizesData[s].secondaryPool[id] && !implicitCategory && affix.eAffixRarity !== 'Special') {
            if (!blockedSizes.includes(s)) blockedSizes.push(s);
        }
    }
    
    // Attempt to resolve the stat name dictionary
    const statTarget = affix.eStatDefinition || affix.eStatRegen || affix.name;
    let statLoc = {};
    
    if (statsDict[statTarget]) {
        statLoc = statsDict[statTarget];
    } else {
        let fallbackName = pascalToSpaced(statTarget).trim();
        fallbackName = fallbackName.replace(/^.* - Implicit - /i, '');
        if (fallbackName.includes('Skill Definition') || fallbackName.includes('Definition')) {
            fallbackName = fallbackName.replace(/Skill Definition/ig, '').replace(/Definition/ig, '').trim() + ' Skill Level';
        }
        if (fallbackName.startsWith('TNF:(') && fallbackName.endsWith(')')) {
            fallbackName = fallbackName.substring(5, fallbackName.length - 1);
        }
        statLoc = { 'en': fallbackName }; 
    }
    
    // Describe how each {n} placeholder of the description is filled, following each affix type's
    // GetLocalizedDescription in the game code. 'roll' is the rolled value, 'text' a localized string,
    // 'value' a fixed number and 'extras' the additional stat modifier lines
    const placeholders = [];
    let rollFormat = 'default';
    let rollPrefix = '';
    let extras = null;
    const statusName = affix.statusDefinition ? (statusNameDict[affix.statusDefinition.name] || {}) : {};

    if (affix.type === 'StatModifierAffixDefinition') {
        rollFormat = getStatValueFormat(affix.statModifierType, affix.eStatDefinition);
        rollPrefix = 'sign';
        placeholders.push({ kind: 'text', loc: statLoc }, { kind: 'roll' });
        const extraMods = affix.additionalStatModifierDefinitions || [];
        if (extraMods.length > 0) {
            placeholders.push({ kind: 'extras' });
            extras = extraMods.map(mod => ({
                statLoc: statsDict[mod.eStatDefinition] || { en: pascalToSpaced(mod.eStatDefinition) },
                factor: mod.value,
                applyRoll: !!affix.applyRollToAdditionalStatModifiers,
                format: getStatValueFormat(mod.modifierType, mod.eStatDefinition)
            }));
        }
    } else if (affix.type === 'SkillLevelAffixDefinition') {
        // The exported names of most skill level affixes are copies of Split Shot's, the game uses the skill's own name
        const skillLoc = skillNameDict[affix.skillDefinition.name] || nameLoc;
        Object.assign(nameLoc, skillLoc);
        rollFormat = 'int';
        rollPrefix = '+';
        placeholders.push({ kind: 'text', loc: skillLoc },{ kind: 'roll' }, { kind: 'value', value: skillsConfig.maxSkillUpgradeLevelBonus, format: 'int' });
    } else if (affix.type === 'RegenOnKillAffixDefinition') {
        rollFormat = affix.flatRegen ? 'int' : 'percent';
        placeholders.push({ kind: 'roll' }, { kind: 'text', loc: statLoc });
    } else if (affix.type === 'StatusMaxStacksAffixDefinition') {
        rollFormat = affix.eModifierType === 'Additive' ? 'int' : getStatValueFormat(affix.eModifierType);
        rollPrefix = 'sign';
        placeholders.push({ kind: 'roll' });
        // Max Power/Agility Orbs have no translated description in the game ("TNF"), so give them a value slot
        for (const lang of Object.keys(descLoc)) {
            if (!descLoc[lang].includes('{0}')) descLoc[lang] = `{0} ${descLoc[lang]}`;
        }
    } else if (affix.type === 'StatusIntensityAffixDefinition') {
        rollFormat = 'decPercent';
        rollPrefix = 'sign';
        placeholders.push({ kind: 'text', loc: statusName }, { kind: 'roll' });
    } else if (affix.type === 'SkillBehaviorAffixDefinition') {
        const variables = (affix.behaviorData && affix.behaviorData.variables && affix.behaviorData.variables.variables) || [];
        const rollVariable = variables.find(v => v.name === affix.rollVariableName);
        rollFormat = rollVariable ? getVariableValueFormat(rollVariable.eSkillEffectVariableFormat) : 'default';
        rollPrefix = affix.descriptionValuePrefix || '';
        placeholders.push({ kind: 'roll' });
        for (const locVar of affix.additionalLocalizationVariables || []) {
            const variable = variables.find(v => v.name === locVar.skillEffectVariableReference.valueOrName);
            const variableFormat = locVar.overrideFormat ? locVar.valueFormatOverride : (variable ? variable.eSkillEffectVariableFormat : null);
            placeholders.push({ kind: 'value', value: variable ? variable.baseValue : 0, format: getVariableValueFormat(variableFormat) });
        }
    }

    // The game text "Take {0} damage from Close Enemies" hides that the value is a reduction
    if (id === 'All Skills - Rare - Less Damage Close Enemies Affix') {
            descLoc['en'] = "Reduced damage from Close Enemies by {0}";
            descLoc['pt-br'] = "Dano de inimigos próximos reduzido em {0}";
            descLoc['es'] = "Daño de enemigos cercanos reducido en {0}";
            descLoc['fr'] = "Dégâts subis des ennemis proches réduits de {0}";
            descLoc['de'] = "Schaden durch Gegner in direkter Nähe um {0} reduziert";
            descLoc['pl'] = "Obrażenia od pobliskich wrogów zmniejszone o {0}";
            descLoc['ru'] = "Урон от ближайших врагов снижен на {0}";
            descLoc['ja'] = "近接する敵からのダメージが{0}減少";
            descLoc['uk'] = "Шкода від ближніх ворогів знижена на {0}";
            descLoc['zh-cn'] = "受到近战敌人的伤害减少{0}";
    }

    // Some names are untranslated localization keys (e.g. "LifeRegenAffixName") or missing, so use the
    // description without its values (e.g. "All Maximum Resistances"), or the stat name when nothing is left
    const descAsName = (lang) => (descLoc[lang] || '').replace(/<[^>]+>/g, '').replace(/\{\d+\}/g, '').replace(/\s+/g, ' ').trim();
    const fallbackName = (lang) => descAsName(lang) || statLoc[lang] || statLoc['en'];
    for (const lang of Object.keys(descLoc)) {
        if (!nameLoc[lang] || /^[A-Za-z]+(AffixName|Desc)$/.test(nameLoc[lang])) nameLoc[lang] = fallbackName(lang);
    }

    // Hybrid implicits list every stat on separate lines but are named after one stat only ("Life"), or not at all
    // ("Life Leech" for Life and Life Regen), so name them after all their stats
    if (extras && affix.eAffixRarity === 'Implicit' && Object.values(descLoc).some(d => d.includes('{2}'))) {
        for (const lang of Object.keys(nameLoc)) {
            const stats = [statLoc, ...extras.map(e => e.statLoc)].map(loc => loc[lang] || loc['en']);
            nameLoc[lang] = stats.join(' & ');
        }
    }

    // Extra words that are not in the description template but end up in the displayed text
    const searchLoc = {};
    for (const lang of Object.keys(descLoc)) {
        const words = placeholders.filter(p => p.kind === 'text').map(p => p.loc[lang] || p.loc['en'] || '');
        if (extras) words.push(...extras.map(e => e.statLoc[lang] || e.statLoc['en'] || ''));
        searchLoc[lang] = words.join(' ');
    }

    extractedAffixes[id] = {
        internalId: affix.id,
        internalName: id,
        nameLocalizations: nameLoc,
        descLocalizations: descLoc,
        statLocalizations: statLoc,
        searchLocalizations: searchLoc,
        rarity: affix.eAffixRarity,
        implicitCategory: implicitCategory,
        implicitCategories: implicitCategories,
        placeholders: placeholders,
        rollFormat: rollFormat,
        rollPrefix: rollPrefix,
        extras: extras,
        upgrade: getUpgradeConfig(affix),
        blockedSizes: blockedSizes,
        tiers: tiers
    };
}

    // Removed sizes parsing loop since it's now at the top of the script

// The game writes each additional stat modifier line with the plain "StatModifierAffixDescription" text
const plainStatAffix = relicAffixes.find(a => a.name === 'Stat - Implicit - Gold Gain');

const finalData = {
    affixes: extractedAffixes,
    sizes: sizesData,
    maxUpgradeLevel: relicConfig.maxUpgradeLevel,
    statLineTemplates: parseLocalization(plainStatAffix.description)
};

fs.writeFileSync(path.join(publicAssetsDir, 'data.json'), JSON.stringify(finalData, null, 2));
console.log('Data processed.');
