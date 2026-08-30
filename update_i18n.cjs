const fs = require('fs');
const path = 'mobile/lib/i18n/index.ts';
let content = fs.readFileSync(path, 'utf8');

// Add keys for Indonesian
const idKeys = `
    lendingAndDebts: 'Hutang & Piutang',
    repaymentProgress: 'Progres Pelunasan',
    recentPayments: 'Pembayaran Terakhir',
    paymentReceived: 'Pembayaran diterima',
    paymentSent: 'Pembayaran dikirim',
    addDebtOrLoan: 'Tambah Hutang atau Piutang',
    iOwe: 'Saya Berhutang',
    owedToMe: 'Berhutang ke saya',`;
content = content.replace(/lending: 'Pinjaman',/, "lending: 'Pinjaman'," + idKeys);

// Add keys for English
const enKeys = `
    lendingAndDebts: 'Lending & Debts',
    repaymentProgress: 'Repayment Progress',
    recentPayments: 'Recent Payments',
    paymentReceived: 'Payment received',
    paymentSent: 'Payment sent',
    addDebtOrLoan: 'Add Debt or Loan',
    iOwe: 'I Owe',
    owedToMe: 'Owed to me',`;
content = content.replace(/lending: 'Lending',/, "lending: 'Lending'," + enKeys);

fs.writeFileSync(path, content, 'utf8');
console.log('updated i18n');
