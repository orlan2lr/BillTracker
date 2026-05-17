"use client"

import { useState, useMemo } from "react"
import { Bill } from "@/types"
import { getBillsForDay, getCategoryConfig, formatCurrency, getMonthName, isPaidCurrentPeriod } from "@/lib/bill-utils"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface CalendarViewProps {
  bills: Bill[]
  onTogglePaid: (bill: Bill) => void
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function CalendarView({ bills, onTogglePaid }: CalendarViewProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  const dayBills = useMemo(() => {
    const map: Record<number, Bill[]> = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const b = getBillsForDay(bills, d, viewMonth + 1)
      if (b.length > 0) map[d] = b
    }
    return map
  }, [bills, viewMonth, viewYear, daysInMonth])

  const selectedBills = selectedDay ? (dayBills[selectedDay] ?? []) : []

  // Build calendar grid cells
  const cells: Array<{ day: number | null }> = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })

  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-white">
          {getMonthName(viewMonth)} {viewYear}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.day) return <div key={`empty-${i}`} />
          const dayBillList = dayBills[cell.day] ?? []
          const hasBills = dayBillList.length > 0
          const isSelected = selectedDay === cell.day
          const isCurrentDay = isToday(cell.day)

          // Get dot colors from bill categories
          const dotColors = dayBillList.slice(0, 3).map(b => getCategoryConfig(b.category).color)

          return (
            <button
              key={cell.day}
              onClick={() => setSelectedDay(isSelected ? null : cell.day)}
              className={cn(
                "relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-lg min-h-[52px] transition-all",
                isSelected && "bg-blue-600/25 ring-1 ring-blue-500",
                isCurrentDay && !isSelected && "bg-slate-700/50 ring-1 ring-slate-500",
                !isSelected && !isCurrentDay && hasBills && "hover:bg-slate-800",
                !hasBills && !isCurrentDay && "opacity-60"
              )}
            >
              <span className={cn(
                "text-sm leading-none",
                isCurrentDay ? "text-blue-400 font-bold" : "text-slate-300"
              )}>
                {cell.day}
              </span>
              {hasBills && (
                <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center">
                  {dotColors.map((c, idx) => (
                    <div key={idx} className={cn("w-1.5 h-1.5 rounded-full", c)} />
                  ))}
                  {dayBillList.length > 3 && (
                    <span className="text-[8px] text-slate-500">+{dayBillList.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day details */}
      {selectedDay && selectedBills.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="font-semibold text-white">
              📅 {selectedDay} de {getMonthName(viewMonth)}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {selectedBills.map(bill => {
              const cat = getCategoryConfig(bill.category)
              const paid = isPaidCurrentPeriod(bill)
              return (
                <div key={bill.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{bill.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        {bill.isAutomatic ? <span className="text-blue-400">⚡ Auto</span> : <span>✋ Manual</span>}
                        {bill.frequency === 'annual' && <span className="text-purple-400">· Anual</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-sm">{formatCurrency(bill.amount)}</span>
                    <button
                      onClick={() => onTogglePaid(bill)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors text-xs",
                        paid ? "bg-green-600 border-green-600 text-white" : "border-slate-600 hover:border-green-500 text-transparent"
                      )}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedDay && selectedBills.length === 0 && (
        <div className="text-center py-6 text-slate-500 text-sm">
          Sin facturas el día {selectedDay}
        </div>
      )}

      {/* Legend */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h3 className="text-xs font-semibold text-slate-400 mb-3">Leyenda de categorías</h3>
        <div className="grid grid-cols-2 gap-2">
          {(['housing','utilities','transport','insurance','subscription','credit'] as const).map(c => {
            const cfg = getCategoryConfig(c)
            return (
              <div key={c} className="flex items-center gap-2">
                <div className={cn("w-2.5 h-2.5 rounded-full", cfg.color)} />
                <span className="text-xs text-slate-400">{cfg.emoji} {cfg.label}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
