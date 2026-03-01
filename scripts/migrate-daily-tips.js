const fs = require('fs');
const path = require('path');
const { TextDecoder } = require('util');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sqlFilePath = path.join(__dirname, '..', 'base_db', 'mostshfa_db(19).sql');
const shouldReset = process.argv.includes('--reset');
const encodingFlagIndex = process.argv.findIndex((arg) => arg === '--encoding');
const encodingArg = process.argv.find((arg) => arg.startsWith('--encoding='));
const forcedEncoding = encodingArg
  ? encodingArg.split('=')[1]
  : encodingFlagIndex !== -1
  ? process.argv[encodingFlagIndex + 1]
  : null;
const normalizedEncoding = forcedEncoding ? forcedEncoding.trim().toLowerCase() : null;

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const normalizeName = (value) => value.trim().toLowerCase();

const buildTitle = (text) => {
  const cleaned = text
    .replace(/[^a-z0-9\u0600-\u06ff\s]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').filter(Boolean);
  const candidate = words.slice(0, 5).join(' ');
  if (candidate.length >= 4) return candidate;
  return text.trim().slice(0, 40);
};

const unescapeSQL = (value) => {
  if (value === undefined || value === null) return null;
  return value
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\');
};
const ARABIC_REGEX = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LATIN1_REGEX = /[\u00c0-\u00ff]/g;
const BOX_DRAWING_REGEX = /[\u2500-\u259f]/g;
const REPLACEMENT_REGEX = /\uFFFD/g;
const DIGIT_REGEX = /[0-9]/g;
const countMatches = (value, regex) => (value.match(regex) || []).length;
const toUtf8FromLatin1 = (value) => Buffer.from(value, 'latin1').toString('utf8');

const fixMojibake = (value) => {
  if (!value) return value;
  const arabicCount = countMatches(value, ARABIC_REGEX);
  const latin1Count = countMatches(value, LATIN1_REGEX);

  if (arabicCount > 0 && latin1Count <= arabicCount) {
    return value;
  }

  if (latin1Count === 0) {
    return value;
  }

  const recovered = toUtf8FromLatin1(value);
  const recoveredArabic = countMatches(recovered, ARABIC_REGEX);

  if (recoveredArabic > arabicCount) {
    return recovered;
  }

  return value;
};

const looksMojibake = (value) => {
  if (!value) return false;
  const length = value.length || 1;
  const arabicRatio = countMatches(value, ARABIC_REGEX) / length;
  const latin1Ratio = countMatches(value, LATIN1_REGEX) / length;
  const boxDrawingRatio = countMatches(value, BOX_DRAWING_REGEX) / length;
  const replacementCount = countMatches(value, REPLACEMENT_REGEX);

  if (replacementCount > 0) return true;
  if (boxDrawingRatio > 0) return true;
  if (arabicRatio < 0.15 && latin1Ratio > 0.05) return true;
  if (arabicRatio < 0.05 && latin1Ratio > 0.02) return true;
  return false;
};

const looksPlaceholderTip = (value) => {
  if (!value) return false;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return false;

  const hasMarker =
    normalized.includes('النصيحة') ||
    normalized.includes('نص النصيحة') ||
    normalized.startsWith('نصيحة') ||
    normalized.includes('نصيحة');

  if (!hasMarker) return false;

  const withoutWords = normalized
    .replace(/النصيحة/g, '')
    .replace(/نصيحة/g, '')
    .replace(/نص/g, '')
    .replace(/تجريبية/g, '')
    .replace(/تجريبى/g, '')
    .replace(/تجريب/g, '')
    .replace(/عامة/g, '')
    .replace(/عامه/g, '')
    .replace(/[0-9]+/g, '')
    .replace(/[^\u0600-\u06ff\s]+/g, '')
    .replace(/\s+/g, '')
    .trim();

  return withoutWords.length === 0;
};

const looksGibberishArabic = (value) => {
  if (!value) return false;
  const trimmed = value.trim();

  const digitRatio = countMatches(trimmed, DIGIT_REGEX) / (trimmed.length || 1);
  const spaceCountGlobal = (trimmed.match(/\s/g) || []).length;
  const arabicRatioGlobal = countMatches(trimmed, ARABIC_REGEX) / (trimmed.length || 1);
  if (/[0-9]{6,}/.test(trimmed) && arabicRatioGlobal > 0.1) return true;
  if (digitRatio > 0.35 && spaceCountGlobal <= 1 && arabicRatioGlobal > 0.1) return true;

  if (trimmed.length < 25) return false;

  const latinAlphaRatio = countMatches(trimmed, /[A-Za-z]/g) / trimmed.length;
  const arabicRatio = countMatches(trimmed, ARABIC_REGEX) / trimmed.length;
  if (arabicRatio > 0.2 && latinAlphaRatio > 0.08 && (trimmed.match(/\s/g) || []).length <= 2) {
    return true;
  }

  const arabicLetters = (trimmed.match(ARABIC_REGEX) || []).join('');
  if (arabicLetters.length < 8) return false;

  if (/([\u0600-\u06ff]{1,3})\1{5,}/u.test(arabicLetters) && (trimmed.match(/\s/g) || []).length <= 2) {
    return true;
  }

  const spaceCount = (trimmed.match(/\s/g) || []).length;
  if (spaceCount > 3) return false;

  const frequencies = new Map();
  for (const char of arabicLetters) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  const uniqueCount = frequencies.size;
  const maxCount = Math.max(...frequencies.values());
  const maxRatio = maxCount / arabicLetters.length;

  const compactWithLowVariety = uniqueCount <= 8 && maxRatio >= 0.22;
  if (compactWithLowVariety) return true;

  if (digitRatio > 0.25 && uniqueCount <= 10) return true;

  if (arabicLetters.length > 30) {
    const bigrams = new Set();
    for (let i = 0; i < arabicLetters.length - 1; i += 1) {
      bigrams.add(arabicLetters.slice(i, i + 2));
    }
    const bigramRatio = bigrams.size / (arabicLetters.length - 1);
    if (bigramRatio < 0.12) return true;
  }

  return false;
};

const sanitizeTipText = (value) => {
  if (!value) return null;
  const fixed = fixMojibake(value);
  return looksMojibake(fixed) || looksGibberishArabic(fixed) || looksPlaceholderTip(fixed)
    ? null
    : fixed;
};

const sanitizeCategory = (value) => {
  if (!value) return null;
  const fixed = fixMojibake(value);
  return looksMojibake(fixed) || looksGibberishArabic(fixed) ? null : fixed;
};

const parseInsertValues = (section) => {
  const rows = [];
  let i = 0;
  const length = section.length;

  while (i < length) {
    if (section[i] !== '(') {
      i += 1;
      continue;
    }

    i += 1;
    const row = [];
    let value = '';
    let inString = false;

    while (i < length) {
      const char = section[i];

      if (inString) {
        if (char === "'") {
          if (section[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          inString = false;
          i += 1;
          continue;
        }
        value += char;
        i += 1;
        continue;
      }

      if (char === "'") {
        inString = true;
        i += 1;
        continue;
      }

      if (char === ',') {
        row.push(value.trim());
        value = '';
        i += 1;
        continue;
      }

      if (char === ')') {
        row.push(value.trim());
        i += 1;
        break;
      }

      value += char;
      i += 1;
    }

    rows.push(row);
  }

  return rows;
};

const toNullable = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = value.trim();
  if (!normalized || normalized.toUpperCase() === 'NULL') return null;
  return normalized;
};

const normalizeEncoding = (value) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (['windows-1256', 'windows1256', 'win1256', 'cp1256'].includes(normalized)) {
    return 'windows-1256';
  }
  if (['utf8', 'utf-8'].includes(normalized)) {
    return 'utf8';
  }
  return normalized;
};

const decodeBuffer = (buffer, encoding) => {
  if (encoding === 'windows-1256') {
    try {
      return new TextDecoder('windows-1256').decode(buffer);
    } catch (error) {
      return null;
    }
  }
  return buffer.toString('utf8');
};

const extractTipSample = (content, maxRows = 25) => {
  const insertMatch = content.match(/INSERT INTO `daily_tips`[\s\S]*?VALUES\s*([\s\S]*?);/i);
  if (!insertMatch) return '';

  const rows = parseInsertValues(insertMatch[1]);
  const sampleRows = rows.slice(0, maxRows);
  const parts = sampleRows
    .map((row) => {
      if (row.length < 2) return '';
      const rawText = unescapeSQL(toNullable(row[1]));
      return rawText ? rawText.trim() : '';
    })
    .filter(Boolean);

  return parts.join(' ');
};

const scoreSample = (sample) => {
  const length = sample.length || 1;
  const arabicCount = countMatches(sample, ARABIC_REGEX);
  const latin1Count = countMatches(sample, LATIN1_REGEX);
  const replacementCount = countMatches(sample, REPLACEMENT_REGEX);

  return {
    length,
    arabicRatio: arabicCount / length,
    latin1Ratio: latin1Count / length,
    replacementCount,
  };
};

const chooseBestEncoding = (utf8Sample, windowsSample) => {
  const utf8Score = scoreSample(utf8Sample);
  const windowsScore = scoreSample(windowsSample);

  if (utf8Score.replacementCount && !windowsScore.replacementCount) return 'windows-1256';
  if (windowsScore.replacementCount && !utf8Score.replacementCount) return 'utf8';

  const utf8Quality = utf8Score.arabicRatio - utf8Score.latin1Ratio * 1.5;
  const windowsQuality = windowsScore.arabicRatio - windowsScore.latin1Ratio * 1.5;

  if (windowsQuality > utf8Quality + 0.02) return 'windows-1256';
  if (utf8Quality > windowsQuality + 0.02) return 'utf8';

  return utf8Score.replacementCount <= windowsScore.replacementCount ? 'utf8' : 'windows-1256';
};

const warnIfSuspiciousSample = (rawTips) => {
  const sampleText = rawTips
    .slice(0, 30)
    .map((tip) => tip.tipText)
    .filter(Boolean)
    .join(' ');

  if (!sampleText) return;

  const arabicRatio = countMatches(sampleText, ARABIC_REGEX) / sampleText.length;
  const latin1Ratio = countMatches(sampleText, LATIN1_REGEX) / sampleText.length;

  if (arabicRatio < 0.05 && latin1Ratio > 0.05) {
    console.warn(
      '⚠️  Tip sample looks mojibake (low Arabic ratio). Try --encoding utf8 or verify SQL file encoding.'
    );
  }
};

const loadSqlContent = () => {
  const buffer = fs.readFileSync(sqlFilePath);
  const normalized = normalizeEncoding(normalizedEncoding);

  if (normalized) {
    const decoded = decodeBuffer(buffer, normalized);
    if (decoded) {
      return { content: decoded, encoding: normalized, forced: true };
    }
    console.warn(`⚠️  Failed to decode using forced encoding (${normalized}). Falling back to utf8.`);
  }

  const utf8Content = buffer.toString('utf8');
  const windows1256Content = decodeBuffer(buffer, 'windows-1256');

  if (!windows1256Content) {
    return { content: utf8Content, encoding: 'utf8', forced: false };
  }

  const utf8Sample = extractTipSample(utf8Content);
  const windowsSample = extractTipSample(windows1256Content);

  if (!utf8Sample && !windowsSample) {
    return { content: utf8Content, encoding: 'utf8', forced: false };
  }

  const chosenEncoding = chooseBestEncoding(utf8Sample, windowsSample);
  return {
    content: chosenEncoding === 'windows-1256' ? windows1256Content : utf8Content,
    encoding: chosenEncoding,
    forced: false,
  };
};

async function cleanupExistingData() {
  console.log('🧹 Cleaning existing health tips...');
  const deletedTips = await prisma.healthTip.deleteMany({});
  console.log(`🗑️  Deleted ${deletedTips.count} existing health tips.`);

  const categories = await prisma.articleCategory.findMany({
    select: {
      id: true,
      nameAr: true,
      slug: true,
      icon: true,
      color: true,
      _count: {
        select: {
          articles: true,
          healthTips: true,
        },
      },
    },
  });

  const categoriesToDelete = categories.filter((category) => {
    if (category._count.articles > 0 || category._count.healthTips > 0) return false;

    const isLikelyTipCategory =
      category.icon === '💡' || category.color === '#6366f1' || category.slug.startsWith('tips-');

    return isLikelyTipCategory;
  });

  if (!categoriesToDelete.length) {
    console.log('ℹ️  No orphan tip categories to delete.');
    return;
  }

  const preview = categoriesToDelete
    .map((category) => `${category.nameAr} (#${category.id})`)
    .join(', ');
  console.log(`🗑️  Deleting ${categoriesToDelete.length} orphan tip categories: ${preview}`);

  const deletedCategories = await prisma.articleCategory.deleteMany({
    where: { id: { in: categoriesToDelete.map((category) => category.id) } },
  });

  console.log(`🗑️  Deleted ${deletedCategories.count} tip categories.`);
}

async function migrateDailyTips() {
  console.log('🚀 Migrating daily tips into health_tips...');

  const { content: sqlContent, encoding, forced } = loadSqlContent();
  console.log(`📖 Loaded SQL file using ${encoding} decoding${forced ? ' (forced)' : ''}.`);
  const insertRegex = /INSERT INTO `daily_tips`[\s\S]*?VALUES\s*([\s\S]*?);/gi;
  const rawTips = [];
  let match = null;
  let skippedMojibake = 0;
  let skippedGibberish = 0;
  let skippedPlaceholder = 0;
  let skippedEmpty = 0;
  let skippedCategory = 0;

  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const valuesSection = match[1];
    const rows = parseInsertValues(valuesSection);

    rows.forEach((row) => {
      if (row.length < 4) return;
      const [idRaw, tipTextRaw, isActiveRaw, createdAtRaw, categoryRaw] = row;
      const tipTextValue = unescapeSQL(toNullable(tipTextRaw));
      const tipText = sanitizeTipText(tipTextValue);
      if (!tipText) {
        if (tipTextValue) {
          const fixed = fixMojibake(tipTextValue);
          if (looksPlaceholderTip(fixed)) {
            skippedPlaceholder += 1;
          } else if (looksGibberishArabic(fixed)) {
            skippedGibberish += 1;
          } else {
            skippedMojibake += 1;
          }
        } else {
          skippedEmpty += 1;
        }
        return;
      }
      const categoryValue = unescapeSQL(toNullable(categoryRaw));
      const category = sanitizeCategory(categoryValue);
      if (categoryValue && !category) {
        skippedCategory += 1;
      }

      rawTips.push({
        id: Number(idRaw),
        tipText,
        isActive: Number(isActiveRaw) === 1,
        createdAt: toNullable(createdAtRaw),
        category,
      });
    });
  }

  console.log(`✅ Found ${rawTips.length} tips in SQL`);
  const skippedMessages = [];
  if (skippedMojibake) skippedMessages.push(`${skippedMojibake} mojibake tips`);
  if (skippedGibberish) skippedMessages.push(`${skippedGibberish} gibberish tips`);
  if (skippedPlaceholder) skippedMessages.push(`${skippedPlaceholder} placeholder tips`);
  if (skippedEmpty) skippedMessages.push(`${skippedEmpty} empty tips`);
  if (skippedCategory) skippedMessages.push(`${skippedCategory} mojibake categories`);
  if (skippedMessages.length) {
    console.log(`⚠️  Skipped ${skippedMessages.join(', ')}.`);
  }
  warnIfSuspiciousSample(rawTips);

  if (shouldReset) {
    await cleanupExistingData();
  }

  const existingTips = await prisma.healthTip.findMany({
    select: { contentAr: true },
  });
  const existingContent = new Set(
    existingTips
      .map((tip) => tip.contentAr?.trim())
      .filter((content) => Boolean(content))
  );

  const existingCategories = await prisma.articleCategory.findMany({
    select: { id: true, nameAr: true, slug: true },
  });
  const categoryByName = new Map(
    existingCategories.map((category) => [normalizeName(category.nameAr), category.id])
  );
  const existingSlugs = new Set(existingCategories.map((category) => category.slug));

  const uniqueCategories = [...new Set(rawTips.map((tip) => tip.category).filter(Boolean))];

  for (const categoryName of uniqueCategories) {
    const normalized = normalizeName(categoryName);
    if (categoryByName.has(normalized)) continue;

    let slug = slugify(categoryName);
    if (!slug) {
      slug = `tips-${Date.now()}`;
    }

    let uniqueSlug = slug;
    let suffix = 1;
    while (existingSlugs.has(uniqueSlug)) {
      uniqueSlug = `${slug}-${suffix}`;
      suffix += 1;
    }

    const created = await prisma.articleCategory.create({
      data: {
        nameAr: categoryName,
        nameEn: categoryName,
        slug: uniqueSlug,
        icon: '💡',
        color: '#6366f1',
      },
    });

    categoryByName.set(normalized, created.id);
    existingSlugs.add(created.slug);
  }

  const tipsToCreate = [];

  rawTips.forEach((tip) => {
    const content = tip.tipText.trim();
    if (!content || existingContent.has(content)) return;

    const categoryId = tip.category
      ? categoryByName.get(normalizeName(tip.category))
      : null;

    tipsToCreate.push({
      titleAr: buildTitle(content),
      contentAr: content,
      categoryId: categoryId ?? null,
      icon: '💡',
      isActive: tip.isActive,
      createdAt: tip.createdAt ? new Date(tip.createdAt) : new Date(),
    });

    existingContent.add(content);
  });

  console.log(`📝 Preparing to insert ${tipsToCreate.length} new tips...`);

  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < tipsToCreate.length; i += chunkSize) {
    const chunk = tipsToCreate.slice(i, i + chunkSize);
    await prisma.healthTip.createMany({ data: chunk });
    inserted += chunk.length;
    console.log(`  ✓ Inserted ${inserted}/${tipsToCreate.length}`);
  }

  console.log('🎉 Daily tips migration completed.');
}

migrateDailyTips()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
