"use client"

import { useCurrency } from "@/lib/CurrencyContext"

export function CurrencyDisplay({ amount }: { amount: number }) {
  const { formatRupiah } = useCurrency()
  return <>{formatRupiah(amount)}</>
}
