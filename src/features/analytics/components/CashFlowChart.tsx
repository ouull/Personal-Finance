"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useCurrency } from "@/lib/CurrencyContext"

interface CashFlowData {
  name: string
  income: number
  expense: number
}

interface CashFlowChartProps {
  data: CashFlowData[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { formatRupiah } = useCurrency()

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Cash Flow</CardTitle>
        <CardDescription>Comparison of your total income and expenses.</CardDescription>
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
                formatter={(value: any) => [formatRupiah(value as number), ""]}
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="income" 
                fill="var(--color-income)" 
                radius={[4, 4, 0, 0]} 
                name="Income"
              />
              <Bar 
                dataKey="expense" 
                fill="var(--color-expense)" 
                radius={[4, 4, 0, 0]} 
                name="Expense"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
