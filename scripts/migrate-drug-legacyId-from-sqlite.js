require('dotenv').config();

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');

let prisma = new PrismaClient();

function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
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
  const defaultSqlitePath = path.resolve(
    process.cwd(),
    '..',
    'mostshfa.com_trae - Copy',
    'prisma',
    'dev.db'
  );

  const sqlitePath = sqlitePathArg
    ? sqlitePathArg.slice('--sqlite='.length)
    : process.env.SQLITE_DRUGS_DB && process.env.SQLITE_DRUGS_DB.trim()
      ? process.env.SQLITE_DRUGS_DB
      : fs.existsSync(defaultSqlitePath)
        ? defaultSqlitePath
        : null;

  if (!sqlitePath) {
    throw new Error('Missing SQLite path. Provide --sqlite=... or set SQLITE_DRUGS_DB env var.');
  }

  const absoluteSqlitePath = path.isAbsolute(sqlitePath)
    ? sqlitePath
    : path.resolve(process.cwd(), sqlitePath);

  const sqlite = new Database(absoluteSqlitePath, { readonly: true });
  const sqliteColumns = sqlite
    .prepare("PRAGMA table_info('drugs')")
    .all()
    .map((row) => row.name);

  const required = ['slug', 'legacy_id'];
  const missing = required.filter((c) => !sqliteColumns.includes(c));
  if (missing.length) {
    throw new Error(`SQLite drugs table is missing columns: ${missing.join(', ')}`);
  }

  const sqliteRows = sqlite
    .prepare(
      "SELECT slug, legacy_id FROM drugs WHERE slug IS NOT NULL AND trim(slug) <> '' AND legacy_id IS NOT NULL"
    )
    .all();

  const neonDrugs = await prisma.drug.findMany({
    select: {
      slug: true,
      legacyId: true,
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
    willFillLegacyId: 0,
    filledLegacyId: 0,
  };

  for (const row of sqliteRows) {
    const slug = String(row.slug);
    const legacyId = row.legacy_id;

    const neon = neonBySlug.get(slug);
    if (!neon) {
      stats.slugMissingInNeon += 1;
      continue;
    }

    stats.slugMatched += 1;

    if (isBlank(neon.legacyId) && !isBlank(legacyId)) {
      stats.candidates += 1;
      stats.willFillLegacyId += 1;
      updates.push({ slug, data: { legacyId: Number.parseInt(String(legacyId), 10) } });
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
      process.stdout.write(
        `Retryable error on chunk (attempt ${attempt}/6). Waiting ${delayMs}ms then retrying...\n`
      );
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
    select: { slug: true, legacyId: true },
  });

  const afterBySlug = new Map(after.map((d) => [d.slug, d]));
  for (const u of updates) {
    const rowAfter = afterBySlug.get(u.slug);
    if (!rowAfter) continue;
    if (!isBlank(rowAfter.legacyId)) stats.filledLegacyId += 1;
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: 'apply',
        updated: stats.updated,
        filledLegacyId: stats.filledLegacyId,
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
