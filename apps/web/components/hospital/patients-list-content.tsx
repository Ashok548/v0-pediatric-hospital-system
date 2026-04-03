"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  Eye,
  X,
  Users,
  Baby,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  UserPlus,
  CalendarPlus,
  Receipt,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useQuery } from "@/hooks/use-query"
import { useUrlQuery } from "@/hooks/use-url-query"
import { useDebounce } from "@/hooks/use-debounce"
import { createBill } from "@/lib/api/billing"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiPatient {
  id: string
  uhid: string
  firstName: string
  lastName: string
  gender: "MALE" | "FEMALE" | "OTHER"
  dateOfBirth: string
  bloodGroup: string | null
  phone: string
  email: string | null
  guardianName: string
  guardianPhone: string | null
  guardianRelationship: string | null
  birthWeight: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  abhaId: string | null
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}

interface PaginatedPatients {
  data: ApiPatient[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type SortKey = "updatedAt" | "firstName" | "uhid"
type SortDir = "asc" | "desc"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAgeFromDob(dateOfBirth: string): { years: number; months: number } {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth() - dob.getMonth()
  if (months < 0) { years--; months += 12 }
  return { years, months }
}

function formatAge(years: number, months: number): string {
  if (years === 0) return `${months}mo`
  if (months === 0) return `${years}y`
  return `${years}y ${months}mo`
}

function getInitials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
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

// ─── Row Skeleton ──────────────────────────────────────────────────────────────
function PatientRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  )
}

// ─── Row Action Dropdown ───────────────────────────────────────────────────────
function PatientRowActions({ patient }: { patient: ApiPatient }) {
  const router = useRouter()
  const [opLoading, setOpLoading] = useState(false)

  async function handleGenerateOP() {
    setOpLoading(true)
    try {
      const bill = await createBill({
        patientId: patient.id,
        department: "General OPD",
        notes: "Walk-in outpatient registration",
      })
      router.push(`/billing/op/new?billId=${bill.id}`)
    } catch (err: any) {
      alert(err?.message ?? "Failed to generate OP")
    } finally {
      setOpLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          aria-label="Patient actions"
        >
          {opLoading
            ? <Loader2 className="size-4 animate-spin" />
            : <MoreHorizontal className="size-4" />
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {/* View Details */}
        <DropdownMenuItem asChild>
          <Link href={`/patients/${patient.id}`} className="flex items-center gap-2 cursor-pointer">
            <Eye className="size-3.5 text-muted-foreground" />
            <span>View Details</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Generate OP */}
        <DropdownMenuItem
          onClick={handleGenerateOP}
          disabled={opLoading || patient.status !== "ACTIVE"}
          className="flex items-center gap-2 cursor-pointer text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
        >
          <Stethoscope className="size-3.5" />
          <span>{opLoading ? "Generating..." : "Generate OP"}</span>
        </DropdownMenuItem>

        {/* Admit to Ward */}
        <DropdownMenuItem asChild>
          <Link
            href={`/admissions/new?patientId=${patient.id}`}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              patient.status !== "ACTIVE" && "pointer-events-none opacity-50"
            )}
          >
            <UserPlus className="size-3.5 text-muted-foreground" />
            <span>Admit to Ward</span>
          </Link>
        </DropdownMenuItem>

        {/* Generate IP Bill */}
        <DropdownMenuItem asChild>
          <Link
            href={`/billing/ip`}
            className="flex items-center gap-2 cursor-pointer text-blue-700 focus:text-blue-700 focus:bg-blue-50"
          >
            <Receipt className="size-3.5" />
            <span>Generate IP Bill</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Book Appointment */}
        <DropdownMenuItem asChild>
          <Link
            href={`/appointments?newFor=${patient.id}&name=${encodeURIComponent(`${patient.firstName} ${patient.lastName}`)}`}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              patient.status !== "ACTIVE" && "pointer-events-none opacity-50"
            )}
          >
            <CalendarPlus className="size-3.5 text-muted-foreground" />
            <span>Book Appointment</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PatientsListContent() {
  // URL-synced state — page, limit, search from URL
  const { page, limit, search, setQueryParams } = useUrlQuery()

  // Local search input (debounced before writing to URL)
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebounce(searchInput, 400)

  // Sync debounced search to URL
  React.useEffect(() => {
    if (debouncedSearch !== search) {
      setQueryParams({ search: debouncedSearch || null, page: 1 })
    }
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Local sort state (client-side sort preference mapped to API params)
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Build query string for API
  const qs = new URLSearchParams()
  qs.set("page", String(page))
  qs.set("limit", String(limit))
  if (debouncedSearch) qs.set("search", debouncedSearch)
  qs.set("sortBy", sortKey)
  qs.set("order", sortDir)

  const { data, isLoading, error } = useQuery<PaginatedPatients>(`/patients?${qs.toString()}`)

  const patients = data?.data ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir(key === "updatedAt" ? "desc" : "asc")
    }
  }

  function SortHeader({ label, sortKeyVal, className }: { label: string; sortKeyVal: SortKey; className?: string }) {
    const isActive = sortKey === sortKeyVal
    return (
      <button
        onClick={() => handleSort(sortKeyVal)}
        className={cn(
          "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors",
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
          <h1 className="text-xl font-bold text-foreground tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading..." : `${total} registered patients`}
          </p>
        </div>
        <Link href="/patients/register">
          <Button className="gap-2 shrink-0">
            <Plus className="size-4" />
            <span>Add Patient</span>
          </Button>
        </Link>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────────── */}
      <Card className="py-0">
        <CardContent className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, UHID, or phone..."
              className="w-full h-9 pl-9 pr-9 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
              aria-label="Search patients"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("")
                  setQueryParams({ search: null, page: 1 })
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Results Count ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isLoading
            ? "Fetching patients..."
            : <>Showing <span className="font-semibold text-foreground">{patients.length}</span> of {total} patients</>
          }
        </p>
        {isLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>

      {/* ── Error State ─────────────────────────────────────────────────── */}
      {error && !isLoading && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-destructive font-medium">Failed to load patients</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {!error && (
        <Card className="py-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3">
                    <SortHeader label="UHID" sortKeyVal="uhid" />
                  </th>
                  <th className="text-left px-4 py-3">
                    <SortHeader label="Patient Name" sortKeyVal="firstName" />
                  </th>
                  <th className="text-left px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age</span>
                  </th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guardian</span>
                  </th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</span>
                  </th>
                  <th className="text-left px-4 py-3">
                    <SortHeader label="Registered" sortKeyVal="updatedAt" />
                  </th>
                  <th className="text-right px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(limit)].map((_, i) => <PatientRowSkeleton key={i} />)
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">No patients found</p>
                        <p className="text-xs text-muted-foreground/70">
                          {searchInput ? "Try a different search term" : "Register the first patient to get started"}
                        </p>
                        {searchInput && (
                          <Button variant="outline" size="sm" onClick={() => setSearchInput("")} className="mt-2 text-xs">
                            Clear search
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => {
                    const age = calcAgeFromDob(p.dateOfBirth)
                    const isNeonatal = age.years === 0 && age.months <= 1
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        {/* UHID */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono font-medium text-foreground">{p.uhid}</span>
                        </td>

                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8 shrink-0">
                              <AvatarFallback className={cn(
                                "text-[11px] font-semibold",
                                p.gender === "FEMALE"
                                  ? "bg-[#fce4ec] text-[#c2185b]"
                                  : isNeonatal
                                    ? "bg-[#fde8e8] text-[#c53030]"
                                    : "bg-[#e3f2fd] text-[#1565c0]",
                              )}>
                                {isNeonatal
                                  ? <Baby className="size-4" />
                                  : getInitials(p.firstName, p.lastName)
                                }
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {p.firstName} {p.lastName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {p.gender === "MALE" ? "Male" : p.gender === "FEMALE" ? "Female" : "Other"}
                                {p.bloodGroup && ` · ${p.bloodGroup}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Age */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {isNeonatal && <Baby className="size-3 text-[#c53030]" />}
                            <span className="text-sm text-foreground">{formatAge(age.years, age.months)}</span>
                          </div>
                        </td>

                        {/* Guardian */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">{p.guardianName}</span>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{p.phone}</span>
                        </td>

                        {/* Registered */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{timeAgo(p.createdAt)}</span>
                        </td>

                        {/* Actions — Dropdown */}
                        <td className="px-4 py-3 text-right">
                          <PatientRowActions patient={p} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Footer ─────────────────────────────────────────── */}
          {!isLoading && patients.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
                {" "}· {total} total
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setQueryParams({ page: page - 1 })}
                  className="text-xs h-7 px-3 gap-1"
                >
                  <ChevronLeft className="size-3" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setQueryParams({ page: page + 1 })}
                  className="text-xs h-7 px-3 gap-1"
                >
                  Next
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
