const fs = require('fs');

function replaceInFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for (const [from, to] of replacements) {
        content = content.replace(from, to);
    }
    fs.writeFileSync(path, content, 'utf8');
}

replaceInFile('mobile/app/goals/[id].tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();']
]);

replaceInFile('mobile/app/goals/index.tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();']
]);

// Investments
replaceInFile('mobile/app/(tabs)/investments.tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();'],
    ["'Hapus Aset'", "t('deleteAsset')"],
    ["text: 'Batal'", "text: t('cancel')"],
    ["text: 'Hapus'", "text: t('delete')"],
    ['title="Belum ada investasi."', 'title={t("noInvestments")}'],
    ['actionLabel="Tambah Investasi"', 'actionLabel={t("addInvestment")}'],
    ['label="Tambah Investasi"', 'label={t("addInvestment")}']
]);

// Recurring
replaceInFile('mobile/app/(tabs)/recurring.tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();'],
    ["'Hapus Pembayaran Rutin'", "t('deleteRecurring')"],
    ["text: 'Hapus'", "text: t('delete')"],
    ['title="Belum ada pembayaran rutin."', 'title={t("noRecurring")}'],
    ['actionLabel="Tambah Pembayaran Rutin"', 'actionLabel={t("addRecurring")}']
]);

// Lending Index
replaceInFile('mobile/app/lending/index.tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();'],
    ["Tenggat:", "${t('deadline')}:"],
    ["'id-ID'", "language === 'id' ? 'id-ID' : 'en-US'"],
    ['title="Belum ada catatan pinjaman."', 'title={t("noLoans")}'],
    ['actionLabel="Tambah Pinjaman"', 'actionLabel={t("addLoan")}']
]);

// Lending Add
replaceInFile('mobile/app/lending/add.tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();'],
    ['label="Tenggat Waktu (Opsional)"', 'label={t("deadlineOptional")}']
]);

// Lending Detail
replaceInFile('mobile/app/lending/[id].tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();'],
    ['<Text className="text-gray-500 text-xs mb-1">Tenggat Waktu</Text>', '<Text className="text-gray-500 text-xs mb-1">{t("deadline")}</Text>'],
    ["'id-ID'", "language === 'id' ? 'id-ID' : 'en-US'"]
]);

// Transactions Detail
replaceInFile('mobile/app/transactions/[id].tsx', [
    ["'Hapus Transaksi'", "t('deleteTransaction')"],
    ["text: 'Batal'", "text: t('cancel')"],
    ["text: 'Hapus'", "text: t('delete')"]
]);

// Profile
replaceInFile('mobile/app/profile/index.tsx', [
    ["text: 'Batal'", "text: t('cancel')"],
    ['title="Ubah Password"', 'title={t("changePassword")}']
]);

// Budgets
replaceInFile('mobile/app/budgets/index.tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();'],
    ["'Hapus Anggaran'", "t('deleteBudget')"],
    ["text: 'Hapus'", "text: t('delete')"],
    ['title="Belum ada anggaran."', 'title={t("noBudgets")}']
]);

// Notifications
replaceInFile('mobile/app/notifications/index.tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();'],
    ['title="Belum ada notifikasi."', 'title={t("noNotifications")}']
]);

// Reports
replaceInFile('mobile/app/reports/index.tsx', [
    ['const { t } = useTranslation();', 'const { t, language } = useTranslation();'],
    ['<Text className="text-gray-400 italic">Belum ada pengeluaran di bulan ini.</Text>', '<Text className="text-gray-400 italic">{t("noExpensesThisMonth")}</Text>']
]);

