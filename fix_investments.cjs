const fs = require('fs');
const content = fs.readFileSync('src/lib/domain/investments.ts', 'utf8');

const getOrCreateCategoryFn = `
async function getOrCreateInvestmentCategory(tx: any, userId: string, type: "INCOME" | "EXPENSE") {
  const slug = type === "EXPENSE" ? "investment_expense" : "investment_income";
  let cat = await tx.category.findFirst({ where: { userId, slug } });
  if (!cat) {
    cat = await tx.category.create({
      data: {
        userId,
        name: "Investasi",
        slug,
        type,
        icon: "TrendingUp",
        color: type === "EXPENSE" ? "blue" : "emerald",
        isDefault: true,
        isActive: true
      }
    });
  }
  return cat.id;
}
`;

let newContent = content;

// Insert function after imports
newContent = newContent.replace('import { db } from "@/lib/db"\n', 'import { db } from "@/lib/db"\n' + getOrCreateCategoryFn);

// Replace BUY logic
const buyRegex = /if \(data\.type === "BUY"\) \{[\s\S]*?sourceAccountId: data\.accountId,\n        \}\n      \}\)/;
const buyReplacement = `if (data.type === "BUY") {
      if (!data.accountId) throw new Error("Account is required for BUY")
      const acc = await tx.account.findUnique({ where: { id: data.accountId } })
      if (!acc || Number(acc.balance) < data.amount) throw new Error("Insufficient account balance")

      await tx.investment.update({
        where: { id: data.investmentId },
        data: { 
          totalInvested: { increment: data.amount },
          currentValue: { increment: data.amount },
          status: "ACTIVE"
        }
      })
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: data.amount } }
      })

      const catId = await getOrCreateInvestmentCategory(tx, userId, "EXPENSE")
      const platformStr = inv.platform ? \` di \${inv.platform}\` : ''
      await tx.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount: data.amount,
          date: data.date,
          description: \`Beli aset \${inv.name}\${platformStr}\`,
          notes: data.notes,
          categoryId: catId,
          sourceAccountId: data.accountId,
        }
      })`;
newContent = newContent.replace(buyRegex, buyReplacement);

// Replace SELL logic transaction creation
const sellRegex = /if \(data\.accountId\) \{\n        await tx\.account\.update\(\{\n          where: \{ id: data\.accountId \},\n          data: \{ balance: \{ increment: data\.amount \} \}\n        \}\)\n        await tx\.transaction\.create\(\{\n          data: \{\n            userId,\n            type: 'INCOME',\n            amount: data\.amount,\n            date: data\.date,\n            description: \`Jual Investasi: \${inv\.name}\`,\n            notes: data\.notes,\n            destinationAccountId: data\.accountId,\n          \}\n        \}\)\n      \}/;
const sellReplacement = `if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: data.amount } }
        })
        const catId = await getOrCreateInvestmentCategory(tx, userId, "INCOME")
        const platformStr = inv.platform ? \` di \${inv.platform}\` : ''
        await tx.transaction.create({
          data: {
            userId,
            type: 'INCOME',
            amount: data.amount,
            date: data.date,
            description: \`Jual aset \${inv.name}\${platformStr}\`,
            notes: data.notes,
            categoryId: catId,
            destinationAccountId: data.accountId,
          }
        })
      }`;
newContent = newContent.replace(sellRegex, sellReplacement);


// Replace WITHDRAW logic and add DEPOSIT
const withdrawRegex = /\} else if \(data\.type === "WITHDRAW"\) \{[\s\S]*?\}\n    \n    return transaction/;
const withdrawReplacement = `} else if (data.type === "WITHDRAW") {
      if (!data.accountId) throw new Error("Account is required for WITHDRAW")
      if (Number(inv.cashBalance) < data.amount) throw new Error("Insufficient investment cash balance")
      
      await tx.investment.update({
        where: { id: data.investmentId },
        data: { cashBalance: { decrement: data.amount } }
      })
      
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: data.amount } }
      })

      const catId = await getOrCreateInvestmentCategory(tx, userId, "INCOME")
      const platformStr = inv.platform ? \` di \${inv.platform}\` : ''
      await tx.transaction.create({
        data: {
          userId,
          type: 'INCOME',
          amount: data.amount,
          date: data.date,
          description: \`Tarik Dana dari \${inv.name}\${platformStr}\`,
          notes: data.notes,
          categoryId: catId,
          destinationAccountId: data.accountId,
        }
      })
    } else if (data.type === "DEPOSIT") {
      if (!data.accountId) throw new Error("Account is required for DEPOSIT")
      const acc = await tx.account.findUnique({ where: { id: data.accountId } })
      if (!acc || Number(acc.balance) < data.amount) throw new Error("Insufficient account balance")
      
      await tx.investment.update({
        where: { id: data.investmentId },
        data: { cashBalance: { increment: data.amount } }
      })
      
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: data.amount } }
      })

      const catId = await getOrCreateInvestmentCategory(tx, userId, "EXPENSE")
      const platformStr = inv.platform ? \` di \${inv.platform}\` : ''
      await tx.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount: data.amount,
          date: data.date,
          description: \`Deposit Dana ke \${inv.name}\${platformStr}\`,
          notes: data.notes,
          categoryId: catId,
          sourceAccountId: data.accountId,
        }
      })
    }
    
    return transaction`;

newContent = newContent.replace(withdrawRegex, withdrawReplacement);

fs.writeFileSync('src/lib/domain/investments.ts', newContent, 'utf8');
console.log('done');
