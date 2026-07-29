"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface CashFlowData {
  name: string
  income: number
  expense: number
}

interface CashFlowChartProps {
  data: CashFlowData[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const formatRupiah = (value: number) => {
    if (value >= 1000000) {
      return `Rp${(value / 1000000).toFixed(1)}Jt`
    }
    return `Rp${(value / 1000).toFixed(0)}K`
  }

  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Arus Kas (6 Bulan Terakhir)</CardTitle>
        <CardDescription>Perbandingan total pemasukan dan pengeluaran Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatRupiah}
              />
              <Tooltip 
                formatter={(value: number) => [formatTooltip(value), ""]}
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="income" 
                name="Pemasukan"
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
              <Bar 
                dataKey="expense" 
                name="Pengeluaran"
                fill="#f43f5e" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
