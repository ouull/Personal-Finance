"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";

interface ChartData {
  name: string;
  value: number;
}

interface PortfolioChartProps {
  currentValue: number;
  returnPct: number;
  data: ChartData[];
}

export function PortfolioChart({
  currentValue,
  returnPct,
  data,
}: PortfolioChartProps) {
  const { formatRupiah } = useCurrency();
  const isPositive = returnPct >= 0;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
          <polyline points="16 7 22 7 22 13"></polyline>
        </svg>
      </div>

      <div className="flex flex-col mb-8 relative z-10">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Nilai Total Portofolio
        </h3>
        <div className="flex items-end gap-4">
          <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {formatRupiah(currentValue)}
          </span>
          <div
            className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full mb-1 ${isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(returnPct * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="h-[200px] md:h-[250px] w-full -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: "#64748b" }}
              dy={10}
            />
            <YAxis
              hide
              domain={[
                "dataMin - (dataMin * 0.1)",
                "dataMax + (dataMax * 0.1)",
              ]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ color: "#3b82f6", fontWeight: "bold" }}
              formatter={(value: any) => [formatRupiah(value), "Portfolio"]}
              labelStyle={{ color: "#64748b", marginBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Decorative horizontal lines */}
      <div className="absolute bottom-[40px] left-8 right-8 h-px border-t border-dashed border-slate-200 pointer-events-none z-0"></div>
      <div className="absolute bottom-[100px] left-8 right-8 h-px border-t border-dashed border-slate-200 pointer-events-none z-0"></div>
      <div className="absolute bottom-[160px] left-8 right-8 h-px border-t border-dashed border-slate-200 pointer-events-none z-0"></div>
    </div>
  );
}
