"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TransactionForm } from "./TransactionForm"

interface Account {
  id: string
  name: string
  balance: any
}

interface TransactionDialogProps {
  accounts: Account[]
}

export function TransactionDialog({ accounts }: TransactionDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90" />}>
        <Plus className="mr-2 h-4 w-4" /> Record Transaction
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record New Transaction</DialogTitle>
          <DialogDescription>
            Enter your transaction details below.
          </DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <div className="text-center p-6 text-sm text-muted-foreground">
            You don't have any accounts yet. Please add an account first before recording a transaction.
          </div>
        ) : (
          <TransactionForm accounts={accounts} onSuccess={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
