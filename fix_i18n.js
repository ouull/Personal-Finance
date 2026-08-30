const fs = require('fs');
let content = fs.readFileSync('mobile/lib/i18n/index.ts', 'utf8');

const idAdditions = `
    deleteGoal: 'Hapus Tujuan',
    collected: 'Terkumpul',
    remaining: 'Kekurangan',
    deadline: 'Tenggat Waktu',
    noGoals: 'Belum ada tujuan keuangan.',
    addDeposit: 'Tambah Tabungan',
    deleteAsset: 'Hapus Aset',
    noInvestments: 'Belum ada investasi.',
    deleteRecurring: 'Hapus Pembayaran Rutin',
    noRecurring: 'Belum ada pembayaran rutin.',
    noLoans: 'Belum ada catatan pinjaman.',
    deadlineOptional: 'Tenggat Waktu (Opsional)',
    deleteTransaction: 'Hapus Transaksi',
    deleteBudget: 'Hapus Anggaran',
    noBudgets: 'Belum ada anggaran.',
    noNotifications: 'Belum ada notifikasi.',
    noExpensesThisMonth: 'Belum ada pengeluaran di bulan ini.',
`;

const enAdditions = `
    deleteGoal: 'Delete Goal',
    collected: 'Collected',
    remaining: 'Remaining',
    deadline: 'Deadline',
    noGoals: 'No financial goals yet.',
    addDeposit: 'Add Deposit',
    deleteAsset: 'Delete Asset',
    noInvestments: 'No investments yet.',
    deleteRecurring: 'Delete Recurring Payment',
    noRecurring: 'No recurring payments yet.',
    noLoans: 'No loan records yet.',
    deadlineOptional: 'Deadline (Optional)',
    deleteTransaction: 'Delete Transaction',
    deleteBudget: 'Delete Budget',
    noBudgets: 'No budgets yet.',
    noNotifications: 'No notifications yet.',
    noExpensesThisMonth: 'No expenses this month.',
`;

content = content.replace(/days: 'hari',\n  },/g, \`days: 'hari',\${idAdditions}  },\`);
content = content.replace(/days: 'days',\n  },/g, \`days: 'days',\${enAdditions}  },\`);

fs.writeFileSync('mobile/lib/i18n/index.ts', content);
