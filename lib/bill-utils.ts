import { Bill, BillCategory } from "@/types"

export function getPeriodKey(bill: Bill, date = new Date()): string {
  if (bill.frequency === 'annual') return `${date.getFullYear()}`
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function isPaidCurrentPeriod(bill: Bill): boolean {
  return bill.paidPeriods.includes(getPeriodKey(bill))
}

export function getDaysUntilDue(bill: Bill): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (bill.frequency === 'annual') {
    const dueMonth = (bill.dueMonth || 1) - 1
    if (!isPaidCurrentPeriod(bill)) {
      const thisYearDue = new Date(now.getFullYear(), dueMonth, bill.dueDay)
      return Math.ceil((thisYearDue.getTime() - now.getTime()) / 86400000)
    } else {
      const nextYearDue = new Date(now.getFullYear() + 1, dueMonth, bill.dueDay)
      return Math.ceil((nextYearDue.getTime() - now.getTime()) / 86400000)
    }
  }
  // monthly
  if (!isPaidCurrentPeriod(bill)) {
    const due = new Date(now.getFullYear(), now.getMonth(), bill.dueDay)
    return Math.ceil((due.getTime() - now.getTime()) / 86400000)
  } else {
    const due = new Date(now.getFullYear(), now.getMonth() + 1, bill.dueDay)
    return Math.ceil((due.getTime() - now.getTime()) / 86400000)
  }
}

export type BillStatus = 'paid' | 'upcoming' | 'due_soon' | 'overdue'

export function getBillStatus(bill: Bill): BillStatus {
  if (isPaidCurrentPeriod(bill)) return 'paid'
  const days = getDaysUntilDue(bill)
  if (days < 0) return 'overdue'
  if (days <= Math.max(bill.reminderDays, 3)) return 'due_soon'
  return 'upcoming'
}

export function getMonthlyAmount(bill: Bill): number {
  return bill.frequency === 'annual' ? bill.amount / 12 : bill.amount
}

export function getTotalMonthlyExpenses(bills: Bill[]): number {
  return bills.reduce((sum, b) => sum + getMonthlyAmount(b), 0)
}

export function getTotalLoanBalance(bills: Bill[]): number {
  return bills.filter(b => b.isLoan && b.loanBalance).reduce((s, b) => s + (b.loanBalance || 0), 0)
}

export function getLoanProgress(bill: Bill): number {
  if (!bill.isLoan || !bill.loanOriginalAmount || !bill.loanBalance) return 0
  const paid = bill.loanOriginalAmount - bill.loanBalance
  return Math.max(0, Math.min(100, Math.round((paid / bill.loanOriginalAmount) * 100)))
}

export interface CategoryConfig {
  color: string
  bgLight: string
  label: string
  emoji: string
}

export function getCategoryConfig(category: BillCategory): CategoryConfig {
  const configs: Record<BillCategory, CategoryConfig> = {
    housing:      { color: 'bg-blue-600',   bgLight: 'bg-blue-600/10',   label: 'Vivienda',       emoji: '🏠' },
    utilities:    { color: 'bg-yellow-500', bgLight: 'bg-yellow-500/10', label: 'Servicios',      emoji: '⚡' },
    transport:    { color: 'bg-orange-500', bgLight: 'bg-orange-500/10', label: 'Transporte',     emoji: '🚗' },
    insurance:    { color: 'bg-purple-600', bgLight: 'bg-purple-600/10', label: 'Seguros',        emoji: '🛡️' },
    subscription: { color: 'bg-pink-600',   bgLight: 'bg-pink-600/10',   label: 'Suscripciones',  emoji: '⭐' },
    loan:         { color: 'bg-red-600',    bgLight: 'bg-red-600/10',    label: 'Préstamos',      emoji: '🏦' },
    credit:       { color: 'bg-amber-500',  bgLight: 'bg-amber-500/10',  label: 'Tarjetas',       emoji: '💳' },
    other:        { color: 'bg-slate-500',  bgLight: 'bg-slate-500/10',  label: 'Otros',          emoji: '📄' },
  }
  return configs[category] ?? configs.other
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount)
}

export function getBillsForDay(bills: Bill[], day: number, month: number): Bill[] {
  return bills.filter(b => {
    if (b.frequency === 'annual') return b.dueDay === day && b.dueMonth === month
    return b.dueDay === day
  })
}

export function getMonthName(m: number): string {
  return ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m] ?? ''
}

export function getShortMonthName(m: number): string {
  return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][m] ?? ''
}

export function getFrequencyLabel(f: BillFrequency): string {
  return f === 'annual' ? 'Anual' : 'Mensual'
}
