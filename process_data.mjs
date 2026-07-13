import fs from 'fs';
import path from 'path';

const exportDir = '../../hellclock-data-export-release-2.0';
const dataDir = path.join(exportDir, 'data');
const publicAssetsDir = './public/assets';

if (!fs.existsSync(publicAssetsDir)) {
    fs.mkdirSync(publicAssetsDir, { recursive: true });
}

console.log('Reading data files...');
const relicAffixes = JSON.parse(fs.readFileSync(path.join(dataDir, 'Relic Affixes.json'), 'utf8'))['Relic Affixes'];
const relics = JSON.parse(fs.readFileSync(path.join(dataDir, 'Relics.json'), 'utf8'))['Relics'];
const statsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'Stats.json'), 'utf8'))['Stats'];

// Build a fast lookup dictionary for Stat localization based on eStatDefinition internal name
const statsDict = {};
for (const stat of statsData) {
    if (stat.localizedName) {
        const langMap = {};
        for (const loc of stat.localizedName) {
            langMap[loc.langCode] = loc.langTranslation;
        }
        statsDict[stat.name] = langMap;
    }
}

function parseLocalization(locArray) {
    if (!locArray) return {};
    const map = {};
    for (const loc of locArray) {
        map[loc.langCode] = loc.langTranslation;
    }
    return map;
}

const extractedAffixes = {};

function pascalToSpaced(str) {
    if (!str) return "";
    return str.replace(/([A-Z])/g, ' $1').trim().replace('Additional ', '');
}

for (const affix of relicAffixes) {
    const id = affix.name; // Use internal name as unique ID
    const blockedSizes = Array.isArray(affix.blockCraftOnRelicSizes) ? affix.blockCraftOnRelicSizes : (affix.blockCraftOnRelicSizes ? [affix.blockCraftOnRelicSizes] : []);
    
    const tiers = {};
    if (affix.tierRollRanges) {
        for (const t of affix.tierRollRanges) {
            tiers[t.tier] = { min: t.rollRange[0], max: t.rollRange[1] };
        }
    }

    const nameLoc = parseLocalization(affix.nameLocalizationKey);
    const descLoc = parseLocalization(affix.description);
    
    // Attempt to resolve the stat name dictionary
    const statTarget = affix.eStatDefinition || affix.eStatRegen || affix.name;
    let statLoc = {};
    
    if (statsDict[statTarget]) {
        statLoc = statsDict[statTarget];
    } else {
        // Fallback: Use english pascal spaced for all languages if missing from Stats.json
        const fallbackName = pascalToSpaced(statTarget);
        statLoc = { 'en': fallbackName }; 
    }
    
    extractedAffixes[id] = {
        internalId: affix.id,
        internalName: affix.name,
        nameLocalizations: nameLoc,
        descLocalizations: descLoc,
        statLocalizations: statLoc,
        rarity: affix.eAffixRarity,
        blockedSizes: blockedSizes,
        tiers: tiers
    };
}

const sizesData = {};
const processedSizes = new Set();

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
        }
        for (const entry of relic.primaryAffixPool) {
            sizeData.primaryPool[entry.value.name] = { weight: entry.weight, chance: (entry.weight / totalPrimaryWeight) * 100 };
        }
    }

    let totalSecondaryWeight = 0;
    if (relic.secondaryAffixPool) {
        for (const entry of relic.secondaryAffixPool) {
            totalSecondaryWeight += entry.weight;
        }
        for (const entry of relic.secondaryAffixPool) {
            sizeData.secondaryPool[entry.value.name] = { weight: entry.weight, chance: (entry.weight / totalSecondaryWeight) * 100 };
        }
    }
    sizesData[relic.eRelicSize] = sizeData;
}

const finalData = {
    affixes: extractedAffixes,
    sizes: sizesData
};

fs.writeFileSync(path.join(publicAssetsDir, 'data.json'), JSON.stringify(finalData, null, 2));
console.log('Data processed.');
