const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

const replacements = [
    { search: /hsl\(var\(--navy\)([^)]*)\)/g, replace: 'hsl(var(--card)$1)' },
    { search: /hsl\(var\(--gold-light\)([^)]*)\)/g, replace: 'hsl(var(--primary)$1)' },
    { search: /hsl\(var\(--gold\)([^)]*)\)/g, replace: 'hsl(var(--primary)$1)' },
    { search: /bg-gold\/10/g, replace: 'bg-primary/10' },
    { search: /text-gold/g, replace: 'text-primary' },
    { search: /\bTrain\b\s+className/g, replace: 'Sparkles className' } // Replace Train lucide with Sparkles where used directly if importing Sparkles
];

function processDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
        const fullPath = path.join(currentDir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            for (const rule of replacements) {
                if (rule.search.test(content)) {
                    content = content.replace(rule.search, rule.replace);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(dir);
console.log('Done.');
