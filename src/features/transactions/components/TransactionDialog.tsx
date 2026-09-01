"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TransactionForm } from "./TransactionForm";
import { useTranslation } from "@/lib/TranslationContext";

interface Account {
  id: string;
  name: string;
  balance?: any;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
}

interface TransactionDialogProps {
  accounts: Account[];
  categories?: Category[];
  groupTranslations?: Record<string, string>;
  trigger?: React.ReactElement;
}

export function TransactionDialog({
  accounts,
  categories = [],
  groupTranslations = {},
  trigger,
}: TransactionDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm font-medium">
              <Plus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
              {t.transactionsPage?.addTransaction || "Add Transaction"}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t.transactionsPage?.addTransaction || "Record New Transaction"}
          </DialogTitle>
          <DialogDescription>
            {t.transactionsPage?.description ||
              "Enter your transaction details below."}
          </DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <div className="text-center p-6 text-sm text-muted-foreground">
            {t.transactionsPage?.noAccounts ||
              "You don't have any accounts yet. Please add an account first before recording a transaction."}
          </div>
        ) : (
          <TransactionForm
            accounts={accounts}
            categories={categories}
            groupTranslations={groupTranslations}
            onSuccess={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
