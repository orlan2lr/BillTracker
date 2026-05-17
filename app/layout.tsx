import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "BillTracker - Control de Facturas",
  description: "Gestiona y controla todos tus pagos y facturas mensuales y anuales",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased bg-slate-950">{children}</body>
    </html>
  )
}
