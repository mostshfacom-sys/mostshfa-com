const path = require('path');
const Database = require('better-sqlite3');

function main() {
  const sqlitePathArg = process.argv.find((arg) => arg.startsWith('--sqlite='));
  if (!sqlitePathArg) {
    throw new Error('Provide --sqlite=...');
  }

  const sqlitePath = sqlitePathArg.slice('--sqlite='.length);
  const absolutePath = path.isAbsolute(sqlitePath) ? sqlitePath : path.resolve(process.cwd(), sqlitePath);

  const db = new Database(absolutePath, { readonly: true });

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((r) => r.name);

  const drugCols = db.prepare("PRAGMA table_info('drugs')").all().map((r) => r.name);

  process.stdout.write(
    `${JSON.stringify(
      {
        sqlitePath: absolutePath,
        tables: tables.filter((t) => t.includes('drug')),
        drugsColumns: drugCols,
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
