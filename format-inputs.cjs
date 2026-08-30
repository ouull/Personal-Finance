const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'mobile/app/goals/add.tsx',
  'mobile/app/goals/edit.tsx',
  'mobile/app/lending/add.tsx',
  'mobile/app/lending/[id].tsx',
  'mobile/app/accounts/add.tsx',
  'mobile/app/accounts/add-cash.tsx',
  'mobile/app/recurring/add.tsx',
  'mobile/app/recurring/edit.tsx',
  'mobile/app/investments/transaction.tsx',
  'mobile/app/investments/[id].tsx',
  'mobile/components/ui/quick-capture-fab.tsx'
];

filesToUpdate.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Let's find occurrences of <Input ... keyboardType="numeric" ... />
  // and modify value={varName} onChangeText={setVarName}
  
  // This Regex will find value={varName} and onChangeText={setVarName} 
  // It's safer to just replace them directly in the known components.
  
  if (file.includes('quick-capture-fab.tsx')) {
    content = content.replace(/value=\{amount\}/, "value={amount ? parseInt(amount, 10).toLocaleString('id-ID') : ''}");
    content = content.replace(/onChangeText=\{setAmount\}/, "onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}");
  } else if (file.includes('lending/[id].tsx')) {
    content = content.replace(/value=\{repaymentAmount\}/, "value={repaymentAmount ? parseInt(repaymentAmount, 10).toLocaleString('id-ID') : ''}");
    content = content.replace(/onChangeText=\{setRepaymentAmount\}/, "onChangeText={(text) => setRepaymentAmount(text.replace(/[^0-9]/g, ''))}");
  } else if (file.includes('goals/add.tsx') || file.includes('goals/edit.tsx')) {
    content = content.replace(/value=\{targetAmount\}/, "value={targetAmount ? parseInt(targetAmount, 10).toLocaleString('id-ID') : ''}");
    content = content.replace(/onChangeText=\{setTargetAmount\}/, "onChangeText={(text) => setTargetAmount(text.replace(/[^0-9]/g, ''))}");
    
    content = content.replace(/value=\{currentAmount\}/, "value={currentAmount ? parseInt(currentAmount, 10).toLocaleString('id-ID') : ''}");
    content = content.replace(/onChangeText=\{setCurrentAmount\}/, "onChangeText={(text) => setCurrentAmount(text.replace(/[^0-9]/g, ''))}");
  } else if (file.includes('accounts/add.tsx')) {
    content = content.replace(/value=\{initialBalance\}/, "value={initialBalance ? parseInt(initialBalance, 10).toLocaleString('id-ID') : ''}");
    content = content.replace(/onChangeText=\{setInitialBalance\}/, "onChangeText={(text) => setInitialBalance(text.replace(/[^0-9]/g, ''))}");
  } else if (file.includes('investments/[id].tsx')) {
    content = content.replace(/value=\{updateValue\}/, "value={updateValue ? parseInt(updateValue, 10).toLocaleString('id-ID') : ''}");
    content = content.replace(/onChangeText=\{setUpdateValue\}/, "onChangeText={(text) => setUpdateValue(text.replace(/[^0-9]/g, ''))}");
  } else {
    // defaults: amount, setAmount
    content = content.replace(/value=\{amount\}/, "value={amount ? parseInt(amount, 10).toLocaleString('id-ID') : ''}");
    content = content.replace(/onChangeText=\{setAmount\}/, "onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}");
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${file}`);
});
