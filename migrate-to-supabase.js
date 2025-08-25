#!/usr/bin/env node

/**
 * Migration script to help transition from SQLite to Supabase
 * This script can be used to migrate existing data if needed
 */

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

console.log('🔄 CKD Appeals AI - Supabase Migration Helper');
console.log('=============================================\n');

// Check if old SQLite database exists
const sqlitePath = path.join(__dirname, 'database.sqlite');
const hasOldData = fs.existsSync(sqlitePath);

if (hasOldData) {
  console.log('📁 Found existing SQLite database');
  console.log('   This script will help you migrate data to Supabase if needed.\n');
} else {
  console.log('📁 No existing SQLite database found');
  console.log('   You can proceed with fresh Supabase setup.\n');
}

console.log('📋 Migration Steps:');
console.log('1. Set up Supabase project (see SUPABASE_SETUP.md)');
console.log('2. Configure environment variables');
console.log('3. Install new dependencies: npm install');
console.log('4. Start the application: npm start');
console.log('5. The app will automatically create tables in Supabase\n');

if (hasOldData) {
  console.log('⚠️  Note: If you have important data in the SQLite database,');
  console.log('   you may want to export it before proceeding.\n');
  
  console.log('📊 To export SQLite data (optional):');
  console.log('   - Use a SQLite browser tool');
  console.log('   - Export as CSV or SQL');
  console.log('   - Import manually to Supabase if needed\n');
}

console.log('🚀 Ready to proceed?');
console.log('   - Follow the setup guide in SUPABASE_SETUP.md');
console.log('   - Update your environment variables');
console.log('   - Deploy to Vercel with new configuration\n');

console.log('✅ Migration helper complete!');
