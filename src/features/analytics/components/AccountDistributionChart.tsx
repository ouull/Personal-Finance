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
import { useCurrency } from "@/lib/CurrencyContext";

interface AccountData {
  name: string;
  value: number;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#f43f5e",
  "#ec4899",
  "#14b8a6",
];

export function AccountDistributionChart({ data }: { data: AccountData[] }) {
  const { t } = useTranslation();

  const { formatRupiah } = useCurrency();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">
          {t.dashboard?.accountBalanceDistribution ||
            "Account Balance Distribution"}
        </CardTitle>
        <CardDescription>
          {t.dashboard?.percentageOfYourBalance || "Percentage of your balance"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground border-dashed border rounded-xl">
            {t.dashboard?.noAccountBalancesYet || "No account balances yet"}
          </div>
        ) : (
          <div className="flex flex-col mt-2">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      formatRupiah(value as number),
                      "Jumlah",
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
              {data.map((entry, index) => (
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
