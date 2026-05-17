"use client"

import { useState, useEffect, useCallback } from "react"
import { Bill, AppSettings } from "@/types"

const BILLS_KEY = "billtracker_bills_v2"
const SETTINGS_KEY = "billtracker_settings_v2"

// --- Default sample data (realistic household) ---
const DEFAULT_BILLS: Bill[] = [
  { id:'1', name:'Mortgage', category:'housing', amount:1500, frequency:'monthly',
    dueDay:1, isAutomatic:false, isFixed:true, isLoan:true,
    loanBalance:182500, loanOriginalAmount:220000,
    paidPeriods:[], reminderDays:5, notes:'Banco Nacional', createdAt:new Date().toISOString() },
  { id:'2', name:'Electricidad', category:'utilities', amount:125, frequency:'monthly',
    dueDay:15, isAutomatic:false, isFixed:false, isLoan:false,
    paidPeriods:[], reminderDays:3, createdAt:new Date().toISOString() },
  { id:'3', name:'Internet', category:'utilities', amount:65, frequency:'monthly',
    dueDay:20, isAutomatic:true, isFixed:true, isLoan:false,
    paidPeriods:[], reminderDays:0, createdAt:new Date().toISOString() },
  { id:'4', name:'Teléfono Móvil', category:'utilities', amount:80, frequency:'monthly',
    dueDay:10, isAutomatic:true, isFixed:true, isLoan:false,
    paidPeriods:[], reminderDays:0, createdAt:new Date().toISOString() },
  { id:'5', name:'Seguro de Auto', category:'insurance', amount:148, frequency:'monthly',
    dueDay:5, isAutomatic:true, isFixed:true, isLoan:false,
    paidPeriods:[], reminderDays:0, createdAt:new Date().toISOString() },
  { id:'6', name:'Pago de Auto', category:'transport', amount:352, frequency:'monthly',
    dueDay:5, isAutomatic:false, isFixed:true, isLoan:true,
    loanBalance:11800, loanOriginalAmount:18500,
    paidPeriods:[], reminderDays:3, notes:'Toyota Camry 2022', createdAt:new Date().toISOString() },
  { id:'7', name:'Tarjeta Visa', category:'credit', amount:200, frequency:'monthly',
    dueDay:18, isAutomatic:false, isFixed:false, isLoan:true,
    loanBalance:3250, loanOriginalAmount:5000,
    paidPeriods:[], reminderDays:5, notes:'Pago mínimo ~$65. Meta: $200/mes', createdAt:new Date().toISOString() },
  { id:'8', name:'Tarjeta Mastercard', category:'credit', amount:150, frequency:'monthly',
    dueDay:22, isAutomatic:false, isFixed:false, isLoan:true,
    loanBalance:1850, loanOriginalAmount:3000,
    paidPeriods:[], reminderDays:5, createdAt:new Date().toISOString() },
  { id:'9', name:'Netflix', category:'subscription', amount:15.49, frequency:'monthly',
    dueDay:8, isAutomatic:true, isFixed:true, isLoan:false,
    paidPeriods:[], reminderDays:0, createdAt:new Date().toISOString() },
  { id:'10', name:'Spotify', category:'subscription', amount:11.99, frequency:'monthly',
    dueDay:12, isAutomatic:true, isFixed:true, isLoan:false,
    paidPeriods:[], reminderDays:0, createdAt:new Date().toISOString() },
  { id:'11', name:'Gimnasio', category:'subscription', amount:45, frequency:'monthly',
    dueDay:1, isAutomatic:true, isFixed:true, isLoan:false,
    paidPeriods:[], reminderDays:0, createdAt:new Date().toISOString() },
  { id:'12', name:'Amazon Prime', category:'subscription', amount:139, frequency:'annual',
    dueDay:15, dueMonth:6, isAutomatic:true, isFixed:true, isLoan:false,
    paidPeriods:[], reminderDays:7, createdAt:new Date().toISOString() },
  { id:'13', name:'Seguro de Vida', category:'insurance', amount:850, frequency:'annual',
    dueDay:10, dueMonth:9, isAutomatic:true, isFixed:true, isLoan:false,
    paidPeriods:[], reminderDays:14, createdAt:new Date().toISOString() },
  { id:'14', name:'Seguro de Hogar', category:'insurance', amount:1200, frequency:'annual',
    dueDay:1, dueMonth:3, isAutomatic:false, isFixed:true, isLoan:false,
    paidPeriods:[], reminderDays:14, createdAt:new Date().toISOString() },
]

function getDefaultNextPayDate(): string {
  const today = new Date()
  const day = today.getDay() // 0=Sun, 1=Mon...
  const daysUntilFriday = (5 - day + 7) % 7 || 7
  const nextFriday = new Date(today)
  nextFriday.setDate(today.getDate() + daysUntilFriday)
  return nextFriday.toISOString().split('T')[0]
}

const DEFAULT_SETTINGS: AppSettings = {
  paycheckFrequency: 'biweekly',
  nextPayDate: getDefaultNextPayDate(),
}

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedBills = localStorage.getItem(BILLS_KEY)
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    setBills(savedBills ? JSON.parse(savedBills) : DEFAULT_BILLS)
    if (!savedBills) localStorage.setItem(BILLS_KEY, JSON.stringify(DEFAULT_BILLS))
    if (savedSettings) setSettings(JSON.parse(savedSettings))
    setIsLoaded(true)
  }, [])

  const save = useCallback((next: Bill[]) => {
    setBills(next)
    localStorage.setItem(BILLS_KEY, JSON.stringify(next))
  }, [])

  const addBill = useCallback((bill: Omit<Bill, 'id' | 'createdAt' | 'paidPeriods'>) => {
    const b: Bill = { ...bill, id: crypto.randomUUID(), paidPeriods: [], createdAt: new Date().toISOString() }
    save([...bills, b])
  }, [bills, save])

  const updateBill = useCallback((updated: Bill) => {
    save(bills.map(b => b.id === updated.id ? updated : b))
  }, [bills, save])

  const deleteBill = useCallback((id: string) => {
    save(bills.filter(b => b.id !== id))
  }, [bills, save])

  const togglePaid = useCallback((bill: Bill) => {
    const period = bill.frequency === 'annual'
      ? `${new Date().getFullYear()}`
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const updated: Bill = {
      ...bill,
      paidPeriods: bill.paidPeriods.includes(period)
        ? bill.paidPeriods.filter(p => p !== period)
        : [...bill.paidPeriods, period],
    }
    updateBill(updated)
  }, [updateBill])

  const updateSettings = useCallback((s: AppSettings) => {
    setSettings(s)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  }, [])

  return { bills, settings, addBill, updateBill, deleteBill, togglePaid, updateSettings, isLoaded }
}
