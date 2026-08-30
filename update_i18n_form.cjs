const fs = require('fs');
const path = 'mobile/lib/i18n/index.ts';
let content = fs.readFileSync(path, 'utf8');

const idKeys = `
    personName: 'Nama Orang/Instansi',
    personNamePlaceholder: 'Cth. Budi, Bank Mandiri',
    sourceAccountLabel: 'Sumber Dana (Akun)',
    dueDate: 'Tenggat Waktu',
    addDetailsPlaceholder: 'Tambahkan detail...',
    notesLabel: 'Catatan',`;

const enKeys = `
    personName: 'Person/Entity Name',
    personNamePlaceholder: 'e.g. John Doe, Chase Bank',
    sourceAccountLabel: 'Source Account',
    dueDate: 'Due Date',
    addDetailsPlaceholder: 'Add any details...',
    notesLabel: 'Notes',`;

content = content.replace(/iOwe: 'Saya Berhutang',/, "iOwe: 'Saya Berhutang'," + idKeys);
content = content.replace(/iOwe: 'I Owe',/, "iOwe: 'I Owe'," + enKeys);

fs.writeFileSync(path, content, 'utf8');
console.log('updated i18n form keys');
