const fs = require('fs');

let content = fs.readFileSync('mobile/app/(tabs)/index.tsx', 'utf8');

const replacement = `
                  let title = tx.type;
                  const catName = tx.category?.slug ? (t(tx.category.slug as any) !== tx.category.slug ? t(tx.category.slug as any) : tx.category?.name) : tx.category?.name;
                  
                  if (tx.type === 'INITIAL_BALANCE') title = t('initialBalance') || 'Saldo Awal';
                  else if (tx.type === 'INCOME') title = catName || t('income');
                  else if (tx.type === 'EXPENSE') title = catName || t('expense');
                  else if (tx.type === 'TRANSFER') title = t('transfer');
                  
                  let subtitle = '';
                  if (tx.type === 'EXPENSE' || tx.type === 'INCOME') {
                    subtitle = catName || t('uncategorized') || 'Uncategorized';
                  } else if (tx.type === 'TRANSFER') {
                    subtitle = t('internal') || 'Internal';
                  }
                  
                  // Try to override with merchant, description, or notes
                  const merchantStr = tx.merchant?.name || tx.description || tx.notes;
                  if (merchantStr) {
                    title = merchantStr;
                  }
`;

content = content.replace(/let title = tx\.type;[\s\S]*?subtitle = tx\.merchant\?\.name \|\| tx\.notes \|\| '';\n                  }/m, replacement.trim());

fs.writeFileSync('mobile/app/(tabs)/index.tsx', content, 'utf8');
