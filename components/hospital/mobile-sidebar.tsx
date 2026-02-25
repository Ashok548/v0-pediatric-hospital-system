"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Baby,
  CalendarDays,
  FlaskConical,
  CreditCard,
  Syringe,
  BarChart3,
  Settings,
  X,
  Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Patients", icon: Users, href: "/patients" },
  { label: "NICU", icon: Baby, href: "/nicu" },
  { label: "Appointments", icon: CalendarDays, href: "/appointments" },
  { label: "Lab", icon: FlaskConical, href: "/lab" },
  { label: "Billing", icon: CreditCard, href: "/billing" },
  { label: "Vaccination", icon: Syringe, href: "/vaccination" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
  activeItem?: string
}

export function MobileSidebar({ open, onClose, activeItem = "Dashboard" }: MobileSidebarProps) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-foreground/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-sidebar-primary">
              <Heart className="size-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">CareNest</span>
              <span className="text-[11px] text-sidebar-foreground/60">{"Children's Hospital"}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/50 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="py-4 px-3 overflow-y-auto" role="navigation" aria-label="Mobile navigation">
          <ul className="flex flex-col gap-1" role="list">
            {navItems.map((item) => {
              const isActive = item.label === activeItem
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </>
  )
}
