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

// Build a map of Implicit Affix ID -> Category (e.g. FuryImbued, Corrupted)
const implicitCategoryMap = {};
const implicitAllowedSizesMap = {};
if (relicConfig && relicConfig.relicSizeConfigs) {
    for (const [sizeName, size] of Object.entries(relicConfig.relicSizeConfigs)) {
        if (size.implicitAffixPool) {
            for (const [category, entries] of Object.entries(size.implicitAffixPool)) {
                for (const entry of entries) {
                    const match = entry.value.match(/\[(\d+)\]/);
                    if (match) {
                        const id = match[1];
                        implicitCategoryMap[id] = category;
                        if (!implicitAllowedSizesMap[id]) implicitAllowedSizesMap[id] = new Set();
                        implicitAllowedSizesMap[id].add(sizeName);
                    }
                }
            }
        }
    }
}

// Build a fast lookup dictionary for Stat localization based on eStatDefinition internal name
const statsDict = {};
for (const stat of statsData) {
    if (stat.localizedName) {
        statsDict[stat.name] = parseLocalization(stat.localizedName);
    }
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
    sizesData[relic.eRelicSize] = sizeData;
}

const extractedAffixes = {};

function pascalToSpaced(str) {
    if (!str) return "";
    return str.replace(/([A-Z])/g, ' $1').trim().replace('Additional ', '');
}

for (const affix of relicAffixes) {
    const id = affix.name; // Use internal name as unique ID
    const implicitCategory = implicitCategoryMap[affix.id] || null;
    
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
    
    let skillName = null;
    if (affix.skillDefinition && affix.skillDefinition.name) {
        let rawName = affix.skillDefinition.name.replace(/Skill Definition/ig, '').replace(/Definition/ig, '').trim();
        skillName = pascalToSpaced(rawName).trim() + ' Skill Level';
    }

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
        fallbackName = fallbackName.replace(/Stat - Implicit - /ig, '');
        if (fallbackName.includes('Skill Definition') || fallbackName.includes('Definition')) {
            fallbackName = fallbackName.replace(/Skill Definition/ig, '').replace(/Definition/ig, '').trim() + ' Skill Level';
        }
        if (fallbackName.startsWith('TNF:(') && fallbackName.endsWith(')')) {
            fallbackName = fallbackName.substring(5, fallbackName.length - 1);
        }
        statLoc = { 'en': fallbackName }; 
    }
    
    // INVERTED MATH FIX
    if (id === 'Mana Cost MultiplierAffix' || id === 'All Skills - Rare - Less Damage Close Enemies Affix' || id === 'Stat - Implicit - Skills Mana Cost') {
        for (const t in tiers) {
            tiers[t].min = 1 - tiers[t].min;
            tiers[t].max = 1 - tiers[t].max;
        }
        
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
        } else if (id === 'Mana Cost MultiplierAffix') {
            statLoc['en'] = "Reduced Mana Cost Multiplier";
            statLoc['pt-br'] = "Multiplicador de Custo de Mana Reduzido";
            statLoc['es'] = "Multiplicador de Coste de Maná Reducido";
            statLoc['de'] = "Reduzierter Manakosten-Multiplikator";
            statLoc['fr'] = "Multiplicateur de coût en mana réduit";
        } else if (id === 'Stat - Implicit - Skills Mana Cost') {
            statLoc['en'] = "Reduced Skills Mana Cost";
            statLoc['pt-br'] = "Custo de Mana de Habilidades Reduzido";
            statLoc['es'] = "Coste de Maná de Habilidades Reducido";
            statLoc['de'] = "Reduzierte Manakosten für Fertigkeiten";
            statLoc['fr'] = "Coût en mana des compétences réduit";
        }
    }
    
    extractedAffixes[id] = {
        internalId: affix.id,
        internalName: affix.name,
        nameLocalizations: nameLoc,
        descLocalizations: descLoc,
        statLocalizations: statLoc,
        rarity: affix.eAffixRarity,
        implicitCategory: implicitCategory,
        skillName: skillName,
        blockedSizes: blockedSizes,
        tiers: tiers
    };
}

    // Removed sizes parsing loop since it's now at the top of the script

const finalData = {
    affixes: extractedAffixes,
    sizes: sizesData
};

fs.writeFileSync(path.join(publicAssetsDir, 'data.json'), JSON.stringify(finalData, null, 2));
console.log('Data processed.');
