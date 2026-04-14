const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BACKUP_DIR = 'C:\\web\\mostshfa.com\\BU\\04-04-2026';
const BACKUP_PATH = path.join(BACKUP_DIR, 'neon_database_dump.json');

async function backup() {
  console.log('🚀 Starting Database Backup to JSON...');
  
  // Ensure directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Exact model names from schema.prisma
  const models = [
    'user',
    'governorate',
    'city',
    'hospitalType',
    'specialty',
    'hospital',
    'review',
    'workingHour',
    'clinic',
    'lab',
    'pharmacy',
    'drugCategory',
    'drug',
    'articleCategory',
    'article',
    'staff',
    'hospitalStaff',
    'clinicStaff',
    'articleTag',
    'medicalTool',
    'medicineReminder',
    'medicineDose',
    'weightRecord',
    'pressureLog',
    'foodEntry',
    'sleepRecord',
    'fcmToken',
    'contactMessage',
    'rating',
    'favorite',
    'viewLog',
    'analytics',
    'healthTip',
    'visualTip',
    'youtubeVideo',
    'youtubeSyncState',
    'guide',
    'siteSetting'
  ];

  const backupData = {};

  for (const model of models) {
    try {
      if (prisma[model]) {
        console.log(`📦 Backing up model: ${model}...`);
        backupData[model] = await prisma[model].findMany();
      } else {
        console.warn(`⚠️ Model ${model} not found on Prisma client.`);
      }
    } catch (err) {
      console.error(`❌ Error backing up ${model}:`, err.message);
    }
  }

  fs.writeFileSync(BACKUP_PATH, JSON.stringify(backupData, null, 2));
  console.log(`✅ Backup completed! File saved at: ${BACKUP_PATH}`);
  console.log(`📊 Summary: ${Object.keys(backupData).length} tables backed up.`);
}

backup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
