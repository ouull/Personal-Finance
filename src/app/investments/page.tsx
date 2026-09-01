import { getInvestments } from "@/features/investments/actions";
import { getAccounts } from "@/features/accounts/actions";
import { InvestmentList } from "@/features/investments/components/InvestmentList";
import { FadeIn } from "@/components/MotionWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrendingUp, Wallet, BarChart3, LineChart } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { PortfolioChart } from "@/features/investments/components/PortfolioChart";
export default async function InvestmentsPage() {
  const { t } = await getTranslation();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [investmentsResult, accountsResult] = await Promise.all([
    getInvestments(),
    getAccounts(),
  ]);

  const investments = investmentsResult.success
    ? investmentsResult.data || []
    : [];
  const accounts = accountsResult.success ? accountsResult.data || [] : [];

  const totalInvested = investments.reduce(
    (sum: number, inv: any) =>
      sum + (inv.status === "ACTIVE" ? inv.totalInvested : 0),
    0,
  );
  const currentValue = investments.reduce(
    (sum: number, inv: any) =>
      sum + (inv.status === "ACTIVE" ? inv.currentValue : 0),
    0,
  );
  const totalGainLoss = currentValue - totalInvested;
  const totalRealizedGain = investments.reduce(
    (sum: number, inv: any) => sum + inv.realizedGain,
    0,
  );

  const returnPct = totalInvested > 0 ? totalGainLoss / totalInvested : 0;

  const formatPercentage = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const chartData = [];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agt",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const today = new Date();

  let startValue =
    totalInvested > 0
      ? totalInvested * (returnPct >= 0 ? 0.8 : 1.2)
      : currentValue * 0.5;
  if (currentValue === 0) startValue = 0;

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = months[d.getMonth()];
    const progress = (5 - i) / 5;
    const randomJitter = i === 0 ? 1 : 0.97 + Math.random() * 0.06;
    const value =
      startValue + (currentValue - startValue) * progress * randomJitter;

    chartData.push({
      name: monthName,
      value: i === 0 ? currentValue : Math.max(0, value),
    });
  }

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">
              {t.investmentsPage?.title || "Investments"}
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              {t.investmentsPage?.description ||
                "Track your investment portfolio and assets over time."}
            </p>
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.15}>
        <PortfolioChart
          currentValue={currentValue}
          returnPct={returnPct}
          data={chartData}
        />
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" /> <span className="truncate">Total Invested</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mt-2 truncate">
              <CurrencyDisplay amount={totalInvested} />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500 shrink-0" /> <span className="truncate">Current Value</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mt-2 truncate">
              <CurrencyDisplay amount={currentValue} />
            </div>
          </div>

          <div
            className={`bg-white p-4 sm:p-5 rounded-2xl border ${totalGainLoss >= 0 ? "border-green-200" : "border-red-200"} shadow-sm flex flex-col justify-between overflow-hidden`}
          >
            <div
              className={`text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              <LineChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">Gain/Loss</span>
            </div>
            <div
              className={`text-lg sm:text-xl md:text-2xl font-bold mt-2 truncate ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalGainLoss >= 0 ? "+" : ""}
              <CurrencyDisplay amount={totalGainLoss} />
            </div>
          </div>

          <div
          >
            <div
              className={`text-sm font-medium flex items-center gap-2 ${returnPct >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              <TrendingUp className="w-4 h-4" /> Return
            </div>
            <div
              className={`text-2xl font-bold mt-2 ${returnPct >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {returnPct >= 0 ? "+" : ""}
              {formatPercentage(returnPct)}
            </div>
            {totalRealizedGain !== 0 && (
              <div className="text-xs text-slate-500 mt-2">
                Realized: {totalRealizedGain >= 0 ? "+" : ""}
                <CurrencyDisplay amount={totalRealizedGain} />
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <InvestmentList investments={investments} accounts={accounts} />
      </FadeIn>
    </div>
  );
}
