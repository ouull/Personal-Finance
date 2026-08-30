const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: {
      description: {
        startsWith: 'Mem'
      }
    }
  });

  const repaymentTxs = await prisma.transaction.findMany({
    where: {
      description: {
        startsWith: 'Penerimaan'
      }
    }
  });

  const allTxs = [...txs, ...repaymentTxs];

  for (const t of allTxs) {
    let newDesc = t.description;
    if (newDesc.startsWith('Meminjamkan ke ')) newDesc = newDesc.replace('Meminjamkan ke ', '');
    if (newDesc.startsWith('Meminjam dari ')) newDesc = newDesc.replace('Meminjam dari ', '');
    if (newDesc.startsWith('Membayar hutang ke ')) newDesc = newDesc.replace('Membayar hutang ke ', '');
    if (newDesc.startsWith('Penerimaan piutang dari ')) newDesc = newDesc.replace('Penerimaan piutang dari ', '');

    const slug = t.type === "EXPENSE" ? "lending_expense" : "lending_income";
    let cat = await prisma.category.findFirst({ where: { userId: t.userId, slug } });
    
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          userId: t.userId,
          name: "Pinjaman",
          slug,
          type: t.type,
          icon: "CreditCard",
          color: t.type === "EXPENSE" ? "indigo" : "emerald",
          isDefault: true,
          isActive: true
        }
      });
    }

    await prisma.transaction.update({
      where: { id: t.id },
      data: {
        description: newDesc,
        categoryId: cat.id
      }
    });
  }
  console.log('Fixed', allTxs.length, 'transactions');
}
main().catch(console.error).finally(() => prisma.$disconnect());
