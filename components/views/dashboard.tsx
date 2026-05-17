"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Bill } from "@/types"
import {
  getBillStatus, getDaysUntilDue, isPaidCurrentPeriod, formatCurrency,
  getTotalMonthlyExpenses, getTotalLoanBalance, getLoanProgress,
  getCategoryConfig, getMonthlyAmount, getMonthName
} from "@/lib/bill-utils"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, TrendingDown, CheckCircle, Clock } from "lucide-react"

interface DashboardProps {
  bills: Bill[]
  onEditBill: (bill: Bill) => void
  onTogglePaid: (bill: Bill) => void
}

export function DashboardView({ bills, onTogglePaid }: DashboardProps) {
  const now = new Date()
  const monthName = getMonthName(now.getMonth())

  const overdue = useMemo(() => bills.filter(b => getBillStatus(b) === 'overdue'), [bills])
  const dueSoon = useMemo(() => bills.filter(b => getBillStatus(b) === 'due_soon'), [bills])
  const paidThisMonth = useMemo(() => bills.filter(b => isPaidCurrentPeriod(b)).length, [bills])
  const totalMonthly = useMemo(() => getTotalMonthlyExpenses(bills), [bills])
  const totalLoan = useMemo(() => getTotalLoanBalance(bills), [bills])
  const loans = useMemo(() => bills.filter(b => b.isLoan && b.loanBalance && b.loanOriginalAmount), [bills])

  const upcomingWeek = useMemo(() =>
    bills
      .filter(b => {
        const days = getDaysUntilDue(b)
        return days >= 0 && days <= 7 && !isPaidCurrentPeriod(b)
      })
      .sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b))
  , [bills])

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">

      {/* Month header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{monthName} {now.getFullYear()}</h2>
        <span className="text-sm text-slate-400">{now.toLocaleDateString('es', { weekday:'long', day:'numeric' })}</span>
      </div>

      {/* Alert banners */}
      {overdue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600/15 border border-red-600/30 rounded-xl p-3.5"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-semibold text-sm">{overdue.length} factura{overdue.length > 1 ? 's' : ''} vencida{overdue.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1.5">
            {overdue.map(b => (
              <div key={b.id} className="flex items-center justify-between">
                <span className="text-red-300 text-xs">{b.name} · {formatCurrency(b.amount)}</span>
                <button
                  onClick={() => onTogglePaid(b)}
                  className="text-xs px-2 py-0.5 rounded-full bg-red-600/30 text-red-300 hover:bg-red-600/50 transition-colors"
                >
                  Marcar pagada
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {dueSoon.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-600/10 border border-amber-600/25 rounded-xl p-3.5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm">{dueSoon.length} vencen pronto</span>
          </div>
          <div className="space-y-1">
            {dueSoon.slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center justify-between">
                <span className="text-amber-300/80 text-xs">{b.name}</span>
                <span className="text-amber-400 text-xs font-medium">
                  {getDaysUntilDue(b) === 0 ? '¡Hoy!' : `${getDaysUntilDue(b)}d · ${formatCurrency(b.amount)}`}
                </span>
              </div>
            ))}
            {dueSoon.length > 3 && <p className="text-amber-600 text-xs">+{dueSoon.length - 3} más...</p>}
          </div>
        </motion.div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Gasto mensual</span>
          </div>
          <div className="text-xl font-bold text-white">{formatCurrency(totalMonthly)}</div>
          <div className="text-xs text-slate-500 mt-0.5">equivalente mensual</div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">Pagadas</span>
          </div>
          <div className="text-xl font-bold text-white">{paidThisMonth}/{bills.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">este mes</div>
          <Progress
            value={(paidThisMonth / Math.max(bills.length, 1)) * 100}
            className="h-1 mt-2 bg-slate-700"
          />
        </div>
      </div>

      {/* Total debt */}
      {totalLoan > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-white">💳 Deudas totales</span>
            <span className="text-lg font-bold text-amber-400">{formatCurrency(totalLoan)}</span>
          </div>
          <p className="text-xs text-slate-500">Balance pendiente en préstamos y créditos</p>
        </div>
      )}

      {/* Loan progress bars */}
      {loans.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300 px-1">📊 Progreso de préstamos</h3>
          {loans.map(b => {
            const progress = getLoanProgress(b)
            const cat = getCategoryConfig(b.category)
            return (
              <div key={b.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.emoji}</span>
                    <span className="text-sm font-medium text-white">{b.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{progress}% pagado</span>
                </div>
                <Progress value={progress} className="h-2 bg-slate-700" />
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-slate-500">Balance: {formatCurrency(b.loanBalance!)}</span>
                  <span className="text-xs text-slate-500">Original: {formatCurrency(b.loanOriginalAmount!)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upcoming 7 days */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 px-1">📅 Próximos 7 días</h3>
        {upcomingWeek.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">¡Sin pagos pendientes esta semana!</p>
          </div>
        ) : (
          upcomingWeek.map(b => {
            const days = getDaysUntilDue(b)
            const cat = getCategoryConfig(b.category)
            return (
              <div
                key={b.id}
                className="bg-slate-900 rounded-xl border border-slate-800 p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0", cat.color)}>
                    <span className="text-xs font-bold leading-none">
                      {days === 0 ? 'Hoy' : `${days}d`}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{b.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      {b.isAutomatic ? <span className="text-blue-400">⚡ Auto</span> : <span>✋ Manual</span>}
                      · día {b.dueDay}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{formatCurrency(b.amount)}</div>
                  <button
                    onClick={() => onTogglePaid(b)}
                    className="text-xs text-slate-500 hover:text-green-400 transition-colors"
                  >
                    Marcar ✓
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
