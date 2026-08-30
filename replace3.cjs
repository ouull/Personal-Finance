const fs = require('fs');

function replaceInFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for (const [from, to] of replacements) {
        content = content.replace(from, to);
    }
    fs.writeFileSync(path, content, 'utf8');
}

// Profile
replaceInFile('mobile/app/profile/index.tsx', [
    ['title="Pinjaman"', 'title={t("lending")}'],
    ['title="Tujuan"', 'title={t("goals")}'],
    ['title="Langganan"', 'title={t("recurring")}'],
    ['title="Notifikasi"', 'title={t("notifications")}'],
    ['title="Laporan Keuangan"', 'title={t("reports")}'],
    ['title="Pusat Bantuan"', 'title={t("helpCenter")}'],
    ['title="Tentang Aplikasi"', 'title={t("aboutApp")}'],
    ['title="Bahasa"', 'title={t("language")}']
]);

// Lending Index
replaceInFile('mobile/app/lending/index.tsx', [
    ['return status === "PARTIALLY_PAID" ? "Dibayar Sebagian" : "Lunas";', 'return status === "PARTIALLY_PAID" ? t("partiallyPaid") : t("paid");']
]);

// Lending Details
replaceInFile('mobile/app/lending/[id].tsx', [
    ['label="Bayar Cicilan / Pelunasan"', 'label={t("payInstallment")}'],
    ['<Text className="text-yellow-800 font-medium text-xs">Dibayar Sebagian</Text>', '<Text className="text-yellow-800 font-medium text-xs">{t("partiallyPaid")}</Text>'],
    ['<Text className="text-green-800 font-medium text-xs">Lunas</Text>', '<Text className="text-green-800 font-medium text-xs">{t("paid")}</Text>']
]);

// Lending Add
replaceInFile('mobile/app/lending/add.tsx', [
    ['label="Nama / Keterangan"', 'label={t("nameDescription")}'],
    ['placeholder="Misal: Pinjaman Budi"', 'placeholder={t("exampleLoan")}'],
    ['label="Tanggal Dipinjamkan"', 'label={t("dateLoaned")}'],
    ['placeholder="Pilih tanggal"', 'placeholder={t("selectDate")}']
]);

