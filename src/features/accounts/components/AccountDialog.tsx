"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AccountForm } from "./AccountForm";
import { useTranslation } from "@/lib/TranslationContext";

export function AccountDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" size="sm" />}>
        <PlusCircle className="h-4 w-4" />
        {t.accountsPage?.addAccount || "Add Account"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t.accountsPage?.addAccount || "Add New Account"}
          </DialogTitle>
          <DialogDescription>
            {t.accountsPage?.description ||
              "Enter the details of your new account."}
          </DialogDescription>
        </DialogHeader>
        <AccountForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
