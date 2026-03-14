/**
 * Fix Barrel Imports Script
 * This script converts all barrel imports from @/components/ui to direct imports
 * to fix the webpack module factory error in Next.js 14.2.18
 */

const fs = require('fs');
const path = require('path');

// Map of component names to their file paths
const componentMap = {
  'Button': '@/components/ui/Button',
  'Input': '@/components/ui/Input',
  'Card': '@/components/ui/Card',
  'CardHeader': '@/components/ui/Card',
  'CardTitle': '@/components/ui/Card',
  'CardDescription': '@/components/ui/Card',
  'CardContent': '@/components/ui/Card',
  'CardFooter': '@/components/ui/Card',
  'Badge': '@/components/ui/Badge',
  'Skeleton': '@/components/ui/Skeleton',
  'HospitalCardSkeleton': '@/components/ui/Skeleton',
  'HospitalListSkeleton': '@/components/ui/Skeleton',
  'HospitalDetailSkeleton': '@/components/ui/Skeleton',
  'SearchResultsSkeleton': '@/components/ui/Skeleton',
  'Pagination': '@/components/ui/Pagination',
  'Rating': '@/components/ui/Rating',
  'OptimizedImage': '@/components/ui/OptimizedImage',
  'LazyLoad': '@/components/ui/LazyLoad',
};

// Group components by their source file
function groupBySource(components) {
  const groups = {};
  components.forEach(comp => {
    const source = componentMap[comp];
    if (source) {
      if (!groups[source]) groups[source] = [];
      groups[source].push(comp);
    }
  });
  return groups;
}

// Generate new import statements
function generateImports(groups) {
  return Object.entries(groups)
    .map(([source, components]) => {
      return `import { ${components.join(', ')} } from '${source}';`;
    })
    .join('\n');
}

// Process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Match barrel imports from @/components/ui
  const barrelImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/components\/ui['"];?/g;
  
  let match;
  let hasChanges = false;
  
  while ((match = barrelImportRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const importedItems = match[1]
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('type '));
    
    if (importedItems.length > 0) {
      const groups = groupBySource(importedItems);
      const newImports = generateImports(groups);
      
      content = content.replace(fullMatch, newImports);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Recursively find all .tsx files
function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main
console.log('🔧 Fixing barrel imports...\n');

const srcDir = path.join(__dirname, 'src');
const files = findTsxFiles(srcDir);

let fixedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✨ Done! Fixed ${fixedCount} files.`);
