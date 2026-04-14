require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(
    "select current_database() as db, current_user as user, inet_server_addr()::text as server_addr, inet_server_port() as server_port, version() as version"
  );
  process.stdout.write(`${JSON.stringify(rows[0], null, 2)}\n`);
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
