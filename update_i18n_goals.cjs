const fs = require('fs');
const path = 'mobile/lib/i18n/index.ts';
let content = fs.readFileSync(path, 'utf8');

const idKeys = `
    totalSavedGoals: 'Total Tabungan Tujuan',
    totalGoalTarget: 'Total Target Tujuan',
    overallProgress: 'PROGRES KESELURUHAN',
    activeGoals: 'Tujuan Aktif',
    addFunds: 'Tambah Dana',
    target: 'Target',
    ongoing: 'Berjalan',`;

const enKeys = `
    totalSavedGoals: 'Total Saved for Goals',
    totalGoalTarget: 'Total Goal Target',
    overallProgress: 'OVERALL PROGRESS',
    activeGoals: 'Active Goals',
    addFunds: 'Add Funds',
    target: 'Target',
    ongoing: 'Ongoing',`;

content = content.replace(/addGoal: 'Tambah Tujuan',/, "addGoal: 'Tambah Tujuan'," + idKeys);
content = content.replace(/addGoal: 'Add Goal',/, "addGoal: 'Add Goal'," + enKeys);

fs.writeFileSync(path, content, 'utf8');
console.log('updated i18n goals keys');
