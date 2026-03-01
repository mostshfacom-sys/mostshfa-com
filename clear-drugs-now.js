#!/usr/bin/env node

/**
 * مسح سريع لبيانات الأدوية
 * Quick Clear Drugs Data
 */

const { resetDrugsDatabase } = require('./scripts/reset-drugs-database');

console.log('🚀 مسح سريع لبيانات الأدوية');
console.log('Quick Clear Drugs Data');
console.log('='.repeat(50));

resetDrugsDatabase()
  .then(() => {
    console.log('\n✅ تمت العملية بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشلت العملية:', error.message);
    process.exit(1);
  });