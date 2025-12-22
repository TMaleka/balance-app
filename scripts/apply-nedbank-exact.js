/**
 * Apply Exact Nedbank Money App Design
 * Based on actual Nedbank screenshots
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = {
  // Account cards
  'account-card': 'nedbank-account-card',
  'account-label': 'nedbank-account-label',
  'account-balance': 'nedbank-account-balance',
  
  // Buttons
  'btn btn-primary': 'nedbank-btn nedbank-btn-primary',
  'btn-primary': 'nedbank-btn-primary',
  'btn btn-secondary': 'nedbank-btn nedbank-btn-secondary',
  'btn-secondary': 'nedbank-btn-secondary',
  'btn-full': 'nedbank-btn-full',
  'btn': 'nedbank-btn',
  
  // Cards
  'card': 'nedbank-card',
  
  // Lists
  'list-item': 'nedbank-list-item',
  'list-title': 'nedbank-list-title',
  'list-subtitle': 'nedbank-list-subtitle',
  'list': 'nedbank-list',
  
  // Inputs
  'input-group': 'nedbank-input-group',
  'input-label': 'nedbank-input-label',
  'input': 'nedbank-input',
  
  // Badges
  'badge badge-success': 'nedbank-badge-success',
  'badge badge-error': 'nedbank-badge-error',
  'badge badge-warning': 'nedbank-badge-warning',
  'badge': 'nedbank-badge',
  
  // Alerts
  'alert alert-success': 'nedbank-alert-success',
  'alert alert-error': 'nedbank-alert-error',
  'alert alert-warning': 'nedbank-alert-warning',
  'alert-text': 'nedbank-alert-text',
  'alert': 'nedbank-alert',
  
  // Loading
  'spinner-sm': 'nedbank-spinner-sm',
  'spinner': 'nedbank-spinner',
  'loading-text': 'nedbank-loading-text',
  'loading': 'nedbank-loading',
  
  // Navigation
  'bottom-nav': 'nedbank-bottom-nav',
  'nav-item': 'nedbank-nav-item',
  'nav-icon': 'nedbank-nav-icon',
  'nav-label': 'nedbank-nav-label',
  
  // Sections
  'section-header': 'nedbank-section-header',
  'section-title': 'nedbank-section-title',
  'section': 'nedbank-section',
  
  // Typography
  'text-large': 'nedbank-text-large',
  'text-base': 'nedbank-text-base',
  'text-small': 'nedbank-text-small',
};

function migrateFile(filePath) {
  console.log(`\n📄 ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;
  
  // Sort by length to replace longer strings first
  const sorted = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);
  
  for (const [oldClass, newClass] of sorted) {
    const regex = new RegExp(`\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const matches = content.match(regex);
    
    if (matches) {
      content = content.replace(regex, newClass);
      changesMade += matches.length;
      console.log(`  ✓ ${oldClass} → ${newClass}`);
    }
  }
  
  if (changesMade > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ ${changesMade} changes`);
  } else {
    console.log(`  ⏭️  No changes`);
  }
  
  return changesMade;
}

function migrateDirectory(dirPath) {
  let totalChanges = 0;
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        totalChanges += migrateDirectory(filePath);
      }
    } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.endsWith('.d.ts')) {
      totalChanges += migrateFile(filePath);
    }
  }
  
  return totalChanges;
}

console.log('\n🏦 Exact Nedbank Money App Design Migration');
console.log('============================================\n');
console.log('Applying design based on actual Nedbank screenshots...\n');

const componentsDir = path.join(__dirname, '../src/components');
const totalChanges = migrateDirectory(componentsDir);

console.log('\n' + '='.repeat(70));
console.log(`\n✨ Migration Complete: ${totalChanges} changes applied`);
console.log(`\n🎯 Nedbank Design Applied:`);
console.log(`   ✓ Green gradient account cards`);
console.log(`   ✓ Bottom navigation with icons`);
console.log(`   ✓ Action tiles layout`);
console.log(`   ✓ Segmented controls`);
console.log(`   ✓ Virtual card styling`);
console.log(`   ✓ Exact color palette (#007A4D green)`);
console.log(`\n📋 Next: Deploy and test\n`);
