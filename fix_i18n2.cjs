const fs = require('fs');
let content = fs.readFileSync('mobile/lib/i18n/index.ts', 'utf8');

const idAdditions = `
    reports: 'Laporan Keuangan',
    helpCenter: 'Pusat Bantuan',
    aboutApp: 'Tentang Aplikasi',
    partiallyPaid: 'Dibayar Sebagian',
    paid: 'Lunas',
    payInstallment: 'Bayar Cicilan / Pelunasan',
    nameDescription: 'Nama / Keterangan',
    exampleLoan: 'Misal: Pinjaman Budi',
    dateLoaned: 'Tanggal Dipinjamkan',
    selectDate: 'Pilih tanggal',
`;

const enAdditions = `
    reports: 'Financial Reports',
    helpCenter: 'Help Center',
    aboutApp: 'About App',
    partiallyPaid: 'Partially Paid',
    paid: 'Paid',
    payInstallment: 'Pay Installment / Settle',
    nameDescription: 'Name / Description',
    exampleLoan: 'E.g., John Doe Loan',
    dateLoaned: 'Date Loaned',
    selectDate: 'Select date',
`;

content = content.replace(/noExpensesThisMonth: 'Belum ada pengeluaran di bulan ini.',/g, \`noExpensesThisMonth: 'Belum ada pengeluaran di bulan ini.',\${idAdditions}\`);
content = content.replace(/noExpensesThisMonth: 'No expenses this month.',/g, \`noExpensesThisMonth: 'No expenses this month.',\${enAdditions}\`);

fs.writeFileSync('mobile/lib/i18n/index.ts', content);
