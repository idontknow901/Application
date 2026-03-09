const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

const replacements = [
    { search: /gradient-gold/g, replace: 'bg-primary' },
    { search: /text-gradient-gold/g, replace: 'text-primary' },
    { search: /text-gold-light/g, replace: 'text-primary/90' },
    { search: /text-gold/g, replace: 'text-primary' },
    { search: /bg-gold\/15/g, replace: 'bg-primary/15' },
    { search: /border-gold/g, replace: 'border-primary' },
    { search: /shadow-gold/g, replace: 'shadow-primary' },
    { search: /ring-gold/g, replace: 'ring-primary' },
    { search: /hsl\(var\(--gold\)\)/g, replace: 'hsl(var(--primary))' },
    { search: /hsl\(var\(--navy\)\)/g, replace: 'hsl(var(--secondary))' },
    { search: /hsl\(var\(--navy\) \/ 0\.9\)/g, replace: 'hsl(var(--card))' },
    { search: /hsl\(var\(--navy\) \/ 0\.6\)/g, replace: 'hsl(var(--card) / 0.8)' },
    { search: /bg-navy/g, replace: 'bg-card' },
    { search: /from-navy/g, replace: 'from-background' },
    { search: /via-navy/g, replace: 'via-background' },
];

function processDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
        const fullPath = path.join(currentDir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
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
