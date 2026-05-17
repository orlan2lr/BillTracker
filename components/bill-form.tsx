"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bill, BillCategory, BillFrequency } from "@/types"
import { getCategoryConfig, getMonthName } from "@/lib/bill-utils"
import { cn } from "@/lib/utils"
import { X, ChevronDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type FormData = Omit<Bill, 'id' | 'createdAt' | 'paidPeriods'>

const CATEGORIES: BillCategory[] = ['housing','utilities','transport','insurance','subscription','loan','credit','other']
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

interface BillFormProps {
  bill: Bill | null
  onSubmit: (data: FormData) => void
  onClose: () => void
}

export function BillForm({ bill, onSubmit, onClose }: BillFormProps) {
  const [form, setForm] = useState<FormData>({
    name: '',
    category: 'utilities',
    amount: 0,
    frequency: 'monthly',
    dueDay: 1,
    dueMonth: 1,
    isAutomatic: false,
    isFixed: true,
    isLoan: false,
    loanBalance: undefined,
    loanOriginalAmount: undefined,
    reminderDays: 3,
    notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (bill) {
      setForm({
        name: bill.name,
        category: bill.category,
        amount: bill.amount,
        frequency: bill.frequency,
        dueDay: bill.dueDay,
        dueMonth: bill.dueMonth ?? 1,
        isAutomatic: bill.isAutomatic,
        isFixed: bill.isFixed,
        isLoan: bill.isLoan,
        loanBalance: bill.loanBalance,
        loanOriginalAmount: bill.loanOriginalAmount,
        reminderDays: bill.reminderDays,
        notes: bill.notes ?? '',
      })
    }
  }, [bill])

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.name.trim()) e.name = 'El nombre es requerido'
    if (!form.amount || form.amount <= 0) e.amount = 'Ingresa un monto válido'
    if (!form.dueDay || form.dueDay < 1 || form.dueDay > 31) e.dueDay = 'Día inválido (1-31)'
    if (form.frequency === 'annual' && (!form.dueMonth || form.dueMonth < 1 || form.dueMonth > 12)) e.dueMonth = 'Selecciona el mes'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  const cat = getCategoryConfig(form.category)

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="relative bg-slate-900 rounded-t-2xl max-h-[92vh] flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">{bill ? 'Editar Factura' : 'Nueva Factura'}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Nombre *</Label>
              <Input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ej: Internet, Netflix, Pago de Auto..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
            </div>

            {/* Amount + Fixed toggle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Monto ($) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount || ''}
                  onChange={e => set('amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                {errors.amount && <p className="text-red-400 text-xs">{errors.amount}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Tipo de monto</Label>
                <div className={cn(
                  "flex items-center gap-2 h-10 px-3 rounded-lg border",
                  form.isFixed ? "border-blue-600/50 bg-blue-600/10" : "border-amber-600/50 bg-amber-600/10"
                )}>
                  <Switch
                    checked={form.isFixed}
                    onCheckedChange={v => set('isFixed', v)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className={cn("text-xs font-medium", form.isFixed ? "text-blue-400" : "text-amber-400")}>
                    {form.isFixed ? 'Fijo' : 'Variable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Categoría *</Label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(c => {
                  const cfg = getCategoryConfig(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('category', c)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                        form.category === c
                          ? `border-transparent ${cfg.color} text-white`
                          : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                      )}
                    >
                      <span className="text-lg leading-none">{cfg.emoji}</span>
                      <span className="text-center leading-tight">{cfg.label.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Frecuencia *</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['monthly', 'annual'] as BillFrequency[]).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set('frequency', f)}
                    className={cn(
                      "py-3 rounded-lg border text-sm font-medium transition-all",
                      form.frequency === f
                        ? "border-blue-600 bg-blue-600/20 text-blue-400"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    {f === 'monthly' ? '📅 Mensual' : '📆 Anual'}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div className={cn("grid gap-4", form.frequency === 'annual' ? "grid-cols-2" : "grid-cols-1")}>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Día de vencimiento *</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={form.dueDay || ''}
                  onChange={e => set('dueDay', parseInt(e.target.value) || 1)}
                  placeholder="Ej: 15"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {errors.dueDay && <p className="text-red-400 text-xs">{errors.dueDay}</p>}
              </div>

              {form.frequency === 'annual' && (
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Mes *</Label>
                  <div className="relative">
                    <select
                      value={form.dueMonth ?? 1}
                      onChange={e => set('dueMonth', parseInt(e.target.value))}
                      className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {MONTHS.map(m => (
                        <option key={m} value={m}>{getMonthName(m - 1)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {errors.dueMonth && <p className="text-red-400 text-xs">{errors.dueMonth}</p>}
                </div>
              )}
            </div>

            {/* Auto-pay + Reminder */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-slate-700 bg-slate-800 space-y-2">
                <Label className="text-slate-300 text-sm block">Pago Automático</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isAutomatic}
                    onCheckedChange={v => set('isAutomatic', v)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className={cn("text-xs", form.isAutomatic ? "text-blue-400" : "text-slate-400")}>
                    {form.isAutomatic ? '⚡ Activo' : '✋ Manual'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Recordatorio</Label>
                <div className="relative">
                  <select
                    value={form.reminderDays}
                    onChange={e => set('reminderDays', parseInt(e.target.value))}
                    className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value={0}>Mismo día</option>
                    <option value={1}>1 día antes</option>
                    <option value={3}>3 días antes</option>
                    <option value={5}>5 días antes</option>
                    <option value={7}>1 semana antes</option>
                    <option value={14}>2 semanas antes</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Loan toggle */}
            <div className={cn(
              "p-4 rounded-xl border transition-all",
              form.isLoan ? "border-amber-600/40 bg-amber-600/5" : "border-slate-700 bg-slate-800"
            )}>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-slate-200 text-sm font-medium">
                  🏦 Tiene balance pendiente (préstamo / crédito)
                </Label>
                <Switch
                  checked={form.isLoan}
                  onCheckedChange={v => set('isLoan', v)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              <p className="text-xs text-slate-500">Para préstamos, hipoteca, tarjetas de crédito</p>

              {form.isLoan && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Balance actual ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.loanBalance ?? ''}
                      onChange={e => set('loanBalance', parseFloat(e.target.value) || undefined)}
                      placeholder="Ej: 15,000"
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Monto original ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.loanOriginalAmount ?? ''}
                      onChange={e => set('loanOriginalAmount', parseFloat(e.target.value) || undefined)}
                      placeholder="Ej: 20,000"
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Notas (opcional)</Label>
              <Textarea
                value={form.notes ?? ''}
                onChange={e => set('notes', e.target.value)}
                placeholder="Banco, teléfono de servicio, cuenta..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                rows={2}
              />
            </div>

            {/* Spacer for footer */}
            <div className="h-4" />
          </form>

          {/* Footer buttons */}
          <div className="px-5 py-4 border-t border-slate-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="none"
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-semibold"
            >
              {bill ? '💾 Guardar cambios' : '✓ Agregar factura'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
