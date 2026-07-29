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
import { PlusCircle } from "lucide-react"
import { AccountForm } from "./AccountForm"

export function AccountDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" size="sm" />}>
        <PlusCircle className="h-4 w-4" />
        Tambah Akun
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Akun Baru</DialogTitle>
          <DialogDescription>
            Masukkan detail akun baru Anda. Saldo awal bisa diisi jika diperlukan.
          </DialogDescription>
        </DialogHeader>
        <AccountForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
