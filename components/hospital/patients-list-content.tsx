"use client"

import React, { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Eye,
  X,
  Users,
  Baby,
  Stethoscope,
  LogOut as LogOutIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getPatients, subscribe, updatePatientStatus } from "@/lib/store/patients"
import type { Patient, PatientStatus } from "@/lib/data/types"

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = "lastModified" | "name" | "uhid" | "age"
type SortDir = "asc" | "desc"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

function formatAge(years: number, months: number): string {
  if (years === 0) return `${months}mo`
  if (months === 0) return `${years}y`
  return `${years}y ${months}mo`
}

function getInitials(first: string, last: string): string {
  return `${first[0]}${last[0]}`.toUpperCase()
}

const statusConfig: Record<PatientStatus, { label: string; className: string }> = {
  OP: {
    label: "OP",
    className: "bg-[#e8f4fd] text-[#1a6fb5] border-[#bcddf5]",
  },
  IP: {
    label: "IP",
    className: "bg-[#fef3cd] text-[#856404] border-[#ffeaa0]",
  },
  NICU: {
    label: "NICU",
    className: "bg-[#fde8e8] text-[#c53030] border-[#f5bcbc]",
  },
  Discharged: {
    label: "Discharged",
    className: "bg-[#e6f6ee] text-[#1a7a4c] border-[#b4e4cb]",
  },
}

// ─── Sample Data ─────────────────────────────────────────────────────────────
// Data is now centrally defined in lib/data/patients.ts and imported above.

// ─── Component ────────────────────────────────────────────────────────────────
export function PatientsListContent() {
  const [patients, setPatients] = useState<Patient[]>(getPatients())
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PatientStatus | "all">("all")
  const [doctorFilter, setDoctorFilter] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("lastModified")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)

  // Subscribe to patient store updates
  React.useEffect(() => {
    setPatients(getPatients())
    return subscribe(() => setPatients(getPatients()))
  }, [])

  const doctors = useMemo(() => [...new Set(patients.map(p => p.doctor))].sort(), [patients])

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "lastModified" ? "desc" : "asc")
    }
  }, [sortKey])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return patients
      .filter(p => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false
        if (doctorFilter !== "all" && p.doctor !== doctorFilter) return false
        if (q) {
          const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
          return (
            fullName.includes(q) ||
            p.uhid.toLowerCase().includes(q) ||
            p.phone.includes(q) ||
            p.guardianName.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1
        switch (sortKey) {
          case "name":
            return dir * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
          case "uhid":
            return dir * a.uhid.localeCompare(b.uhid)
          case "age": {
            const ageA = a.ageYears * 12 + a.ageMonths
            const ageB = b.ageYears * 12 + b.ageMonths
            return dir * (ageA - ageB)
          }
          case "lastModified":
          default:
            return dir * (a.lastModified.getTime() - b.lastModified.getTime())
        }
      })
  }, [search, statusFilter, doctorFilter, sortKey, sortDir, patients])

  const statusCounts = useMemo(() => ({
    all: patients.length,
    OP: patients.filter(p => p.status === "OP").length,
    IP: patients.filter(p => p.status === "IP").length,
    NICU: patients.filter(p => p.status === "NICU").length,
    Discharged: patients.filter(p => p.status === "Discharged").length,
  }), [patients])

  const isRecent = (date: Date) => (new Date().getTime() - date.getTime()) < 10 * 60000

  const clearFilters = () => {
    setStatusFilter("all")
    setDoctorFilter("all")
    setSearch("")
  }

  const hasActiveFilters = statusFilter !== "all" || doctorFilter !== "all" || search.length > 0

  // Sorting header helper
  function SortHeader({ label, sortKeyVal, className }: { label: string; sortKeyVal: SortKey; className?: string }) {
    const isActive = sortKey === sortKeyVal
    return (
      <button
        onClick={() => handleSort(sortKeyVal)}
        className={cn(
          "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group",
          isActive && "text-primary",
          className,
        )}
      >
        {label}
        <span className="flex flex-col -space-y-1">
          <ChevronUp className={cn("size-3", isActive && sortDir === "asc" ? "text-primary" : "text-muted-foreground/40")} />
          <ChevronDown className={cn("size-3", isActive && sortDir === "desc" ? "text-primary" : "text-muted-foreground/40")} />
        </span>
      </button>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight text-balance">Patients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {patients.length} registered patients across all departments
          </p>
        </div>
        <Button className="gap-2 shrink-0">
          <Plus className="size-4" />
          <span>Add Patient</span>
        </Button>
      </div>

      {/* ── Status Summary Chips ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {(["all", "OP", "IP", "NICU", "Discharged"] as const).map((s) => {
          const isActive = statusFilter === s
          const count = statusCounts[s]
          const ChipIcon = s === "all" ? Users : s === "NICU" ? Baby : s === "IP" ? Stethoscope : s === "Discharged" ? LogOutIcon : Users
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(isActive ? "all" : s)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground",
              )}
            >
              <ChipIcon className="size-3.5" />
              <span>{s === "all" ? "All" : s}</span>
              <span className={cn(
                "flex items-center justify-center size-5 rounded-full text-[10px] font-bold",
                isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search + Filter Bar ────────────────────────────────────────── */}
      <Card className="py-0">
        <CardContent className="px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, UHID, or phone..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                aria-label="Search patients"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="default"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && !showFilters && (
                  <span className="flex items-center justify-center size-4 rounded-full bg-destructive text-[9px] text-primary-foreground font-bold">
                    !
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="default" onClick={clearFilters} className="text-muted-foreground gap-1.5">
                  <X className="size-3.5" />
                  <span className="text-xs">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Doctor</span>
                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="All doctors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doctors</SelectItem>
                    {doctors.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Results Count ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {patients.length} patients
        </p>
        <p className="text-xs text-muted-foreground">
          Sorted by <span className="font-medium text-foreground">{sortKey === "lastModified" ? "Last Modified" : sortKey === "name" ? "Name" : sortKey === "uhid" ? "UHID" : "Age"}</span>
        </p>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <Card className="py-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3">
                  <SortHeader label="UHID" sortKeyVal="uhid" />
                </th>
                <th className="text-left px-4 py-3">
                  <SortHeader label="Patient Name" sortKeyVal="name" />
                </th>
                <th className="text-left px-4 py-3">
                  <SortHeader label="Age" sortKeyVal="age" />
                </th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guardian</span>
                </th>
                <th className="text-left px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                </th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Doctor</span>
                </th>
                <th className="text-left px-4 py-3">
                  <SortHeader label="Modified" sortKeyVal="lastModified" />
                </th>
                <th className="text-right px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="size-10 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-muted-foreground">No patients found</p>
                      <p className="text-xs text-muted-foreground/70">Try adjusting your search or filter criteria</p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 text-xs">
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const recent = isRecent(p.lastModified)
                  const sc = statusConfig[p.status]
                  const selected = selectedRow === p.uhid
                  return (
                    <tr
                      key={p.uhid}
                      onClick={() => setSelectedRow(selected ? null : p.uhid)}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors cursor-pointer group",
                        recent && "bg-primary/[0.03]",
                        selected ? "bg-primary/[0.06]" : "hover:bg-muted/50",
                      )}
                    >
                      {/* UHID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {recent && (
                            <span className="flex size-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                          )}
                          <span className="text-xs font-mono font-medium text-foreground">{p.uhid}</span>
                        </div>
                      </td>

                      {/* Patient Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback className={cn(
                              "text-[11px] font-semibold",
                              p.gender === "F"
                                ? "bg-[#fce4ec] text-[#c2185b]"
                                : "bg-[#e3f2fd] text-[#1565c0]",
                            )}>
                              {getInitials(p.firstName, p.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{p.gender === "F" ? "Female" : "Male"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Age */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{formatAge(p.ageYears, p.ageMonths)}</span>
                      </td>

                      {/* Guardian */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{p.guardianName}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "flex items-center justify-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-opacity hover:opacity-80 outline-none",
                                sc.className
                              )}
                            >
                              {sc.label}
                              <ChevronDown className="size-3 ml-1 opacity-50" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-36">
                            {(["OP", "IP", "NICU", "Discharged"] as PatientStatus[]).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updatePatientStatus(p.uhid, status)
                                }}
                                className={cn(
                                  "text-xs cursor-pointer",
                                  p.status === status && "bg-muted font-medium"
                                )}
                              >
                                {statusConfig[status].label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {p.wardBed && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{p.wardBed}</p>
                        )}
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{p.doctor}</span>
                      </td>

                      {/* Last Modified */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs",
                          recent ? "text-primary font-semibold" : "text-muted-foreground",
                        )}>
                          {timeAgo(p.lastModified)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <Link href={`/patients/${p.uhid}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye className="size-3.5" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer ─────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-medium text-foreground">1</span> of 1
            </p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled className="text-xs h-7 px-3">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled className="text-xs h-7 px-3">
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
