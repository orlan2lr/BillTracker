"use client"

import { useState, useMemo } from "react"
import { Bill, BillCategory } from "@/types"
import { getBillStatus, getCategoryConfig, getDaysUntilDue, formatCurrency, getTotalMonthlyExpenses } from "@/lib/bill-utils"
import { BillCard } from "@/components/bill-card"
import { cn } from "@/lib/utils"

type Filter = 'all' | 'monthly' | 'annual' | 'loans' | 'auto' | 'manual'

interface BillsListProps {
  bills: Bill[]
  onEditBill: (bill: Bill) => void
  onDeleteBill: (id: string) => void
  onTogglePaid: (bill: Bill) => void
}

const FILTER_TABS: { id: Filter; label: string }[] = [
  { id: 'all',     label: 'Todas' },
  { id: 'monthly', label: 'Mensual' },
  { id: 'annual',  label: 'Anual' },
  { id: 'loans',   label: 'Créditos' },
  { id: 'auto',    label: '⚡ Auto' },
  { id: 'manual',  label: '✋ Manual' },
]

const STATUS_ORDER = { overdue: 0, due_soon: 1, upcoming: 2, paid: 3 }

export function BillsListView({ bills, onEditBill, onDeleteBill, onTogglePaid }: BillsListProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    let result = [...bills]
    if (filter === 'monthly') result = result.filter(b => b.frequency === 'monthly')
    if (filter === 'annual')  result = result.filter(b => b.frequency === 'annual')
    if (filter === 'loans')   result = result.filter(b => b.isLoan)
    if (filter === 'auto')    result = result.filter(b => b.isAutomatic)
    if (filter === 'manual')  result = result.filter(b => !b.isAutomatic)

    // Sort: overdue → due_soon → upcoming (by daysUntilDue) → paid
    return result.sort((a, b) => {
      const sa = STATUS_ORDER[getBillStatus(a)]
      const sb = STATUS_ORDER[getBillStatus(b)]
      if (sa !== sb) return sa - sb
      return getDaysUntilDue(a) - getDaysUntilDue(b)
    })
  }, [bills, filter])

  const total = useMemo(() => getTotalMonthlyExpenses(filtered), [filtered])

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">

      {/* Filter tabs - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors",
              filter === tab.id
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-500">{filtered.length} factura{filtered.length !== 1 ? 's' : ''}</span>
        <span className="text-xs text-slate-400">
          Total: <span className="text-white font-semibold">{formatCurrency(total)}</span>
          {filter !== 'annual' && <span className="text-slate-500">/mes</span>}
        </span>
      </div>

      {/* Bills */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-400 text-sm">No hay facturas en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(bill => (
            <BillCard
              key={bill.id}
              bill={bill}
              onEdit={onEditBill}
              onDelete={onDeleteBill}
              onTogglePaid={onTogglePaid}
            />
          ))}
        </div>
      )}
    </div>
  )
}
