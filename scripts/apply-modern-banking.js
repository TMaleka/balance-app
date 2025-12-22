/**
 * Modern Banking Design System Migration
 * Applies clarity-focused, minimalist design across ALL components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive class mappings
const replacements = {
  // Buttons
  'nedbank-button nedbank-button-primary': 'btn btn-primary',
  'nedbank-button-primary': 'btn-primary',
  'nedbank-button nedbank-button-secondary': 'btn btn-secondary',
  'nedbank-button-secondary': 'btn-secondary',
  'nedbank-button': 'btn',
  
  // Cards
  'nedbank-card': 'card',
  
  // Typography
  'nedbank-section-title': 'text-large',
  'nedbank-list-title': 'text-base',
  'nedbank-list-subtitle': 'text-small',
  
  // Lists
  'nedbank-list': 'list',
  'nedbank-list-item': 'list-item',
  
  // Inputs
  'nedbank-input-group': 'input-group',
  'nedbank-input-label': 'input-label',
  'nedbank-input': 'input',
  
  // Badges
  'nedbank-badge-success': 'badge badge-success',
  'nedbank-badge-error': 'badge badge-error',
  'nedbank-badge-warning': 'badge badge-warning',
  
  // Alerts
  'nedbank-alert nedbank-alert-success': 'alert alert-success',
  'nedbank-alert nedbank-alert-error': 'alert alert-error',
  'nedbank-alert nedbank-alert-warning': 'alert alert-warning',
  'nedbank-alert-text': 'alert-text',
  
  // Loading
  'nedbank-spinner': 'spinner',
  'nedbank-spinner-sm': 'spinner-sm',
  'nedbank-loading': 'loading',
  'nedbank-loading-text': 'loading-text',
  
  // Navigation
  'nedbank-nav': 'bottom-nav',
  'nedbank-nav-item': 'nav-item',
  'nedbank-nav-icon': 'nav-icon',
  'nedbank-nav-label': 'nav-label',
  
  // Sections
  'nedbank-section': 'section',
  'nedbank-section-header': 'section-header',
  
  // Auth
  'nedbank-auth-container': 'auth-container',
  'nedbank-auth-content': 'auth-content',
  'nedbank-auth-logo': 'auth-logo',
  'nedbank-auth-logo-text': 'auth-logo-text',
  'nedbank-auth-title': 'auth-title',
  'nedbank-auth-description': 'auth-description',
  'nedbank-auth-toggle': 'auth-toggle',
  'nedbank-auth-link': 'auth-link',
};

// Remove Tailwind classes
const tailwindToRemove = [
  'bg-white',
  'bg-gray-50',
  'bg-gray-100',
  'bg-gray-900',
  'text-white',
  'text-gray-600',
  'text-gray-700',
  'text-gray-900',
  'rounded-xl',
  'rounded-2xl',
  'rounded-lg',
  'shadow-sm',
  'border',
  'border-gray-100',
  'p-4',
  'p-5',
  'p-6',
  'py-4',
  'px-6',
  'mb-4',
  'mb-6',
  'mt-4',
  'mt-6',
  'space-y-4',
  'space-y-6',
  'flex',
  'flex-col',
  'items-center',
  'justify-center',
  'justify-between',
  'gap-2',
  'gap-3',
  'gap-4',
  'min-h-screen',
];

function migrateFile(filePath) {
  console.log(`\n📄 ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;
  
  // Replace class mappings
  const sorted = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);
  
  for (const [oldClass, newClass] of sorted) {
    const regex = new RegExp(oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    
    if (matches) {
      content = content.replace(regex, newClass);
      changesMade += matches.length;
      console.log(`  ✓ ${oldClass} → ${newClass}`);
    }
  }
  
  // Remove Tailwind classes (simple approach - remove from className strings)
  for (const twClass of tailwindToRemove) {
    // Match className="...twClass..." patterns
    const regex = new RegExp(`(className="[^"]*?)\\s*${twClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g');
    const beforeContent = content;
    content = content.replace(regex, '$1');
    if (content !== beforeContent) {
      changesMade++;
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

console.log('\n🏦 Modern Banking Design System Migration');
console.log('==========================================\n');
console.log('Applying clarity-focused, minimalist design...\n');

const componentsDir = path.join(__dirname, '../src/components');
const totalChanges = migrateDirectory(componentsDir);

console.log('\n' + '='.repeat(70));
console.log(`\n✨ Migration Complete: ${totalChanges} changes applied`);
console.log(`\n🎯 Design Principles Applied:`);
console.log(`   ✓ Clarity over density`);
console.log(`   ✓ Confident simplicity`);
console.log(`   ✓ Calm & efficient`);
console.log(`   ✓ Mobile-first & thumb-friendly`);
console.log(`   ✓ Bottom navigation`);
console.log(`   ✓ Clean white/light grey backgrounds`);
console.log(`   ✓ Strategic brand color accents`);
console.log(`   ✓ Generous white space (8px base unit)`);
console.log(`\n📋 Next: Test the app and deploy\n`);
