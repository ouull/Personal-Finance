"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteAccount } from "@/features/accounts/actions"
import { useTranslation } from "@/lib/TranslationContext"

interface DeleteAccountDialogProps {
  accountId: string;
  accountName: string;
}

export function DeleteAccountDialog({ accountId, accountName }: DeleteAccountDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function onDelete() {
    setIsPending(true)
    const res = await deleteAccount(accountId)
    setIsPending(false)
    
    if (res.success) {
      if (res.archived) {
        toast.success("Akun diarsipkan. (Memiliki riwayat transaksi)")
      } else {
        toast.success("Akun berhasil dihapus permanen")
      }
      setOpen(false)
    } else {
      toast.error(res.error || "Gagal menghapus akun")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.accountsPage?.deleteTitle || "Delete Account"} {accountName}?</DialogTitle>
          <DialogDescription className="pt-2 text-slate-600">
            {t.accountsPage?.deleteHasHistory || "This account has transaction, loan, or investment history. It will be archived so your financial history remains intact. You can no longer use this account for new transactions."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-slate-100">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>{t.common?.cancel || "Batal"}</Button>
          <Button variant="destructive" onClick={onDelete} disabled={isPending}>
            {isPending ? (t.common?.loading || "Memproses...") : (t.accountsPage?.deleteAccount || "Hapus Akun")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
