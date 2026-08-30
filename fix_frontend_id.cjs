const fs = require('fs');
let content = fs.readFileSync('mobile/app/transactions/[id].tsx', 'utf8');

const targetStr = `tx.description || tx.category?.name || 'Transaksi'`;
const replaceStr = `(typeof tx.description === 'string' ? tx.description.replace('Beli aset ', '').replace('Jual aset ', '').replace('Tarik Dana dari ', '').replace('Deposit Dana ke ', '').replace('Jual Investasi: ', '').replace('Beli Investasi: ', '').split(' di ')[0] : (tx.description || tx.category?.name || 'Transaksi'))`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('mobile/app/transactions/[id].tsx', content, 'utf8');
