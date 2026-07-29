"use server"

import { db } from "@/lib/db"

export async function getCashFlowData() {
  try {
    const transactions = await db.transaction.findMany({
      where: {
        type: {
          in: ["INCOME", "EXPENSE"],
        },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
    })

    // Kelompokkan berdasarkan bulan
    // Format yang diharapkan chart: [{ name: "Jan", income: 4000, expense: 2400 }, ...]
    const monthlyData: Record<string, { name: string, income: number, expense: number }> = {}

    // Inisialisasi 6 bulan terakhir agar urutan chart tetap bagus
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]
    const today = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      monthlyData[key] = {
        name: months[d.getMonth()],
        income: 0,
        expense: 0,
      }
    }

    // Hitung aggregate
    transactions.forEach((tx) => {
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      
      if (monthlyData[key]) {
        if (tx.type === "INCOME") {
          monthlyData[key].income += Number(tx.amount)
        } else if (tx.type === "EXPENSE") {
          monthlyData[key].expense += Number(tx.amount)
        }
      }
    })

    return { success: true, data: Object.values(monthlyData) }
  } catch (error) {
    console.error("Get cash flow error:", error)
    return { success: false, error: "Gagal mengambil data arus kas" }
  }
}

export async function getComprehensiveAnalytics() {
  try {
    // 1. Spending by Category (Pengeluaran bulan ini)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const expenses = await db.transaction.findMany({
      where: {
        type: "EXPENSE",
        date: { gte: startOfMonth }
      },
      include: {
        category: true
      }
    })
    
    const spendingByCategory: Record<string, number> = {}
    expenses.forEach(tx => {
      // Jika kategori tidak ada (misal tidak dipilih), masukkan ke "Lainnya"
      const catName = tx.category?.name || "Lainnya"
      spendingByCategory[catName] = (spendingByCategory[catName] || 0) + Number(tx.amount)
    })
    
    // Format untuk PieChart: [{ name: "Makanan", value: 100000 }]
    const spendingData = Object.entries(spendingByCategory).map(([name, value]) => ({
      name,
      value
    }))

    // 2. Account Distribution (Persentase saldo antar akun)
    const accounts = await db.account.findMany()
    const accountDistribution = accounts.map((acc: any) => ({
      name: acc.name,
      value: Number(acc.balance)
    })).filter(acc => acc.value > 0) // Hanya tampilkan yang saldonya > 0

    return {
      success: true,
      data: {
        spendingByCategory: spendingData,
        accountDistribution
      }
    }
  } catch (error) {
    console.error("Get analytics error:", error)
    return { success: false, error: "Gagal mengambil data analisis" }
  }
}
