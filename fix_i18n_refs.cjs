const fs = require('fs');

function replaceInFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for (const [from, to] of replacements) {
        content = content.replace(from, to);
    }
    fs.writeFileSync(path, content, 'utf8');
}

replaceInFile('mobile/app/lending/index.tsx', [
    ["t('outstanding')", "t('outstandingStatus')"]
]);

replaceInFile('mobile/app/lending/[id].tsx', [
    ["t('outstanding')", "t('outstandingStatus')"]
]);

replaceInFile('mobile/app/recurring/edit.tsx', [
    ["t(\"nextDueDate\")", "t('nextDueDateLong')"]
]);

