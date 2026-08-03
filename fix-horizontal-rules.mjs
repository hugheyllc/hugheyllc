import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, 'src/content/blog');

const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
let totalRemoved = 0;
let filesModified = 0;

files.forEach(file => {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Split at frontmatter boundary (after second ---)
  const lines = content.split('\n');
  let frontmatterEnd = 0;
  let dashCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      dashCount++;
      if (dashCount === 2) {
        frontmatterEnd = i + 1;
        break;
      }
    }
  }
  
  // Reconstruct with frontmatter intact
  const frontmatter = lines.slice(0, frontmatterEnd).join('\n');
  const body = lines.slice(frontmatterEnd).join('\n');
  
  // Remove horizontal rules from body only
  // Match lines that are ONLY ---, ___, or *** (with optional whitespace)
  const bodyFixed = body.replace(/^\s*(---|___|\*\*\*)\s*$/gm, '');
  const removed = (body.match(/^\s*(---|___|\*\*\*)\s*$/gm) || []).length;
  
  if (removed > 0) {
    const newContent = frontmatter + bodyFixed;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ ${file}: removed ${removed} horizontal rule(s)`);
    totalRemoved += removed;
    filesModified++;
  }
});

console.log(`\n📊 Summary: Removed ${totalRemoved} horizontal rules from ${filesModified} files`);
