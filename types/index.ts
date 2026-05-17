export type BillCategory =
  | 'housing'
  | 'utilities'
  | 'transport'
  | 'insurance'
  | 'subscription'
  | 'loan'
  | 'credit'
  | 'other'

export type BillFrequency = 'monthly' | 'annual'

export type ActiveView = 'dashboard' | 'bills' | 'calendar' | 'paycheck'

export interface Bill {
  id: string
  name: string
  category: BillCategory
  amount: number
  frequency: BillFrequency
  dueDay: number
  dueMonth?: number       // For annual: 1-12
  isAutomatic: boolean    // Auto-pay set up
  isFixed: boolean        // Fixed amount each period
  isLoan: boolean         // Has a balance to track
  loanBalance?: number
  loanOriginalAmount?: number
  paidPeriods: string[]   // ["2025-05"] monthly, ["2025"] annual
  reminderDays: number
  notes?: string
  createdAt: string
}

export interface AppSettings {
  paycheckFrequency: 'weekly' | 'biweekly' | 'semimonthly'
  nextPayDate: string   // "2025-05-19"
}
