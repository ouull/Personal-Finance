"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslation } from "@/lib/TranslationContext";

interface SpendingData {
  name: string;
  slug?: string | null;
  value: number;
}

const COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/CurrencyContext";

export function SpendingChart({
  data,
  categoryTranslations = {},
  className,
}: {
  data: SpendingData[];
  categoryTranslations?: Record<string, string>;
  className?: string;
}) {
  const { t } = useTranslation();

  const chartData = data.map((d) => {
    let displayName = d.name;
    if (d.slug && categoryTranslations[d.slug]) {
      displayName = categoryTranslations[d.slug];
    }
    return { ...d, name: displayName };
  });

  const { formatRupiah } = useCurrency();

  return (
    <Card className={cn("shadow-sm flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="text-lg">
          {t.dashboard?.spendingCategories || "Spending Categories"}
        </CardTitle>
        <CardDescription>
          {t.dashboard?.thisMonth || "This month"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {data.length === 0 ? (
          <div className="flex-1 min-h-[250px] flex items-center justify-center text-sm text-muted-foreground border-dashed border rounded-xl">
            {t.dashboard?.noExpensesYet || "No expenses yet"}
          </div>
        ) : (
          <div className="flex-1 flex flex-col mt-2">
            <div className="min-h-[200px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      formatRupiah(value as number),
                      "Expense",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 pb-2">
              {chartData.map((entry, index) => (
                <div
                  key={`legend-${index}`}
                  className="flex items-center gap-1.5 text-sm text-slate-600"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
