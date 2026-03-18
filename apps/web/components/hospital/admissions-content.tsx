"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdmissions } from "@/lib/api/admissions"
import type { AdmissionStatus, AdmissionType } from "@/lib/types/admission"
import {
    Plus,
    Search,
    BedDouble,
    ArrowRightLeft,
    ClipboardList,
    CheckCircle,
    Clock,
    AlertCircle,
    RefreshCw,
} from "lucide-react"

const STATUS_CONFIG: Record<AdmissionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    DRAFT: { label: "Draft", variant: "secondary", color: "text-gray-500" },
    BED_ASSIGNED: { label: "Bed Assigned", variant: "outline", color: "text-blue-600" },
    ADMITTED: { label: "Admitted", variant: "default", color: "text-green-600" },
    DISCHARGED: { label: "Discharged", variant: "secondary", color: "text-purple-600" },
    CANCELLED: { label: "Cancelled", variant: "destructive", color: "text-red-600" },
}

const TYPE_COLOR: Record<AdmissionType, string> = {
    EMERGENCY: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    REFERRAL: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
}

export function AdmissionsContent() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")

    const { admissions, isLoading, error, mutate } = useAdmissions({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter as AdmissionStatus : undefined,
    })

    // client-side type filter (API could also support it, but type is not a DB index)
    const filtered = typeFilter !== "all"
        ? admissions.filter(a => a.admissionType === typeFilter)
        : admissions

    const counts = {
        total: admissions.length,
        admitted: admissions.filter(a => a.status === "ADMITTED").length,
        bedAssigned: admissions.filter(a => a.status === "BED_ASSIGNED").length,
        discharged: admissions.filter(a => a.status === "DISCHARGED").length,
    }

    return (
        <div className="flex-1 space-y-6 p-6 pt-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Manage inpatient admissions, bed assignments, and discharges</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => mutate()} title="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Link href="/admissions/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Admission
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total", value: counts.total, icon: <ClipboardList className="h-4 w-4" />, color: "" },
                    { label: "Admitted", value: counts.admitted, icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: "text-green-600" },
                    { label: "Bed Assigned", value: counts.bedAssigned, icon: <BedDouble className="h-4 w-4 text-blue-500" />, color: "text-blue-600" },
                    { label: "Discharged", value: counts.discharged, icon: <Clock className="h-4 w-4 text-purple-500" />, color: "text-purple-600" },
                ].map(s => (
                    <Card key={s.label}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                {s.icon} {s.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-12" /> : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, UHID or Admission ID..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="ADMITTED">Admitted</SelectItem>
                                <SelectItem value="BED_ASSIGNED">Bed Assigned</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="DISCHARGED">Discharged</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="EMERGENCY">Emergency</SelectItem>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="REFERRAL">Referral</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto rounded-b-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="pl-6">Admission No.</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Ward / Bed</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))}

                                {error && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 text-destructive">
                                                <AlertCircle className="h-8 w-8" />
                                                <p className="font-medium">Failed to load admissions</p>
                                                <p className="text-sm text-muted-foreground">{error.message ?? "Please try again"}</p>
                                                <Button variant="outline" size="sm" onClick={() => mutate()}>Retry</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!isLoading && !error && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                            No admissions found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {filtered.map(a => {
                                    const statusCfg = STATUS_CONFIG[a.status]
                                    const patientName = `${a.patient.firstName} ${a.patient.lastName}`
                                    return (
                                        <TableRow key={a.id} className="group">
                                            <TableCell className="pl-6 font-mono text-xs font-semibold text-muted-foreground">{a.admissionNumber}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{patientName}</p>
                                                    <p className="text-xs text-muted-foreground">{a.patient.uhid}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLOR[a.admissionType]}`}>
                                                    {a.admissionType}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">{a.department}</TableCell>
                                            <TableCell>
                                                {a.currentBed ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm">{a.currentBed.ward.name} / <b>{a.currentBed.bedNumber}</b></span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(a.admissionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    {a.status === "ADMITTED" && (
                                                        <Link href={`/admissions/${a.id}/transfer`}>
                                                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                                                <ArrowRightLeft className="h-3 w-3" /> Transfer
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
