import { EditTransactionDialog } from "./EditTransactionDialog";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useCurrency } from "@/lib/CurrencyContext";
import {
  Wallet,
  Receipt,
  Coffee,
  Home,
  Banknote,
  Utensils,
  Edit2,
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  balance?: any;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
}

export function TransactionItem({
  tx,
  accounts,
  categories,
  groupTranslations,
  isLast,
}: {
  tx: any;
  accounts: Account[];
  categories: Category[];
  groupTranslations: Record<string, string>;
  isLast: boolean;
}) {
  const { formatRupiah } = useCurrency();

  const isIncome = tx.type === "INCOME" || tx.type === "INITIAL_BALANCE";
  const isTransfer = tx.type === "TRANSFER";

  const subtitle = tx.category?.name?.toUpperCase() || "";
  let title =
    tx.merchant?.name ||
    tx.description ||
    (isIncome ? "Income" : isTransfer ? "Transfer" : "Expense");
  let note = tx.merchant?.name ? tx.description : "";

  if (!tx.merchant?.name && tx.description) {
    let merchantStr = tx.description;
    merchantStr = merchantStr
      .replace("Beli aset ", "")
      .replace("Jual aset ", "")
      .replace("Tarik Dana dari ", "")
      .replace("Deposit Dana ke ", "")
      .replace("Jual Investasi: ", "")
      .replace("Beli Investasi: ", "");
    const diIndex = merchantStr.lastIndexOf(" di ");
    if (diIndex !== -1) {
      merchantStr = merchantStr.substring(0, diIndex);
    }
    title = merchantStr;
    if (title !== tx.description) {
      note = tx.description;
    }
  }

  let IconComponent = Receipt;
  let iconBg = "bg-slate-100";
  let iconColor = "text-slate-600";

  const titleLower = title.toLowerCase();
  const subLower = subtitle.toLowerCase();

  if (
    titleLower.includes("makanan") ||
    titleLower.includes("makan") ||
    titleLower.includes("food") ||
    subLower.includes("makanan")
  ) {
    IconComponent = Utensils;
    iconBg = "bg-red-100";
    iconColor = "text-red-700";
  } else if (titleLower.includes("kopi") || titleLower.includes("coffee")) {
    IconComponent = Coffee;
    iconBg = "bg-amber-100";
    iconColor = "text-amber-700";
  } else if (
    titleLower.includes("rent") ||
    titleLower.includes("sewa") ||
    titleLower.includes("kos") ||
    titleLower.includes("tagihan")
  ) {
    IconComponent = Home;
    iconBg = "bg-blue-100";
    iconColor = "text-blue-800";
  } else if (
    titleLower.includes("salary") ||
    titleLower.includes("gaji") ||
    subLower.includes("pendapatan")
  ) {
    IconComponent = Banknote;
    iconBg = "bg-blue-500";
    iconColor = "text-white";
  } else if (
    titleLower.includes("grab") ||
    titleLower.includes("gojek") ||
    subLower.includes("transport")
  ) {
    IconComponent = Banknote;
    iconBg = "bg-teal-200";
    iconColor = "text-teal-900";
  } else if (isIncome) {
    IconComponent = Wallet;
    iconBg = "bg-emerald-100";
    iconColor = "text-emerald-700";
  }

  return (
    <div
      className={`flex flex-row items-center justify-between py-3 sm:py-4 ${!isLast ? "border-b border-slate-100/60" : ""} hover:bg-slate-50/50 transition-colors -mx-2 px-2 sm:-mx-4 sm:px-4 rounded-xl group/row relative`}
    >
      <TransactionDetailsDialog transaction={tx}>
        <div className="flex items-center justify-between w-full h-full min-h-[48px]">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}
            >
              <IconComponent size={22} strokeWidth={2.5} />
            </div>

            <div className="min-w-0 flex-1 text-left">
              <p className="font-bold text-slate-900 text-[15px] truncate">
                {title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {subtitle && (
                  <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide truncate max-w-[160px] sm:max-w-none">
                    {subtitle}
                  </span>
                )}
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide truncate max-w-[120px] sm:max-w-none">
                  {(isTransfer
                    ? `${tx.sourceAccount?.name} → ${tx.destinationAccount?.name}`
                    : tx.sourceAccount?.name || tx.destinationAccount?.name
                  )?.toUpperCase()}
                </span>
              </div>
              {note && (
                <p className="text-[13px] text-slate-500 mt-1 line-clamp-1">
                  {note}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4 pr-10 sm:pr-12">
            <div className="flex flex-col items-end">
              <p
                className={`font-black text-[17px] ${isIncome ? "text-teal-600" : isTransfer ? "text-slate-600" : "text-red-700"}`}
              >
                {isIncome ? "+" : isTransfer ? "" : "-"}
                {formatRupiah(Number(tx.amount))}
              </p>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                {format(new Date(tx.date), "HH:mm", {
                  locale: id,
                })}
              </span>
            </div>
          </div>
        </div>
      </TransactionDetailsDialog>

      <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2">
        <EditTransactionDialog
          transaction={tx}
          accounts={accounts}
          categories={categories}
          groupTranslations={groupTranslations}
          trigger={
            <div className="h-8 w-8 cursor-pointer flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors z-10">
              <Edit2 className="h-4 w-4" />
            </div>
          }
        />
      </div>
    </div>
  );
}
