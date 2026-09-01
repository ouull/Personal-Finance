"use client";

import { InvestmentDialog } from "./InvestmentDialog";
import { InvestmentTransactionDialog } from "./InvestmentTransactionDialog";
import { UpdateValueDialog } from "./UpdateValueDialog";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/TranslationContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  name: string;
  balance?: any;
}

interface Investment {
  id: string;
  name: string;
  type: string;
  platform?: string;
  totalInvested: number;
  currentValue: number;
  realizedGain: number;
  status: string;
}

interface InvestmentListProps {
  investments: Investment[];
  accounts: Account[];
}

export function InvestmentList({ investments, accounts }: InvestmentListProps) {
  const { t } = useTranslation();
  const { formatRupiah } = useCurrency();
  const router = useRouter();

  const formatPercentage = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/50 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <span className="text-2xl">📈</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          {t.investmentsPage?.noInvestments ||
            "You haven't added any investments yet."}
        </h3>
        <p className="text-slate-500 mb-6 max-w-sm">
          {t.investmentsPage?.empty ||
            "Start tracking your portfolio by adding your first asset."}
        </p>
        <InvestmentDialog accounts={accounts} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="font-semibold text-slate-800">{t.investmentsPage?.portfolioTitle || "Your Portfolio"}</h3>
        <InvestmentDialog accounts={accounts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {investments.map((inv) => {
          const unrealizedGain = inv.currentValue - inv.totalInvested;
          const returnPct =
            inv.totalInvested > 0 ? unrealizedGain / inv.totalInvested : 0;

          return (
            <div
              key={inv.id}
              onClick={() => router.push(`/investments/${inv.id}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col hover:shadow-md transition-shadow cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div>
                  <h4 className="font-bold text-lg text-slate-800">
                    {inv.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {(t.assetTypes as Record<string, string>)?.[inv.type] || inv.type.replace("_", " ")}
                    </Badge>
                    {inv.platform && (
                      <span className="text-xs text-slate-500">
                        {inv.platform}
                      </span>
                    )}
                  </div>
                </div>
                {inv.status === "SOLD" ? (
                  <Badge variant="secondary">{t.investmentsPage?.sold || "Sold"}</Badge>
                ) : (
                  <div onClick={(e) => e.stopPropagation()}>
                    <UpdateValueDialog investment={inv} />
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 flex-1">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">{t.investmentsPage?.invested || "Invested"}</p>
                  <p className="font-medium text-slate-700">
                    {formatRupiah(inv.totalInvested)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">{t.investmentsPage?.currentValue || "Current Value"}</p>
                  <p className="font-bold text-slate-900">
                    {formatRupiah(inv.currentValue)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">{t.investmentsPage?.unrealizedReturn || "Unrealized Return"}</p>
                  <p
                    className={`font-medium ${unrealizedGain >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {unrealizedGain >= 0 ? "+" : ""}
                    {formatRupiah(unrealizedGain)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">{t.investmentsPage?.returnPct || "Return %"}</p>
                  <p
                    className={`font-bold ${returnPct >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {returnPct >= 0 ? "+" : ""}
                    {formatPercentage(returnPct)}
                  </p>
                </div>

                {inv.realizedGain !== 0 && (
                  <div className="col-span-2 pt-2 border-t border-slate-100 mt-1 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">
                      {t.investmentsPage?.totalRealizedGain || "Total Realized Gain"}
                    </span>
                    <span
                      className={`text-sm font-bold ${inv.realizedGain >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {inv.realizedGain >= 0 ? "+" : ""}
                      {formatRupiah(inv.realizedGain)}
                    </span>
                  </div>
                )}

                {(inv as any).cashBalance > 0 && (
                  <div className="col-span-2 pt-2 border-t border-slate-100 mt-1 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">
                      {t.investmentsPage?.cashBalance || "Cash Balance"}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatRupiah((inv as any).cashBalance)}
                    </span>
                  </div>
                )}
              </div>

              <div
                className="mt-5 pt-4 border-t border-slate-100 flex justify-end relative z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <InvestmentTransactionDialog
                  accounts={accounts}
                  investment={inv as any}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
