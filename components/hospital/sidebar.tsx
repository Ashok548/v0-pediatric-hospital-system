"use client"

import { useState } from "react"
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
  ChevronLeft,
  ChevronRight,
  Heart,
  ClipboardList,
  BedDouble,
  Stethoscope,
  Pill,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { useAuthStore } from "@/lib/store/auth-store"

const ALL_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", feature: "dashboard" },
  { label: "Patients", icon: Users, href: "/patients", feature: "patients" },
  { label: "NICU", icon: Baby, href: "/nicu", feature: "nicu" },
  { label: "Appointments", icon: CalendarDays, href: "/appointments", feature: "appointments" },
  { label: "Admissions", icon: ClipboardList, href: "/admissions", feature: "admissions" },
  { label: "Nursing", icon: Stethoscope, href: "/nursing", feature: "nursing" },
  { label: "Beds", icon: BedDouble, href: "/beds", feature: "beds" },
  { label: "Pharmacy", icon: Pill, href: "/pharmacy", feature: "pharmacy" },
  { label: "Lab", icon: FlaskConical, href: "/lab", feature: "lab" },
  { label: "Billing", icon: CreditCard, href: "/billing", feature: "billing" },
  { label: "Vaccination", icon: Syringe, href: "/vaccination", feature: "vaccination" },
  { label: "Reports", icon: BarChart3, href: "/reports", feature: "reports" },
  { label: "Settings", icon: Settings, href: "/settings", feature: "settings" },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  activeItem?: string
}

export function Sidebar({ collapsed, onToggle, activeItem = "Dashboard" }: SidebarProps) {
  const { canAccess } = useAuthStore()
  const navItems = ALL_NAV_ITEMS.filter(item => canAccess(item.feature))
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo / Brand */}
        <div className={cn(
          "flex items-center h-16 border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="flex items-center justify-center size-9 rounded-lg bg-sidebar-primary shrink-0">
            <Heart className="size-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">
                CareNest
              </span>
              <span className="text-[11px] text-sidebar-foreground/60 truncate">
                {"Children's Hospital"}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto" role="navigation" aria-label="Main navigation">
          <ul className="flex flex-col gap-1" role="list">
            {navItems.map((item) => {
              const isActive = item.label === activeItem
              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="size-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )

              return (
                <li key={item.label}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-full rounded-lg py-2 text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="size-4" />
                <span>Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
