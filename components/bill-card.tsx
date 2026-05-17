"use client"

import { Bill } from "@/types"
import {
  getBillStatus, getCategoryConfig, formatCurrency,
  getDaysUntilDue, isPaidCurrentPeriod, getLoanProgress,
  getFrequencyLabel
} from "@/lib/bill-utils"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash, CheckCircle, Zap } from "lucide-react"

interface BillCardProps {
  bill: Bill
  onEdit: (bill: Bill) => void
  onDelete: (id: string) => void
  onTogglePaid: (bill: Bill) => void
  compact?: boolean
}

export function BillCard({ bill, onEdit, onDelete, onTogglePaid, compact }: BillCardProps) {
  const status = getBillStatus(bill)
  const cat = getCategoryConfig(bill.category)
  const paid = isPaidCurrentPeriod(bill)
  const days = getDaysUntilDue(bill)

  const statusBg = {
    paid:     'border-l-green-500',
    overdue:  'border-l-red-500',
    due_soon: 'border-l-amber-500',
    upcoming: 'border-l-slate-600',
  }[status]

  const statusBadge = {
    paid:     { label: '✓ Pagado', cls: 'bg-green-600/20 text-green-400 border-green-600/30' },
    overdue:  { label: `⚠ Vencido (${Math.abs(days)}d)`, cls: 'bg-red-600/20 text-red-400 border-red-600/30' },
    due_soon: { label: days === 0 ? '¡Hoy!' : `Vence en ${days}d`, cls: 'bg-amber-600/20 text-amber-400 border-amber-600/30' },
    upcoming: { label: `Día ${bill.dueDay}`, cls: 'bg-slate-700/50 text-slate-400 border-slate-600/30' },
  }[status]

  const progress = getLoanProgress(bill)

  return (
    <div className={cn(
      "bg-slate-900 rounded-xl border border-slate-800 border-l-4 p-4 transition-all",
      statusBg,
      paid && "opacity-70"
    )}>
      <div className="flex items-start justify-between gap-2">
        {/* Left: icon + info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => onTogglePaid(bill)}
            className={cn(
              "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
              paid
                ? "bg-green-600 border-green-600"
                : "border-slate-600 hover:border-green-500"
            )}
          >
            {paid && <CheckCircle className="w-4 h-4 text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white truncate">{bill.name}</span>
              <span className="text-xs">{cat.emoji}</span>
            </div>

            {!compact && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className={cn("text-xs px-1.5 py-0 border", statusBadge.cls)}>
                  {statusBadge.label}
                </Badge>
                {bill.isAutomatic
                  ? <Badge variant="outline" className="text-xs px-1.5 py-0 bg-blue-600/10 text-blue-400 border-blue-600/20"><Zap className="w-2.5 h-2.5 inline mr-0.5" />Auto</Badge>
                  : <Badge variant="outline" className="text-xs px-1.5 py-0 bg-slate-700/50 text-slate-400 border-slate-600/30">Manual</Badge>
                }
                <span className="text-xs text-slate-500">{getFrequencyLabel(bill.frequency)}</span>
              </div>
            )}

            {bill.isLoan && bill.loanBalance && bill.loanOriginalAmount && !compact && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Balance: {formatCurrency(bill.loanBalance)}</span>
                  <span>{progress}% pagado</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-slate-700" />
              </div>
            )}

            {bill.notes && !compact && (
              <p className="text-xs text-slate-500 mt-1 truncate">{bill.notes}</p>
            )}
          </div>
        </div>

        {/* Right: amount + menu */}
        <div className="flex items-start gap-1 flex-shrink-0">
          <div className="text-right">
            <div className="text-base font-bold text-white">{formatCurrency(bill.amount)}</div>
            {!bill.isFixed && <div className="text-xs text-slate-500">variable</div>}
          </div>

          {!compact && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-slate-700 text-slate-400">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                <DropdownMenuItem className="text-slate-200 focus:bg-slate-700" onClick={() => onEdit(bill)}>
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 focus:bg-slate-700 focus:text-red-400" onClick={() => onDelete(bill.id)}>
                  <Trash className="w-4 h-4 mr-2" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}
