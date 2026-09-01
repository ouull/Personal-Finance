import { FadeIn } from "@/components/MotionWrapper";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { RefreshCw, HandCoins } from "lucide-react";

export function DashboardReminders({
  t,
  upcomingPayments,
  outstandingLoans,
}: {
  t: any;
  upcomingPayments: any[];
  outstandingLoans: any[];
}) {
  return (
    <FadeIn delay={0.4}>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Payments */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-500" />{" "}
            {t.dashboard?.upcomingPayments || "Upcoming Payments"}
          </h3>
          {upcomingPayments.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t.dashboard?.noUpcomingPayments ||
                "No upcoming payments in the next 14 days."}
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingPayments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center gap-4 pb-4 border-b last:border-0 last:pb-0 w-full"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">
                      {payment.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(payment.nextDueDate).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "short" },
                      )}
                    </p>
                  </div>
                  <p className="font-bold text-slate-800 text-sm shrink-0">
                    <CurrencyDisplay amount={payment.amount} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outstanding Loans */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-indigo-500" />{" "}
            {t.dashboard?.outstandingLoans || "Outstanding Loans"}
          </h3>
          {outstandingLoans.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t.dashboard?.noOutstandingLoans ||
                "No outstanding loans right now."}
            </p>
          ) : (
            <div className="space-y-3">
              {outstandingLoans.map((l: any) => (
                <div
                  key={l.id}
                  className="flex justify-between items-center gap-4 p-3 bg-slate-50 rounded-xl w-full"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {l.borrowerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {l.status === "OVERDUE" ? "Overdue" : "Pending"}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    <CurrencyDisplay amount={l.remainingAmount} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </FadeIn>
  );
}
