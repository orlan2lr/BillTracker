"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LayoutDashboard, List, Calendar, DollarSign, Plus } from "lucide-react"
import { useBills } from "@/hooks/use-bills"
import { DashboardView } from "@/components/views/dashboard"
import { BillsListView } from "@/components/views/bills-list"
import { CalendarView } from "@/components/views/calendar-view"
import { PaycheckView } from "@/components/views/paycheck-view"
import { BillForm } from "@/components/bill-form"
import { cn } from "@/lib/utils"
import type { ActiveView, Bill } from "@/types"

const NAV = [
  { id: 'dashboard' as ActiveView, label: 'Inicio',     icon: LayoutDashboard },
  { id: 'bills'     as ActiveView, label: 'Facturas',   icon: List },
  { id: 'calendar'  as ActiveView, label: 'Calendario', icon: Calendar },
  { id: 'paycheck'  as ActiveView, label: 'Cheque',     icon: DollarSign },
]

const PAGE_TITLE: Record<ActiveView, string> = {
  dashboard: '💰 BillTracker',
  bills:     '📋 Facturas',
  calendar:  '📅 Calendario',
  paycheck:  '💵 Planificador',
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const { bills, settings, addBill, updateBill, deleteBill, togglePaid, updateSettings, isLoaded } = useBills()

  const openEdit = (bill: Bill) => { setEditingBill(bill); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditingBill(null) }

  const handleSubmit = (data: Omit<Bill, 'id' | 'createdAt' | 'paidPeriods'>) => {
    if (editingBill) {
      updateBill({ ...editingBill, ...data })
    } else {
      addBill(data)
    }
    closeForm()
  }

  const paidCount = bills.filter(b => {
    const now = new Date()
    const period = b.frequency === 'annual'
      ? `${now.getFullYear()}`
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return b.paidPeriods.includes(period)
  }).length

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen flex flex-col relative">

        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 pt-10 pb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">{PAGE_TITLE[activeView]}</h1>
          <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
            {paidCount}/{bills.length} pagadas
          </span>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeView === 'dashboard' && (
                <DashboardView bills={bills} onEditBill={openEdit} onTogglePaid={togglePaid} />
              )}
              {activeView === 'bills' && (
                <BillsListView bills={bills} onEditBill={openEdit} onDeleteBill={deleteBill} onTogglePaid={togglePaid} />
              )}
              {activeView === 'calendar' && (
                <CalendarView bills={bills} onTogglePaid={togglePaid} />
              )}
              {activeView === 'paycheck' && (
                <PaycheckView bills={bills} settings={settings} onUpdateSettings={updateSettings} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* FAB */}
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-[76px] right-4 z-20 w-14 h-14 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-full flex items-center justify-center shadow-2xl shadow-blue-900/40 transition-all"
          aria-label="Agregar factura"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-10 flex justify-center">
          <div className="w-full max-w-md bg-slate-900/95 backdrop-blur border-t border-slate-800 flex">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 transition-colors",
                  activeView === item.id ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[11px]">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <BillForm bill={editingBill} onSubmit={handleSubmit} onClose={closeForm} />
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
