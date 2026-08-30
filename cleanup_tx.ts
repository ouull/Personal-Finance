import { db } from './src/lib/db';

async function main() {
  const txs = await db.transaction.findMany({
    where: {
      OR: [
        { description: { startsWith: 'Beli aset ' } },
        { description: { startsWith: 'Jual aset ' } },
        { description: { startsWith: 'Tarik Dana dari ' } },
        { description: { startsWith: 'Deposit Dana ke ' } },
        { description: { startsWith: 'Jual Investasi: ' } },
        { description: { startsWith: 'Beli Investasi: ' } }
      ]
    }
  });

  for (const tx of txs) {
    let newDesc = tx.description;
    if (newDesc) {
      newDesc = newDesc.replace('Beli aset ', '');
      newDesc = newDesc.replace('Jual aset ', '');
      newDesc = newDesc.replace('Tarik Dana dari ', '');
      newDesc = newDesc.replace('Deposit Dana ke ', '');
      newDesc = newDesc.replace('Jual Investasi: ', '');
      newDesc = newDesc.replace('Beli Investasi: ', '');
      
      const diIndex = newDesc.lastIndexOf(' di ');
      if (diIndex !== -1) {
        newDesc = newDesc.substring(0, diIndex);
      }
      
      await db.transaction.update({
        where: { id: tx.id },
        data: { description: newDesc }
      });
      console.log(`Updated tx ${tx.id}: ${tx.description} -> ${newDesc}`);
    }
  }
}

main()
  .catch(e => console.error(e));
