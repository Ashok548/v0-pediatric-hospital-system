"use client"

import { useState, useEffect } from "react"
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
import {
    Admission,
    AdmissionStatus,
    AdmissionType,
    mockAdmissions,
} from "@/lib/data/admissions"
import {
    Plus,
    Search,
    BedDouble,
    ArrowRightLeft,
    ClipboardList,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
} from "lucide-react"

const STATUS_CONFIG: Record<AdmissionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    [AdmissionStatus.DRAFT]: { label: "Draft", variant: "secondary", color: "text-gray-500" },
    [AdmissionStatus.BED_ASSIGNED]: { label: "Bed Assigned", variant: "outline", color: "text-blue-600" },
    [AdmissionStatus.ADMITTED]: { label: "Admitted", variant: "default", color: "text-green-600" },
    [AdmissionStatus.DISCHARGED]: { label: "Discharged", variant: "secondary", color: "text-purple-600" },
    [AdmissionStatus.CANCELLED]: { label: "Cancelled", variant: "destructive", color: "text-red-600" },
}

const TYPE_CONFIG: Record<AdmissionType, { label: string; color: string }> = {
    [AdmissionType.EMERGENCY]: { label: "Emergency", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    [AdmissionType.SCHEDULED]: { label: "Scheduled", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    [AdmissionType.REFERRAL]: { label: "Referral", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
}

export function AdmissionsContent() {
    const [admissions, setAdmissions] = useState<Admission[]>(mockAdmissions)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")

    const filtered = admissions.filter((a) => {
        const matchesSearch =
            a.patientName.toLowerCase().includes(search.toLowerCase()) ||
            a.id.toLowerCase().includes(search.toLowerCase()) ||
            a.patientId.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "all" || a.status === statusFilter
        const matchesType = typeFilter === "all" || a.admissionType === typeFilter
        return matchesSearch && matchesStatus && matchesType
    })

    const counts = {
        total: admissions.length,
        admitted: admissions.filter((a) => a.status === AdmissionStatus.ADMITTED).length,
        bedAssigned: admissions.filter((a) => a.status === AdmissionStatus.BED_ASSIGNED).length,
        discharged: admissions.filter((a) => a.status === AdmissionStatus.DISCHARGED).length,
    }

    return (
        <div className="flex-1 space-y-6 p-6 pt-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Manage inpatient admissions, bed assignments, and discharges</p>
                </div>
                <Link href="/admissions/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Admission
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" /> Total Admissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{counts.total}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" /> Currently Admitted
                        </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold text-green-600">{counts.admitted}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-blue-500" /> Bed Assigned
                        </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold text-blue-600">{counts.bedAssigned}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-500" /> Discharged
                        </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold text-purple-600">{counts.discharged}</p></CardContent>
                </Card>
            </div>

            {/* Filters & Table */}
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
                                <SelectItem value={AdmissionStatus.ADMITTED}>Admitted</SelectItem>
                                <SelectItem value={AdmissionStatus.BED_ASSIGNED}>Bed Assigned</SelectItem>
                                <SelectItem value={AdmissionStatus.DRAFT}>Draft</SelectItem>
                                <SelectItem value={AdmissionStatus.DISCHARGED}>Discharged</SelectItem>
                                <SelectItem value={AdmissionStatus.CANCELLED}>Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value={AdmissionType.EMERGENCY}>Emergency</SelectItem>
                                <SelectItem value={AdmissionType.SCHEDULED}>Scheduled</SelectItem>
                                <SelectItem value={AdmissionType.REFERRAL}>Referral</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto rounded-b-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="pl-6">Admission ID</TableHead>
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
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                            No admissions found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filtered.map((a) => {
                                    const statusCfg = STATUS_CONFIG[a.status]
                                    const typeCfg = TYPE_CONFIG[a.admissionType]
                                    return (
                                        <TableRow key={a.id} className="group">
                                            <TableCell className="pl-6 font-mono text-xs font-semibold text-muted-foreground">{a.id}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{a.patientName}</p>
                                                    <p className="text-xs text-muted-foreground">{a.patientId}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeCfg.color}`}>
                                                    {typeCfg.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">{a.department}</TableCell>
                                            <TableCell>
                                                {a.currentLocation ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm">{a.currentLocation.wardName} / <b>{a.currentLocation.bedNumber}</b></span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(a.admissionDateTime).toLocaleDateString("en-IN", {
                                                    day: "2-digit", month: "short", year: "numeric"
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    {a.status === AdmissionStatus.ADMITTED && (
                                                        <>
                                                            <Link href={`/admissions/${a.id}/transfer`}>
                                                                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                                                    <ArrowRightLeft className="h-3 w-3" /> Transfer
                                                                </Button>
                                                            </Link>
                                                            <Link href={`/admissions/${a.id}/discharge`}>
                                                                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                                                    <XCircle className="h-3 w-3" /> Discharge
                                                                </Button>
                                                            </Link>
                                                        </>
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
