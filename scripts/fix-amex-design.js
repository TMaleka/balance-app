const fs = require('fs');
const path = require('path');

// Component files to update
const componentsToFix = [
  'ExpenseOverview.tsx',
  'UserProfile.tsx',
  'AmexBudgetSettings.tsx'
];

const replacements = [
  // Nedbank classes to Amex classes
  { from: /className="nedbank-card"/g, to: 'className="amex-card"' },
  { from: /className="nedbank-btn nedbank-btn-primary"/g, to: 'className="amex-btn amex-btn-primary"' },
  { from: /className="nedbank-btn nedbank-btn-secondary"/g, to: 'className="amex-btn amex-btn-secondary"' },
  { from: /className="nedbank-text-large"/g, to: 'className="amex-section-title"' },
  { from: /className="nedbank-text-base"/g, to: 'className="amex-card-title"' },
  { from: /className="nedbank-input"/g, to: 'className="amex-input"' },
  { from: /className="nedbank-input-label"/g, to: 'className="amex-label"' },
  { from: /className="nedbank-list"/g, to: 'className="amex-list"' },
  { from: /className="nedbank-list-item"/g, to: 'className="amex-list-item"' },
  { from: /className="nedbank-header"/g, to: 'className="amex-header"' },
  { from: /className="nedbank-content"/g, to: 'className="amex-content"' },
  
  // Color references
  { from: /var\(--nedbank-green\)/g, to: 'var(--amex-blue)' },
  { from: /var\(--space-(\d+)\)/g, to: 'var(--amex-space-$1)' },
  { from: /var\(--text-(\w+)\)/g, to: 'var(--amex-font-size-$1)' },
];

const componentsDir = path.join(__dirname, '..', 'src', 'components');

componentsToFix.forEach(filename => {
  const filePath = path.join(componentsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filename}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filename}`);
  }
});

console.log('\n✨ Amex design migration complete!');
