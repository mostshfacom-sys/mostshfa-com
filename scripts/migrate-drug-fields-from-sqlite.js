require('dotenv').config();

const path = require('path');
const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');

let prisma = new PrismaClient();

function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  return value.trim() === '';
}

async function main() {
  const args = process.argv.slice(2);
  const shouldApply = args.includes('--apply');

  const chunkArg = args.find((arg) => arg.startsWith('--chunk='));
  const chunkSize = Math.max(
    1,
    Math.min(
      1000,
      Number.parseInt(
        chunkArg ? chunkArg.slice('--chunk='.length) : shouldApply ? '50' : '200',
        10
      ) || (shouldApply ? 50 : 200)
    )
  );

  const sqlitePathArg = args.find((arg) => arg.startsWith('--sqlite='));
  const sqlitePath = sqlitePathArg
    ? sqlitePathArg.slice('--sqlite='.length)
    : process.env.SQLITE_DRUGS_DB;

  if (!sqlitePath) {
    throw new Error('Missing SQLite path. Provide --sqlite=... or set SQLITE_DRUGS_DB env var.');
  }

  const absoluteSqlitePath = path.isAbsolute(sqlitePath)
    ? sqlitePath
    : path.resolve(process.cwd(), sqlitePath);

  const sqliteToNeonFieldMap = {
    company: 'company',
    barcode: 'barcode',
    units: 'units',
    last_updated_price: 'lastUpdatedPrice',
    old_price: 'oldPrice',
    unit_price: 'unitPrice',
  };

  const sqliteFields = Object.keys(sqliteToNeonFieldMap);
  const neonFields = Array.from(new Set(Object.values(sqliteToNeonFieldMap)));

  const sqlite = new Database(absoluteSqlitePath, { readonly: true });
  const sqliteColumns = sqlite
    .prepare("PRAGMA table_info('drugs')")
    .all()
    .map((row) => row.name);

  const missingInSqlite = sqliteFields.filter((f) => !sqliteColumns.includes(f));
  if (missingInSqlite.length) {
    throw new Error(`SQLite drugs table is missing columns: ${missingInSqlite.join(', ')}`);
  }

  if (!sqliteColumns.includes('slug')) {
    throw new Error('SQLite drugs table is missing column: slug');
  }

  const sqliteRows = sqlite
    .prepare(
      `SELECT slug, ${sqliteFields.join(', ')} FROM drugs WHERE slug IS NOT NULL AND trim(slug) <> ''`
    )
    .all();

  const neonDrugs = await prisma.drug.findMany({
    select: {
      slug: true,
      company: true,
      barcode: true,
      units: true,
      lastUpdatedPrice: true,
      oldPrice: true,
      unitPrice: true,
    },
  });

  const neonBySlug = new Map(neonDrugs.map((d) => [d.slug, d]));

  const updates = [];
  const stats = {
    sqliteTotal: sqliteRows.length,
    neonTotal: neonDrugs.length,
    slugMatched: 0,
    slugMissingInNeon: 0,
    candidates: 0,
    willUpdate: 0,
    updated: 0,
    perFieldWillFill: Object.fromEntries(neonFields.map((f) => [f, 0])),
    perFieldUpdated: Object.fromEntries(neonFields.map((f) => [f, 0])),
  };

  for (const row of sqliteRows) {
    const slug = String(row.slug);
    const neon = neonBySlug.get(slug);
    if (!neon) {
      stats.slugMissingInNeon += 1;
      continue;
    }

    stats.slugMatched += 1;

    const data = {};

    for (const [sqliteField, neonField] of Object.entries(sqliteToNeonFieldMap)) {
      const srcVal = row[sqliteField];
      const dstVal = neon[neonField];

      if (isBlank(dstVal) && !isBlank(srcVal)) {
        data[neonField] = String(srcVal);
        stats.perFieldWillFill[neonField] += 1;
      }
    }

    const keys = Object.keys(data);
    if (keys.length) {
      stats.candidates += 1;
      updates.push({ slug, data });
    }
  }

  stats.willUpdate = updates.length;

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: shouldApply ? 'apply' : 'dry-run',
        sqlitePath: absoluteSqlitePath,
        chunkSize,
        ...stats,
      },
      null,
      2
    )}\n`
  );

  if (!shouldApply) return;

  async function recreatePrismaClient() {
    try {
      await prisma.$disconnect();
    } catch {}
    prisma = new PrismaClient();
  }

  function isRetryableError(error) {
    if (!error) return false;
    if (error.code === 'P1017') return true;
    const msg = String(error.message || '');
    return msg.includes('Server has closed the connection') || msg.includes('ECONNRESET');
  }

  async function runChunkWithRetry(chunk, attempt = 1) {
    try {
      await prisma.$transaction(
        chunk.map((u) =>
          prisma.drug.update({
            where: { slug: u.slug },
            data: u.data,
          })
        )
      );
    } catch (error) {
      if (!isRetryableError(error) || attempt >= 6) {
        throw error;
      }

      const delayMs = Math.min(30000, 500 * 2 ** (attempt - 1));
      process.stdout.write(`Retryable error on chunk (attempt ${attempt}/6). Waiting ${delayMs}ms then retrying...\n`);
      await recreatePrismaClient();
      await new Promise((r) => setTimeout(r, delayMs));
      return runChunkWithRetry(chunk, attempt + 1);
    }
  }

  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);

    process.stdout.write(
      `Applying ${i + 1}-${Math.min(i + chunk.length, updates.length)} of ${updates.length}...\n`
    );

    await runChunkWithRetry(chunk);

    stats.updated += chunk.length;
  }

  const after = await prisma.drug.findMany({
    where: { slug: { in: updates.slice(0, 5000).map((u) => u.slug) } },
    select: {
      slug: true,
      company: true,
      barcode: true,
      units: true,
      lastUpdatedPrice: true,
      oldPrice: true,
      unitPrice: true,
    },
  });

  const afterBySlug = new Map(after.map((d) => [d.slug, d]));

  for (const u of updates) {
    const rowAfter = afterBySlug.get(u.slug);
    if (!rowAfter) continue;
    for (const f of Object.keys(u.data)) {
      if (!isBlank(rowAfter[f])) stats.perFieldUpdated[f] += 1;
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'apply',
        updated: stats.updated,
        perFieldUpdated: stats.perFieldUpdated,
      },
      null,
      2
    )}\n`
  );
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
