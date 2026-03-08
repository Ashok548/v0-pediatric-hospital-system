"use client"

import {
  Users,
  Baby,
  CalendarDays,
  Syringe,
  IndianRupee,
} from "lucide-react"
import { StatCard } from "./stat-card"
import { CriticalAlerts } from "./critical-alerts"
import { BedOccupancy } from "./bed-occupancy"
import { RecentPatients } from "./recent-patients"
import { UpcomingAppointments } from "./upcoming-appointments"
import { QuickActions } from "./quick-actions"
import { useReportKpis } from "@/lib/api/reports"

export function DashboardContent() {
  const { kpis, isLoading } = useReportKpis()

  // Safely format currency
  const formatCurrency = (amt: number | undefined) => {
    if (amt === undefined) return "0"
    return new Intl.NumberFormat("en-IN").format(amt)
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight text-balance">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          CareNest 200-Bed Multi-Speciality Childcare Hospital &middot; Real-time operational overview
        </p>
      </div>

      {/* KPI Stat Cards - 5 across */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Patients"
          value={isLoading ? "..." : String(kpis?.totalPatients ?? 0)}
          subtitle="Active in-patients"
          change={isLoading ? "" : "Live census data"}
          changeType="neutral"
          icon={Users}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="NICU Occupancy"
          value={isLoading ? "..." : `${kpis?.nicuOccupancy.occupied ?? 0} / ${kpis?.nicuOccupancy.total ?? 0}`}
          subtitle="Beds occupied"
          change={isLoading ? "" : `${kpis?.nicuOccupancy.percentage ?? 0}% utilization`}
          changeType="neutral"
          icon={Baby}
          iconColor="text-destructive"
          iconBg="bg-destructive/10"
          percentage={kpis?.nicuOccupancy.percentage ?? 0}
        />
        <StatCard
          title="Today's Appointments"
          value="47"
          subtitle="Across all departments"
          change="8 pending check-in"
          changeType="neutral"
          icon={CalendarDays}
          iconColor="text-chart-2"
          iconBg="bg-chart-2/10"
        />
        <StatCard
          title="Vaccination Due"
          value="23"
          subtitle="Scheduled for today"
          change="5 walk-in slots open"
          changeType="positive"
          icon={Syringe}
          iconColor="text-chart-5"
          iconBg="bg-chart-5/10"
        />
        <StatCard
          title="Revenue Today"
          value={isLoading ? "..." : formatCurrency(kpis?.revenueToday)}
          subtitle="Total collections"
          change={isLoading ? "" : "Live billing data"}
          changeType="positive"
          icon={IndianRupee}
          iconColor="text-chart-3"
          iconBg="bg-chart-3/10"
        />
      </div>

      {/* Critical Alerts Panel */}
      <CriticalAlerts />

      {/* Recent Admissions Table */}
      <RecentPatients />

      {/* Bottom Grid: Appointments + Bed Occupancy + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <UpcomingAppointments />
        </div>
        <div className="xl:col-span-1">
          <BedOccupancy />
        </div>
        <div className="xl:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
