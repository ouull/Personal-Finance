const fs = require('fs');

function replaceInFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for (const [from, to] of replacements) {
        content = content.replace(from, to);
    }
    fs.writeFileSync(path, content, 'utf8');
}

// 1. Lending Detail & Index - 'Belum Lunas', 'Dibayar Sebagian', 'Lunas', 'Terlambat'
const lendingReplacement = [
    ["loan.status === 'OUTSTANDING' ? 'Belum Lunas' : loan.status === 'PARTIALLY_PAID' ? 'Dibayar Sebagian' : loan.status === 'PAID' ? 'Lunas' : loan.status === 'OVERDUE' ? 'Terlambat' : loan.status",
     "loan.status === 'OUTSTANDING' ? t('outstanding') : loan.status === 'PARTIALLY_PAID' ? t('partiallyPaid') : loan.status === 'PAID' ? t('paid') : loan.status === 'OVERDUE' ? t('overdue') : loan.status"]
];
replaceInFile('mobile/app/lending/index.tsx', lendingReplacement);
replaceInFile('mobile/app/lending/[id].tsx', lendingReplacement);

// 2. Goal Detail - 'Sumber Dana (Akun)'
replaceInFile('mobile/app/goals/[id].tsx', [
    ['<Text className="text-sm font-semibold text-gray-900 mb-2">Sumber Dana (Akun)</Text>',
     '<Text className="text-sm font-semibold text-gray-900 mb-2">{t("sourceAccount")}</Text>']
]);

// 3. Recurring Add/Edit - 'Nama Langganan', 'Tanggal Jatuh Tempo Berikutnya', 'Langganan', 'Tagihan', 'Pengeluaran Rutin', 'Pilih akun...'
replaceInFile('mobile/app/recurring/add.tsx', [
    ["type === 'SUBSCRIPTION' ? 'Langganan' : type === 'BILL' ? 'Tagihan' : 'Pengeluaran Rutin'",
     "type === 'SUBSCRIPTION' ? t('subscriptionType') : type === 'BILL' ? t('billType') : t('routineExpenseType')"],
    ["{selectedAccount ? selectedAccount.name : 'Pilih akun...'}",
     "{selectedAccount ? selectedAccount.name : t('selectAccountPlaceholder')}"],
    ['label="Tanggal Jatuh Tempo"', 'label={t("dueDate")}']
]);

replaceInFile('mobile/app/recurring/edit.tsx', [
    ['label="Nama Langganan"', 'label={t("subName")}'],
    ['label="Tanggal Jatuh Tempo Berikutnya"', 'label={t("nextDueDate")}']
]);

// 4. Investments Add
replaceInFile('mobile/app/investments/add.tsx', [
    ["'Pilih akun sumber untuk Saldo Mengendap.'", "t('selectSourceAccountRequired')"],
    ['label="Nama Portofolio"', 'label={t("portfolioName")}'],
    ['placeholder="Misal: Saham Telkom, Reksadana Sucor"', 'placeholder={t("portfolioExample")}']
]);

// 5. Category Picker Sheet
replaceInFile('mobile/components/ui/category-picker-sheet.tsx', [
    ['<Text className="text-base text-gray-900">{c.name}</Text>',
     '<Text className="text-base text-gray-900">{(c.slug && t(c.slug as any) !== c.slug) ? t(c.slug as any) : c.name}</Text>']
]);
