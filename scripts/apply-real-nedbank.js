/**
 * REAL Nedbank Money App Design Migration
 * This actually transforms components to match Nedbank's layout
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Real Nedbank class mappings
const replacements = {
  // Remove all apple/nedbank-btn classes and replace with real Nedbank buttons
  'nedbank-btn nedbank-btn-primary': 'nedbank-button nedbank-button-primary',
  'nedbank-btn-primary': 'nedbank-button-primary',
  'nedbank-btn nedbank-btn-secondary': 'nedbank-button nedbank-button-secondary',
  'nedbank-btn-secondary': 'nedbank-button-secondary',
  'nedbank-btn nedbank-btn-danger': 'nedbank-button nedbank-button-primary',
  'nedbank-btn': 'nedbank-button',
  
  // Cards - Nedbank uses simple white cards
  'nedbank-card nedbank-card-sm': 'nedbank-card',
  'nedbank-card-sm': 'nedbank-card',
  'nedbank-card-header': 'nedbank-section-header',
  
  // Typography - Nedbank is simpler
  'nedbank-h1': 'nedbank-section-title',
  'nedbank-h2': 'nedbank-section-title',
  'nedbank-h3': 'nedbank-list-title',
  'nedbank-h4': 'nedbank-list-title',
  'nedbank-body-sm': 'nedbank-list-subtitle',
  'nedbank-caption': 'nedbank-list-subtitle',
  
  // Remove complex utility classes
  'nedbank-flex nedbank-flex-col': '',
  'nedbank-flex-col': '',
  'nedbank-items-center': '',
  'nedbank-justify-center': '',
  'nedbank-justify-between': '',
  'nedbank-text-center': '',
  
  // Simplify gaps and spacing
  'nedbank-gap-2': '',
  'nedbank-gap-4': '',
  'nedbank-gap-6': '',
  'nedbank-mt-2': '',
  'nedbank-mt-4': '',
  'nedbank-mt-6': '',
  'nedbank-mt-8': '',
  'nedbank-mb-2': '',
  'nedbank-mb-4': '',
  'nedbank-mb-6': '',
  'nedbank-mb-8': '',
  
  // Navigation
  'nedbank-nav-item active': 'nedbank-nav-item active',
  
  // Badges
  'nedbank-badge nedbank-badge-success': 'nedbank-badge-success',
  'nedbank-badge nedbank-badge-error': 'nedbank-badge-error',
  'nedbank-badge-info': 'nedbank-badge-success',
  
  // Animations - Nedbank doesn't use these
  'nedbank-fade-in': '',
  'nedbank-scale-in': '',
  'nedbank-slide-up': '',
};

function migrateFile(filePath) {
  console.log(`\n📄 ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;
  
  // Sort by length to replace longer strings first
  const sorted = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);
  
  for (const [oldClass, newClass] of sorted) {
    if (!oldClass) continue;
    
    const regex = new RegExp(oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    
    if (matches) {
      content = content.replace(regex, newClass);
      changesMade += matches.length;
      if (newClass) {
        console.log(`  ✓ ${oldClass.substring(0, 35)}... → ${newClass.substring(0, 35)}...`);
      } else {
        console.log(`  ✓ Removed: ${oldClass.substring(0, 40)}...`);
      }
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

console.log('\n🏦 REAL Nedbank Money App Design Migration');
console.log('==========================================\n');

const componentsDir = path.join(__dirname, '../src/components');
const totalChanges = migrateDirectory(componentsDir);

console.log('\n' + '='.repeat(70));
console.log(`\n✨ Migration Complete: ${totalChanges} changes`);
console.log(`\n🎯 Next: Manually update key components for authentic Nedbank layout`);
console.log(`   - Auth screens need Nedbank green header`);
console.log(`   - Main interface needs bottom navigation`);
console.log(`   - Cards need proper Nedbank styling`);
console.log(`   - Remove unnecessary animations\n`);
