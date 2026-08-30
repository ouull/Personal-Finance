const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const users = await db.user.findMany();
  if (users.length === 0) return;
  const user = users[0];
  try {
    const res = await db.account.create({
      data: {
        userId: user.id,
        name: "Test Bank",
        type: "BANK",
        balance: 10000,
        currency: "IDR",
        isActive: true
      }
    });
    console.log("Success:", res);
  } catch (e) {
    console.log("Error:", e);
  }
}
main();
