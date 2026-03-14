const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BACKUP_PATH = 'C:\\web\\mostshfa.com_trae\\BU\\database_dump.json';

async function backup() {
  console.log('🚀 Starting Database Backup to JSON...');
  
  const tables = ['governorate', 'city', 'specialty', 'clinic', 'hospital', 'doctor', 'review', 'user'];
  const backupData = {};

  for (const table of tables) {
    console.log(`📦 Backing up table: ${table}...`);
    backupData[table] = await prisma[table].findMany();
  }

  fs.writeFileSync(BACKUP_PATH, JSON.stringify(backupData, null, 2));
  console.log(`✅ Backup completed! File saved at: ${BACKUP_PATH}`);
}

backup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
