/**
 * Automated Apple Design Migration Script
 * Applies Apple-style classes across all components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Class replacements mapping
const classReplacements = {
  // Buttons
  'nedbank-button': 'apple-button apple-button-primary',
  'nedbank-button-secondary': 'apple-button apple-button-secondary',
  'bg-blue-600 text-white py-4 rounded-xl': 'apple-button apple-button-primary',
  'bg-gray-900 text-white py-4 rounded-2xl': 'apple-button apple-button-primary',
  'bg-red-600 text-white': 'apple-button apple-button-destructive',
  'bg-gray-100 text-gray-700 rounded-lg': 'apple-button apple-button-secondary',
  
  // Cards
  'bg-white rounded-2xl p-6 shadow-sm border border-gray-100': 'apple-card',
  'bg-white rounded-2xl p-5 shadow-sm border border-gray-100': 'apple-card',
  'bg-white rounded-2xl p-4 shadow-sm': 'apple-card apple-card-compact',
  'bg-white rounded-2xl shadow-sm border border-gray-100': 'apple-card',
  
  // Inputs
  'nedbank-input': 'apple-input',
  
  // Typography
  'text-3xl font-extrabold text-gray-900': 'apple-title',
  'text-2xl font-light text-gray-900': 'apple-title-2',
  'text-xl font-medium text-gray-900': 'apple-title-3',
  'text-lg font-medium text-gray-900': 'apple-headline',
  'text-sm text-gray-600': 'apple-subheadline',
  'text-xs text-gray-500': 'apple-caption',
  
  // Lists
  'border-b border-gray-100 p-4': 'apple-list-item',
  
  // Badges
  'bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs': 'apple-badge apple-badge-blue',
  'bg-green-100 text-green-800 rounded-full px-2 py-1 text-xs': 'apple-badge apple-badge-green',
};

// Inline style replacements
const styleReplacements = {
  '#192BC2': 'var(--apple-blue)',
  '#34C759': 'var(--apple-green)',
  '#FF3B30': 'var(--apple-red)',
  '#FF9500': 'var(--apple-orange)',
  '#F2F2F7': 'var(--bg-secondary)',
  'rgb(25, 43, 194)': 'var(--apple-blue)',
};

function migrateFile(filePath) {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;
  
  // Replace className patterns
  for (const [oldClass, newClass] of Object.entries(classReplacements)) {
    const regex = new RegExp(oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newClass);
      changesMade += matches.length;
      console.log(`  ✓ Replaced "${oldClass.substring(0, 30)}..." (${matches.length}x)`);
    }
  }
  
  // Replace inline styles
  for (const [oldStyle, newStyle] of Object.entries(styleReplacements)) {
    const regex = new RegExp(oldStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newStyle);
      changesMade += matches.length;
      console.log(`  ✓ Replaced color "${oldStyle}" (${matches.length}x)`);
    }
  }
  
  if (changesMade > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Total changes: ${changesMade}`);
  } else {
    console.log(`  ⏭️  No changes needed`);
  }
  
  return changesMade;
}

function migrateDirectory(dirPath) {
  console.log(`\n📁 Scanning directory: ${dirPath}\n`);
  console.log('='.repeat(60));
  
  let totalChanges = 0;
  let filesProcessed = 0;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other directories
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        totalChanges += migrateDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Skip type definition files
      if (!file.endsWith('.d.ts')) {
        const changes = migrateFile(filePath);
        totalChanges += changes;
        filesProcessed++;
      }
    }
  }
  
  return totalChanges;
}

// Main execution
console.log('\n🎨 Apple Design Migration Tool');
console.log('================================\n');

const componentsDir = path.join(__dirname, '../src/components');
const totalChanges = migrateDirectory(componentsDir);

console.log('\n' + '='.repeat(60));
console.log(`\n✨ Migration Complete!`);
console.log(`   Total changes applied: ${totalChanges}`);
console.log(`\n📋 Next Steps:`);
console.log(`   1. Review the changes in your editor`);
console.log(`   2. Test the app: npm run dev`);
console.log(`   3. Check for any visual regressions`);
console.log(`   4. Deploy when ready: vercel --prod\n`);
