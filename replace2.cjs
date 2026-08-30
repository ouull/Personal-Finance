const fs = require('fs');
function replaceInFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for (const [from, to] of replacements) {
        content = content.replace(from, to);
    }
    fs.writeFileSync(path, content, 'utf8');
}
replaceInFile('mobile/app/goals/index.tsx', [
    ["text: 'Hapus'", "text: t('delete')"]
]);
replaceInFile('mobile/app/goals/[id].tsx', [
    ["text: 'Hapus'", "text: t('delete')"]
]);
