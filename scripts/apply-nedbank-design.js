/**
 * Automated Nedbank Design Migration Script
 * Applies Nedbank Money app styling across all components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Class replacements mapping - Apple to Nedbank
const classReplacements = {
  // Buttons
  'apple-button apple-button-primary': 'nedbank-btn nedbank-btn-primary',
  'apple-button-primary': 'nedbank-btn-primary',
  'apple-button apple-button-secondary': 'nedbank-btn nedbank-btn-secondary',
  'apple-button-secondary': 'nedbank-btn-secondary',
  'apple-button apple-button-destructive': 'nedbank-btn nedbank-btn-danger',
  'apple-button-destructive': 'nedbank-btn-danger',
  'apple-button apple-button-text': 'nedbank-btn nedbank-btn-ghost',
  'apple-button': 'nedbank-btn',
  
  // Cards
  'apple-card apple-card-compact': 'nedbank-card nedbank-card-sm',
  'apple-card-compact': 'nedbank-card-sm',
  'apple-card': 'nedbank-card',
  'apple-card-header': 'nedbank-card-header',
  
  // Inputs
  'apple-input': 'nedbank-input',
  
  // Typography
  'apple-title-large': 'nedbank-display',
  'apple-title': 'nedbank-h1',
  'apple-title-2': 'nedbank-h2',
  'apple-title-3': 'nedbank-h3',
  'apple-headline': 'nedbank-h4',
  'apple-body': 'nedbank-body',
  'apple-callout': 'nedbank-body-sm',
  'apple-subheadline': 'nedbank-body-sm',
  'apple-footnote': 'nedbank-caption',
  'apple-caption': 'nedbank-caption',
  
  // Lists
  'apple-list': 'nedbank-list',
  'apple-list-item': 'nedbank-list-item',
  'apple-list-item-clickable': 'nedbank-list-item-clickable',
  
  // Badges
  'apple-badge apple-badge-blue': 'nedbank-badge nedbank-badge-info',
  'apple-badge apple-badge-green': 'nedbank-badge nedbank-badge-success',
  'apple-badge apple-badge-red': 'nedbank-badge nedbank-badge-error',
  'apple-badge apple-badge-gray': 'nedbank-badge nedbank-badge-gray',
  'apple-badge-blue': 'nedbank-badge-info',
  'apple-badge-green': 'nedbank-badge-success',
  'apple-badge-red': 'nedbank-badge-error',
  'apple-badge': 'nedbank-badge',
  
  // Navigation
  'apple-nav': 'nedbank-nav',
  'apple-nav-item': 'nedbank-nav-item',
  'apple-nav-label': 'nedbank-nav-label',
  
  // Animations
  'apple-fade-in': 'nedbank-fade-in',
  'apple-scale-in': 'nedbank-scale-in',
  'apple-slide-up': 'nedbank-slide-up',
  
  // Utilities
  'apple-flex': 'nedbank-flex',
  'apple-flex-col': 'nedbank-flex-col',
  'apple-items-center': 'nedbank-items-center',
  'apple-justify-center': 'nedbank-justify-center',
  'apple-justify-between': 'nedbank-justify-between',
  'apple-text-center': 'nedbank-text-center',
  'apple-gap-2': 'nedbank-gap-2',
  'apple-gap-4': 'nedbank-gap-4',
  'apple-gap-6': 'nedbank-gap-6',
  'apple-mt-2': 'nedbank-mt-2',
  'apple-mt-4': 'nedbank-mt-4',
  'apple-mt-6': 'nedbank-mt-6',
  'apple-mt-8': 'nedbank-mt-8',
  'apple-mb-2': 'nedbank-mb-2',
  'apple-mb-4': 'nedbank-mb-4',
  'apple-mb-6': 'nedbank-mb-6',
  'apple-mb-8': 'nedbank-mb-8',
  'apple-w-full': 'nedbank-w-full',
};

// CSS variable replacements - Apple to Nedbank
const styleReplacements = {
  '--apple-blue': '--nedbank-green',
  '--apple-blue-dark': '--nedbank-green-dark',
  '--apple-green': '--color-success',
  '--apple-red': '--color-error',
  '--apple-orange': '--color-warning',
  'var(--apple-blue)': 'var(--nedbank-green)',
  'var(--apple-blue-dark)': 'var(--nedbank-green-dark)',
  'var(--apple-green)': 'var(--color-success)',
  'var(--apple-red)': 'var(--color-error)',
  'var(--apple-orange)': 'var(--color-warning)',
  '#007AFF': '#007A4D',
  '#0051D5': '#005A38',
  '#34C759': '#00A86B',
  '#FF3B30': '#E63946',
};

function migrateFile(filePath) {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;
  
  // Replace className patterns (order matters - longer strings first)
  const sortedReplacements = Object.entries(classReplacements).sort((a, b) => b[0].length - a[0].length);
  
  for (const [oldClass, newClass] of sortedReplacements) {
    const regex = new RegExp(oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newClass);
      changesMade += matches.length;
      console.log(`  ✓ ${oldClass.substring(0, 30)}... → ${newClass.substring(0, 30)}... (${matches.length}x)`);
    }
  }
  
  // Replace CSS variables and colors
  for (const [oldStyle, newStyle] of Object.entries(styleReplacements)) {
    const regex = new RegExp(oldStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newStyle);
      changesMade += matches.length;
      console.log(`  ✓ ${oldStyle} → ${newStyle} (${matches.length}x)`);
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
  console.log('='.repeat(70));
  
  let totalChanges = 0;
  let filesProcessed = 0;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        totalChanges += migrateDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
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
console.log('\n🏦 Nedbank Design Migration Tool');
console.log('==================================\n');
console.log('Converting Apple design to Nedbank Money app style...\n');

const componentsDir = path.join(__dirname, '../src/components');
const totalChanges = migrateDirectory(componentsDir);

console.log('\n' + '='.repeat(70));
console.log(`\n✨ Migration Complete!`);
console.log(`   Total changes applied: ${totalChanges}`);
console.log(`\n🎨 Nedbank Design Features:`);
console.log(`   • Nedbank green brand color (#007A4D)`);
console.log(`   • Clean, modern card-based layouts`);
console.log(`   • Professional banking interface`);
console.log(`   • Consistent spacing and typography`);
console.log(`\n📋 Next Steps:`);
console.log(`   1. Review the changes in your editor`);
console.log(`   2. Test the app: npm run dev`);
console.log(`   3. Check all pages for consistency`);
console.log(`   4. Deploy when ready: vercel --prod\n`);
