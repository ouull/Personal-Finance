"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
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
      <DialogTrigger render={<Button className="gap-2 shadow-lg hover:shadow-xl transition-shadow bg-slate-900 text-white rounded-full px-6" />}>
        <PlusCircle className="h-5 w-5" />
        Catat Transaksi
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Catat Transaksi Baru</DialogTitle>
        </DialogHeader>
        {accounts.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            Anda belum memiliki akun. Silakan tambahkan akun terlebih dahulu sebelum mencatat transaksi.
          </div>
        ) : (
          <TransactionForm accounts={accounts} onSuccess={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
