"use client"

import { useState, useMemo } from "react"
import { Bill, AppSettings } from "@/types"
import { getDaysUntilDue, formatCurrency, getCategoryConfig, isPaidCurrentPeriod } from "@/lib/bill-utils"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface PaycheckViewProps {
  bills: Bill[]
  settings: AppSettings
  onUpdateSettings: (s: AppSettings) => void
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatPayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

function getPeriodEndDate(nextPayDate: string, freq: AppSettings['paycheckFrequency']): string {
  const days = freq === 'weekly' ? 7 : freq === 'biweekly' ? 14 : 15
  return addDays(nextPayDate, days - 1)
}

export function PaycheckView({ bills, settings, onUpdateSettings }: PaycheckViewProps) {
  const [showSettings, setShowSettings] = useState(false)

  const periodEnd = getPeriodEndDate(settings.nextPayDate, settings.paycheckFrequency)
  const startDate = new Date(settings.nextPayDate + 'T00:00:00')
  const endDate = new Date(periodEnd + 'T23:59:59')

  // Bills due between nextPayDate and periodEnd
  const dueBills = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return bills.filter(bill => {
      if (isPaidCurrentPeriod(bill)) return false
      if (bill.frequency === 'annual') {
        const dueMonth = (bill.dueMonth || 1) - 1
        const dueDate = new Date(startDate.getFullYear(), dueMonth, bill.dueDay)
        return dueDate >= startDate && dueDate <= endDate
      }
      // Monthly: check if due day falls in range
      // Can span across month boundary
      const dueThisMonth = new Date(startDate.getFullYear(), startDate.getMonth(), bill.dueDay)
      const dueNextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, bill.dueDay)
      return (dueThisMonth >= startDate && dueThisMonth <= endDate) ||
             (dueNextMonth >= startDate && dueNextMonth <= endDate)
    }).sort((a, b) => a.dueDay - b.dueDay)
  }, [bills, settings])

  const autoBills = dueBills.filter(b => b.isAutomatic)
  const manualBills = dueBills.filter(b => !b.isAutomatic)
  const totalAuto = autoBills.reduce((s, b) => s + b.amount, 0)
  const totalManual = manualBills.reduce((s, b) => s + b.amount, 0)
  const totalNeeded = totalAuto + totalManual

  // Also show all unpaid bills regardless of period (overdue + upcoming)
  const unpaidAll = useMemo(() => 
    bills.filter(b => !isPaidCurrentPeriod(b)).sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b))
  , [bills])

  const advanceToNext = () => {
    const days = settings.paycheckFrequency === 'weekly' ? 7 : settings.paycheckFrequency === 'biweekly' ? 14 : 15
    onUpdateSettings({ ...settings, nextPayDate: addDays(settings.nextPayDate, days) })
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">

      {/* Paycheck config card */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between px-4 py-4"
        >
          <div className="text-left">
            <div className="text-sm font-semibold text-white">💰 Próximo cheque</div>
            <div className="text-xs text-blue-400 mt-0.5 capitalize">{formatPayDate(settings.nextPayDate)}</div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showSettings && "rotate-180")} />
        </button>

        {showSettings && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-800 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Fecha del próximo cheque</Label>
              <Input
                type="date"
                value={settings.nextPayDate}
                onChange={e => onUpdateSettings({ ...settings, nextPayDate: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Frecuencia de pago</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'weekly', label: 'Semanal' },
                  { id: 'biweekly', label: 'Quincenal' },
                  { id: 'semimonthly', label: '2x Mes' },
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => onUpdateSettings({ ...settings, paycheckFrequency: opt.id })}
                    className={cn(
                      "py-2.5 rounded-lg border text-xs font-medium transition-colors",
                      settings.paycheckFrequency === opt.id
                        ? "border-blue-600 bg-blue-600/20 text-blue-400"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={advanceToNext}
              className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
            >
              ⏭ Avanzar al siguiente período
            </button>
          </div>
        )}
      </div>

      {/* Period summary */}
      <div className="bg-blue-600/10 border border-blue-600/25 rounded-xl p-4">
        <p className="text-blue-400 text-xs font-medium mb-2">
          Facturas a pagar del {new Date(settings.nextPayDate + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })} al {new Date(periodEnd + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}
        </p>

        {dueBills.length === 0 ? (
          <p className="text-slate-400 text-sm">✓ Sin facturas en este período</p>
        ) : (
          <div className="space-y-3">
            {manualBills.length > 0 && (
              <div>
                <p className="text-xs text-amber-400 font-semibold mb-2">✋ Debes pagar manualmente</p>
                <div className="space-y-2">
                  {manualBills.map(b => {
                    const cat = getCategoryConfig(b.category)
                    return (
                      <div key={b.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.emoji}</span>
                          <div>
                            <div className="text-sm text-white">{b.name}</div>
                            <div className="text-xs text-slate-500">Día {b.dueDay}</div>
                          </div>
                        </div>
                        <span className="font-bold text-white text-sm">{formatCurrency(b.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {autoBills.length > 0 && (
              <div>
                <p className="text-xs text-blue-400 font-semibold mb-2">⚡ Se cobran automáticamente</p>
                <div className="space-y-2">
                  {autoBills.map(b => {
                    const cat = getCategoryConfig(b.category)
                    return (
                      <div key={b.id} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2 opacity-80">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.emoji}</span>
                          <div>
                            <div className="text-sm text-white">{b.name}</div>
                            <div className="text-xs text-blue-500">Día {b.dueDay} · Auto</div>
                          </div>
                        </div>
                        <span className="font-semibold text-slate-300 text-sm">{formatCurrency(b.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Totals breakdown */}
      {dueBills.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">💵 Resumen del período</h3>
          <Separator className="bg-slate-800" />
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">⚡ Auto-pagos</span>
            <span className="text-slate-300">{formatCurrency(totalAuto)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">✋ Pagos manuales</span>
            <span className="text-amber-400 font-semibold">{formatCurrency(totalManual)}</span>
          </div>
          <Separator className="bg-slate-800" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-white">Total del período</span>
            <span className="text-white">{formatCurrency(totalNeeded)}</span>
          </div>
          <div className="text-xs text-slate-500 text-center pt-1">
            Asegúrate de tener {formatCurrency(totalManual)} disponible para pagos manuales
          </div>
        </div>
      )}

      {/* All unpaid bills */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 px-1">📋 Todas las pendientes ({unpaidAll.length})</h3>
        {unpaidAll.length === 0 ? (
          <div className="text-center py-6 bg-slate-900 rounded-xl border border-slate-800">
            <p className="text-green-400 text-sm">🎉 ¡Todas las facturas están al día!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unpaidAll.slice(0, 8).map(b => {
              const days = getDaysUntilDue(b)
              const cat = getCategoryConfig(b.category)
              return (
                <div key={b.id} className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{b.name}</div>
                      <div className="text-xs text-slate-500">
                        {days < 0 ? <span className="text-red-400">Vencida hace {Math.abs(days)}d</span>
                         : days === 0 ? <span className="text-amber-400">¡Vence hoy!</span>
                         : <span>Vence en {days} días</span>}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-white text-sm">{formatCurrency(b.amount)}</span>
                </div>
              )
            })}
            {unpaidAll.length > 8 && (
              <p className="text-center text-slate-500 text-xs py-2">+{unpaidAll.length - 8} más en la lista de facturas</p>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
