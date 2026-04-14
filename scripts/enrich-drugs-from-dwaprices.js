require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');

let prisma = new PrismaClient();

function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  return value.trim() === '';
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/ +/g, ' ')
    .trim();
}

function pickFirstLine(after) {
  const lines = after
    .split('\n')
    .map((l) => normalizeText(l))
    .filter(Boolean);
  return lines[0] || null;
}

function firstAfterLabel(text, label) {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  return pickFirstLine(text.slice(idx + label.length));
}

function extractNumberLike(value) {
  if (!value) return null;
  const m = String(value).match(/[0-9][0-9,\.]+/);
  if (!m) return null;
  return m[0].replace(/,/g, '');
}

function extractBarcode(text) {
  const idx = text.indexOf('رمز الباركود Barcode لدواء');
  if (idx === -1) return null;
  const after = text.slice(idx);
  const lines = after
    .split('\n')
    .map((l) => normalizeText(l))
    .filter(Boolean);

  const labelIndex = lines.findIndex((l) => l.includes('رمز الباركود Barcode لدواء'));
  if (labelIndex === -1) return null;

  const candidate = lines[labelIndex + 1] || null;
  if (!candidate) return null;

  if (
    candidate.includes('رمز الكيو آر') ||
    candidate.includes('الفارماكولوجي') ||
    candidate.includes('دواعي استعمال')
  ) {
    return null;
  }

  const m = candidate.match(/[0-9]{8,}/);
  return m ? m[0] : candidate;
}

function parseDwaPricesDrugPage(html) {
  const $ = cheerio.load(html);
  const text = normalizeText($.text());

  const company = firstAfterLabel(text, 'الشركة المنتجة لدواء');
  const units = firstAfterLabel(text, 'عدد الوحدات لدواء');

  const lastUpdatedPrice = (() => {
    const val = firstAfterLabel(text, 'آخر تحديث / زيادة في سعر لدواء');
    if (!val) return null;
    const m = val.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : val;
  })();

  const oldPrice = (() => {
    const val = firstAfterLabel(text, 'السعر القديم لدواء');
    return extractNumberLike(val) || val;
  })();

  const barcode = extractBarcode(text);

  return {
    company,
    barcode,
    units,
    lastUpdatedPrice,
    oldPrice,
  };
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function recreatePrisma() {
  try {
    await prisma.$disconnect();
  } catch {}
  prisma = new PrismaClient();
}

function isRetryableNeonError(error) {
  if (!error) return false;
  if (error.code === 'P1017') return true;
  const msg = String(error.message || '');
  return msg.includes('Server has closed the connection') || msg.includes('ECONNRESET');
}

async function fetchHtmlWithRetry(url, maxAttempts) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'mostshfa.com enrichment script',
          'Accept-Language': 'ar,en;q=0.9',
        },
        validateStatus: () => true,
      });

      if (res.status !== 200 || typeof res.data !== 'string') {
        throw new Error(`HTTP ${res.status}`);
      }

      return res.data;
    } catch (e) {
      if (attempt >= maxAttempts) throw e;
      const delay = Math.min(30000, 750 * 2 ** (attempt - 1));
      await sleep(delay);
    }
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldApply = args.includes('--apply');

  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = Math.max(1, Number.parseInt(limitArg ? limitArg.split('=')[1] : '50', 10) || 50);

  const delayArg = args.find((a) => a.startsWith('--delayMs='));
  const delayMs = Math.max(0, Number.parseInt(delayArg ? delayArg.split('=')[1] : '800', 10) || 800);

  const outArg = args.find((a) => a.startsWith('--out='));
  const outDir = outArg
    ? outArg.split('=')[1]
    : path.join('C:\\web\\mostshfa.com\\BU\\04-04-2026');

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const logPath = path.join(
    outDir,
    `dwaprices_enrich_${shouldApply ? 'apply' : 'dry'}_${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.jsonl`
  );

  const targetFields = ['company', 'barcode', 'units', 'lastUpdatedPrice', 'oldPrice'];

  const where = {
    legacyId: { not: null },
    OR: targetFields.map((f) => ({ [f]: null })).concat(targetFields.map((f) => ({ [f]: '' }))),
  };

  const drugs = await prisma.drug.findMany({
    where,
    select: {
      id: true,
      slug: true,
      legacyId: true,
      company: true,
      barcode: true,
      units: true,
      lastUpdatedPrice: true,
      oldPrice: true,
    },
    take: limit,
    orderBy: { id: 'asc' },
  });

  const summary = {
    mode: shouldApply ? 'apply' : 'dry-run',
    limit,
    delayMs,
    selected: drugs.length,
    logPath,
    willUpdateCount: 0,
    updatedCount: 0,
    perFieldWillFill: Object.fromEntries(targetFields.map((f) => [f, 0])),
    perFieldUpdated: Object.fromEntries(targetFields.map((f) => [f, 0])),
    skippedNoChange: 0,
    skippedNoLegacyId: 0,
    fetchErrors: 0,
    parseNoData: 0,
  };

  for (let i = 0; i < drugs.length; i += 1) {
    const d = drugs[i];
    if (!d.legacyId) {
      summary.skippedNoLegacyId += 1;
      continue;
    }

    const url = `https://dwaprices.com/med.php?id=${d.legacyId}`;

    process.stdout.write(`(${i + 1}/${drugs.length}) Fetch ${url}\n`);

    let html;
    try {
      html = await fetchHtmlWithRetry(url, 4);
    } catch (e) {
      summary.fetchErrors += 1;
      fs.appendFileSync(
        logPath,
        `${JSON.stringify({ slug: d.slug, legacyId: d.legacyId, url, error: String(e.message || e) })}\n`
      );
      await sleep(delayMs);
      continue;
    }

    const parsed = parseDwaPricesDrugPage(html);

    const data = {};
    for (const field of targetFields) {
      const src = parsed[field];
      const dst = d[field];
      if (isBlank(dst) && !isBlank(src)) {
        data[field] = String(src);
        summary.perFieldWillFill[field] += 1;
      }
    }

    if (!Object.keys(data).length) {
      summary.skippedNoChange += 1;
      fs.appendFileSync(
        logPath,
        `${JSON.stringify({ slug: d.slug, legacyId: d.legacyId, url, action: 'skip', parsed })}\n`
      );
      await sleep(delayMs);
      continue;
    }

    summary.willUpdateCount += 1;

    fs.appendFileSync(
      logPath,
      `${JSON.stringify({ slug: d.slug, legacyId: d.legacyId, url, action: shouldApply ? 'apply' : 'dry', data, parsed })}\n`
    );

    if (!shouldApply) {
      await sleep(delayMs);
      continue;
    }

    let updated = false;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        await prisma.drug.update({ where: { slug: d.slug }, data });
        updated = true;
        break;
      } catch (e) {
        if (!isRetryableNeonError(e) || attempt >= 5) {
          throw e;
        }
        const backoff = Math.min(30000, 750 * 2 ** (attempt - 1));
        process.stdout.write(`Neon retryable error. Reconnecting and retrying in ${backoff}ms...\n`);
        await recreatePrisma();
        await sleep(backoff);
      }
    }

    if (updated) {
      summary.updatedCount += 1;
      for (const field of Object.keys(data)) {
        summary.perFieldUpdated[field] += 1;
      }
    }

    await sleep(delayMs);
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
  });
