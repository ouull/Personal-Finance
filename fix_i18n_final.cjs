const fs = require('fs');

let content = fs.readFileSync('mobile/lib/i18n/index.ts', 'utf8');

// Rename duplicate outstanding and nextDueDate in ID
content = content.replace("outstanding: 'Belum Lunas',", "outstandingStatus: 'Belum Lunas',");
content = content.replace("nextDueDate: 'Tanggal Jatuh Tempo Berikutnya',", "nextDueDateLong: 'Tanggal Jatuh Tempo Berikutnya',");

// Rename duplicate outstanding and nextDueDate in EN
content = content.replace("outstanding: 'Outstanding',", "outstandingStatus: 'Outstanding',");
content = content.replace("nextDueDate: 'Next Due Date',", "nextDueDateLong: 'Next Due Date',");

// Add missing all, income, expense, transfer to EN block
content = content.replace("goodEvening: 'Good evening',", "goodEvening: 'Good evening',\n    all: 'All',\n    income: 'Income',\n    expense: 'Expense',\n    transfer: 'Transfer',");

fs.writeFileSync('mobile/lib/i18n/index.ts', content, 'utf8');
