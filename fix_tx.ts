import { db } from './src/lib/db';

async function main() {
  const txs = await db.transaction.findMany({
    where: {
      OR: [
        { description: { startsWith: 'Meminjam' } },
        { description: { startsWith: 'Penerimaan' } },
        { description: { startsWith: 'Membayar hutang ke ' } }
      ]
    }
  });

  for (const t of txs) {
    let newDesc = t.description;
    if (!newDesc) continue;
    if (newDesc.startsWith('Meminjamkan ke ')) newDesc = newDesc.replace('Meminjamkan ke ', '');
    else if (newDesc.startsWith('Meminjam dari ')) newDesc = newDesc.replace('Meminjam dari ', '');
    else if (newDesc.startsWith('Membayar hutang ke ')) newDesc = newDesc.replace('Membayar hutang ke ', '');
    else if (newDesc.startsWith('Penerimaan piutang dari ')) newDesc = newDesc.replace('Penerimaan piutang dari ', '');

    const slug = t.type === "EXPENSE" ? "lending_expense" : "lending_income";
    let cat = await db.category.findFirst({ where: { userId: t.userId, slug } });
    
    if (!cat) {
      cat = await db.category.create({
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

    await db.transaction.update({
      where: { id: t.id },
      data: {
        description: newDesc,
        categoryId: cat.id
      }
    });
  }
  console.log('Fixed', txs.length, 'transactions');
}
main().catch(console.error).finally(() => process.exit(0));
