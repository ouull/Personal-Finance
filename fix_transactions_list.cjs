const fs = require('fs');

let content = fs.readFileSync('mobile/app/(tabs)/transactions.tsx', 'utf8');

const replacement = `
                  let title = item.type;
                  const catName = item.category?.slug ? (t(item.category.slug as any) !== item.category.slug ? t(item.category.slug as any) : item.category?.name) : item.category?.name;
                  
                  if (item.type === 'INITIAL_BALANCE') title = t('initialBalance') || 'Saldo Awal';
                  else if (item.type === 'INCOME') title = catName || t('income');
                  else if (item.type === 'EXPENSE') title = catName || t('expense');
                  else if (item.type === 'TRANSFER') title = t('transfer');
                  
                  let subtitle = '';
                  if (item.type === 'EXPENSE' || item.type === 'INCOME') {
                    subtitle = catName || t('uncategorized') || 'Uncategorized';
                  } else if (item.type === 'TRANSFER') {
                    subtitle = t('internal') || 'Internal';
                  }
`;

content = content.replace(/let title = item\.type;[\s\S]*?subtitle = 'Internal';\n                  }/m, replacement.trim());

fs.writeFileSync('mobile/app/(tabs)/transactions.tsx', content, 'utf8');
