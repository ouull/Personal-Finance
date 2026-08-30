const fs = require('fs');

function addMinimumDate(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('minimumDate={new Date()}')) return;
  
  content = content.replace(
    /<DatePickerInput([\s\S]*?)onChange=\{/g,
    '<DatePickerInput$1minimumDate={new Date()}\n            onChange={'
  );
  fs.writeFileSync(filePath, content, 'utf8');
}

addMinimumDate('mobile/app/goals/add.tsx');
addMinimumDate('mobile/app/goals/edit.tsx');
addMinimumDate('mobile/app/recurring/add.tsx');
addMinimumDate('mobile/app/recurring/edit.tsx');
console.log('done');
