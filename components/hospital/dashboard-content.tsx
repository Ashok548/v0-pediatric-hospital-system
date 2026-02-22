import {
  Users,
  BedDouble,
  CalendarDays,
  Baby,
} from "lucide-react"
import { StatCard } from "./stat-card"
import { BedOccupancy } from "./bed-occupancy"
import { RecentPatients } from "./recent-patients"
import { UpcomingAppointments } from "./upcoming-appointments"
import { QuickActions } from "./quick-actions"

export function DashboardContent() {
  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight text-balance">
          Dashboard Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          CareNest 200-Bed Multi-Speciality Childcare Hospital &middot; Real-time operational snapshot
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value="139"
          change="+12 from yesterday"
          changeType="positive"
          icon={Users}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Beds Occupied"
          value="139/200"
          change="69.5% occupancy"
          changeType="neutral"
          icon={BedDouble}
          iconColor="text-chart-2"
          iconBg="bg-chart-2/10"
        />
        <StatCard
          title="Today's Appointments"
          value="47"
          change="8 pending check-in"
          changeType="neutral"
          icon={CalendarDays}
          iconColor="text-chart-3"
          iconBg="bg-chart-3/10"
        />
        <StatCard
          title="NICU Admissions"
          value="18"
          change="2 critical alerts"
          changeType="negative"
          icon={Baby}
          iconColor="text-destructive"
          iconBg="bg-destructive/10"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - 2 cols wide */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <RecentPatients />
          <UpcomingAppointments />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <BedOccupancy />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
