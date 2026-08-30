const fs = require('fs');

let content = fs.readFileSync('src/lib/domain/investments.ts', 'utf8');

// Replace Beli aset
content = content.replace(/description: \`Beli aset \$\{inv\.name\}\$\{platformStr\}\`/g, "description: inv.name");
// Replace Jual aset
content = content.replace(/description: \`Jual aset \$\{inv\.name\}\$\{platformStr\}\`/g, "description: inv.name");
// Replace Tarik Dana dari
content = content.replace(/description: \`Tarik Dana dari \$\{inv\.name\}\$\{platformStr\}\`/g, "description: inv.name");
// Replace Deposit Dana ke
content = content.replace(/description: \`Deposit Dana ke \$\{inv\.name\}\$\{platformStr\}\`/g, "description: inv.name");

fs.writeFileSync('src/lib/domain/investments.ts', content, 'utf8');
console.log('done');
