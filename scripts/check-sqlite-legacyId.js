require('dotenv').config();

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

function resolveSqlitePath() {
  const args = process.argv.slice(2);
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

  return path.isAbsolute(sqlitePath) ? sqlitePath : path.resolve(process.cwd(), sqlitePath);
}

function safeCount(db, sql) {
  return db.prepare(sql).get().c;
}

function main() {
  const sqlitePath = resolveSqlitePath();
  const db = new Database(sqlitePath, { readonly: true });

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((r) => r.name);

  if (!tables.includes('drugs')) {
    process.stdout.write(`${JSON.stringify({ sqlitePath, tables, hasDrugsTable: false }, null, 2)}\n`);
    return;
  }

  const columns = db.prepare("PRAGMA table_info('drugs')").all().map((r) => r.name);

  const total = safeCount(db, 'SELECT COUNT(*) AS c FROM drugs');
  const slugNonEmpty = safeCount(
    db,
    "SELECT COUNT(*) AS c FROM drugs WHERE slug IS NOT NULL AND trim(slug) <> ''"
  );

  const hasLegacyId = columns.includes('legacy_id');
  const legacyNonNull = hasLegacyId
    ? safeCount(db, 'SELECT COUNT(*) AS c FROM drugs WHERE legacy_id IS NOT NULL')
    : 0;
  const legacyNonEmpty = hasLegacyId
    ? safeCount(
        db,
        "SELECT COUNT(*) AS c FROM drugs WHERE legacy_id IS NOT NULL AND length(trim(cast(legacy_id as text))) > 0"
      )
    : 0;

  const sampleRows = hasLegacyId
    ? db
        .prepare(
          "SELECT slug, legacy_id FROM drugs WHERE legacy_id IS NOT NULL LIMIT 20"
        )
        .all()
    : [];

  process.stdout.write(
    `${JSON.stringify(
      {
        sqlitePath,
        hasDrugsTable: true,
        total,
        slugNonEmpty,
        columns,
        hasLegacyId,
        legacyNonNull,
        legacyNonEmpty,
        sampleRows,
      },
      null,
      2
    )}\n`
  );
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
