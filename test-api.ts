import { config } from "dotenv";
config({ path: ".env.local" });
const envs = require('fs').readFileSync('.env.local', 'utf-8').split('\n');
const pgUrl = envs.reverse().find(l => l.startsWith('DATABASE_URL=') && l.includes('postgres'));
if (pgUrl) {
  process.env.DATABASE_URL = pgUrl.split('=')[1].replace(/"/g, '');
}

import { db } from "./src/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only";

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
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}
main();
