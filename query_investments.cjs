const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function run() {
  const invs = await db.investment.findMany();
  console.log("Investments:", JSON.stringify(invs, null, 2));
}
run().catch(console.error).finally(() => db.$disconnect());
