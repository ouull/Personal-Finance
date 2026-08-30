const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only";
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany();
  if (users.length === 0) return console.log("No users");
  const user = users[0];
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  
  try {
    const res = await fetch('http://localhost:3000/api/v1/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "Test Bank",
        type: "BANK",
        balance: 10000,
        currency: "IDR"
      })
    });
    const data = await res.json();
    console.log("Response:", data);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
main();
