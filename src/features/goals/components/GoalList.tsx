"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target } from "lucide-react"

interface Goal {
  id: string
  name: string
  targetAmount: any
  currentAmount: any
}

export function GoalList({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return (
      <div className="text-center p-6 border rounded-xl bg-slate-50/50 border-dashed">
        <p className="text-muted-foreground text-sm">No financial goals yet.</p>
      </div>
    )
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const target = Number(goal.targetAmount)
        const current = Number(goal.currentAmount)
        const percentage = Math.min(100, Math.round((current / target) * 100))

        return (
          <Card key={goal.id} className="bg-white/60 backdrop-blur-md border-white/50 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
            <CardHeader className="pb-2 flex flex-row justify-between items-center space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <Target className="w-4 h-4 text-primary" />
                {goal.name}
              </CardTitle>
              <span className="text-xs font-medium text-slate-500">{percentage}%</span>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Saved: {formatRupiah(current)}</span>
                <span>Target: {formatRupiah(target)}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
