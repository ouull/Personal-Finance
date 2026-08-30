const fs = require('fs');
let content = fs.readFileSync('mobile/app/lending/add.tsx', 'utf8');

const targetImports = `import { Button } from '../../components/ui/button';`;
const newImports = `import { Button } from '../../components/ui/button';
import { Bell } from 'lucide-react-native';`;

content = content.replace(targetImports, newImports);

const targetState = `  const [name, setName] = useState('');`;
const newState = `  const [type, setType] = useState<'BORROWED' | 'LENT'>('BORROWED');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');`;

content = content.replace(targetState, newState);

const targetMutation = `        borrowerName: name,
        amount: parseFloat(amount),
        accountId,
        lentDate: lentDate ? lentDate.toISOString() : new Date().toISOString(),
        dueDate: dueDate ? dueDate.toISOString() : undefined,`;
const newMutation = `        type,
        borrowerName: name,
        amount: parseFloat(amount),
        accountId,
        lentDate: lentDate ? lentDate.toISOString() : new Date().toISOString(),
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        notes,`;

content = content.replace(targetMutation, newMutation);

const targetHeader = `<View className="flex-row items-center p-4 border-b border-gray-100 pt-12">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{t('addLoan')}</Text>
      </View>`;
const newHeader = `<View className="flex-row items-center justify-between p-4 pt-12 bg-[#FDF8EB]">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Add Debt or Loan</Text>
        <TouchableOpacity>
          <Bell size={24} color="#111827" />
        </TouchableOpacity>
      </View>
      
      <View className="px-6 py-4 bg-[#FDF8EB]">
        <View className="flex-row bg-[#EAE5D9] rounded-full p-1 border border-[#D5D0C5]">
          <TouchableOpacity 
            className={\`flex-1 py-3 rounded-full items-center \${type === 'BORROWED' ? 'bg-black' : 'bg-transparent'}\`}
            onPress={() => setType('BORROWED')}
          >
            <Text className={\`font-medium \${type === 'BORROWED' ? 'text-white' : 'text-gray-600'}\`}>Saya Berhutang</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={\`flex-1 py-3 rounded-full items-center \${type === 'LENT' ? 'bg-black' : 'bg-transparent'}\`}
            onPress={() => setType('LENT')}
          >
            <Text className={\`font-medium \${type === 'LENT' ? 'text-white' : 'text-gray-600'}\`}>Berhutang ke saya</Text>
          </TouchableOpacity>
        </View>
      </View>`;

content = content.replace(targetHeader, newHeader);
content = content.replace(`<View className="flex-1 bg-white">`, `<View className="flex-1 bg-[#FDF8EB]">`);

const targetInputs = `<Input 
            label={t("nameDescription")}
            placeholder={t("exampleLoan")}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Input 
            label={t('amount')}
            placeholder="0"
            keyboardType="numeric"
            value={amount ? parseInt(amount, 10).toLocaleString('id-ID') : ''}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('account')}</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsAccountSheetOpen(true)}
            >
              <Text className={selectedAccount ? 'text-gray-900 text-base' : 'text-gray-500 text-base'}>
                {selectedAccount ? selectedAccount.name : t('selectAccount')}
              </Text>
            </TouchableOpacity>
          </View>

          <DatePickerInput 
            label={t("dateLoaned")}
            value={lentDate}
            onChange={setLentDate as any}
          />

          <DatePickerInput 
            label={t("deadlineOptional")}
            value={dueDate}
            onChange={setDueDate as any}
          />`;

const newInputs = `<Input 
            label="Person Name"
            placeholder="e.g. John Doe, Chase Bank"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Input 
            label="Nominal"
            placeholder="Rp. 0.00"
            keyboardType="numeric"
            value={amount ? parseInt(amount, 10).toLocaleString('id-ID') : ''}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Sumber Dana (Akun)</Text>
            <TouchableOpacity 
              className="border border-[#D5D0C5] rounded-xl p-4 bg-[#EAE5D9] flex-row justify-between items-center"
              onPress={() => setIsAccountSheetOpen(true)}
            >
              <Text className={selectedAccount ? 'text-gray-900 text-base' : 'text-gray-500 text-base'}>
                {selectedAccount ? selectedAccount.name : t('selectAccount')}
              </Text>
            </TouchableOpacity>
          </View>

          <DatePickerInput 
            label="Tenggat Waktu"
            value={dueDate}
            onChange={setDueDate as any}
          />
          
          <Input 
            label="Catatan"
            placeholder="Add any details..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />`;

content = content.replace(targetInputs, newInputs);

const targetButton = `<Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim() || !amount || !accountId} 
            />`;
const newButton = `<Button 
              label={type === 'BORROWED' ? '+ Add Debt' : '+ Add Loan'} 
              className="rounded-full py-4"
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim() || !amount || !accountId} 
            />`;

content = content.replace(targetButton, newButton);

fs.writeFileSync('mobile/app/lending/add.tsx', content, 'utf8');
console.log('done');
