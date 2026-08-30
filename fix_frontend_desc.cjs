const fs = require('fs');

function sanitizeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldCode = `const merchantStr = item.merchant?.name || item.description || item.notes;
                  if (merchantStr) {
                    title = merchantStr;
                  }`;
                  
  const newCode = `let merchantStr = item.merchant?.name || item.description || item.notes;
                  if (merchantStr) {
                    merchantStr = merchantStr.replace('Beli aset ', '').replace('Jual aset ', '').replace('Tarik Dana dari ', '').replace('Deposit Dana ke ', '').replace('Jual Investasi: ', '').replace('Beli Investasi: ', '');
                    const diIndex = merchantStr.lastIndexOf(' di ');
                    if (diIndex !== -1) {
                      merchantStr = merchantStr.substring(0, diIndex);
                    }
                    title = merchantStr;
                  }`;

  // For transactions.tsx
  content = content.replace(oldCode, newCode);

  // For index.tsx
  const oldCodeIndex = `const merchantStr = tx.merchant?.name || tx.description || tx.notes;
                  if (merchantStr) {
                    title = merchantStr;
                  }`;
                  
  const newCodeIndex = `let merchantStr = tx.merchant?.name || tx.description || tx.notes;
                  if (merchantStr) {
                    if (typeof merchantStr === 'string') {
                      merchantStr = merchantStr.replace('Beli aset ', '').replace('Jual aset ', '').replace('Tarik Dana dari ', '').replace('Deposit Dana ke ', '').replace('Jual Investasi: ', '').replace('Beli Investasi: ', '');
                      const diIndex = merchantStr.lastIndexOf(' di ');
                      if (diIndex !== -1) {
                        merchantStr = merchantStr.substring(0, diIndex);
                      }
                    }
                    title = merchantStr;
                  }`;

  content = content.replace(oldCodeIndex, newCodeIndex);
  
  fs.writeFileSync(filePath, content, 'utf8');
}

sanitizeFile('mobile/app/(tabs)/transactions.tsx');
sanitizeFile('mobile/app/(tabs)/index.tsx');

console.log('done');
