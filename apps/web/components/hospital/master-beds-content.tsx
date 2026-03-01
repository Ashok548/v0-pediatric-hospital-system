"use client"

import { useState } from "react"
import {
    Plus, Search, ChevronLeft, ChevronRight, Pencil, X, MoreHorizontal, BedDouble, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useQuery } from "@/hooks/use-query"
import { useMutation } from "@/hooks/use-mutation"
import { useDebounce } from "@/hooks/use-debounce"

// ─── Types ────────────────────────────────────────────────────────────────────

type BedStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE"

interface Floor {
    id: string
    name: string
    status: "ACTIVE" | "INACTIVE"
}

interface Ward {
    id: string
    floorId: string
    name: string
    status: "ACTIVE" | "INACTIVE"
    floor?: { id: string; name: string }
}

interface Bed {
    id: string
    wardId: string
    bedNumber: string
    status: BedStatus
    createdAt: string
    ward?: { id: string; name: string; floor?: { id: string; name: string } }
}

interface ApiListResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
}

const BED_STATUSES: BedStatus[] = ["AVAILABLE", "OCCUPIED", "CLEANING", "RESERVED", "MAINTENANCE"]
const BED_STATUS_LABELS: Record<BedStatus, string> = {
    AVAILABLE: "Available", OCCUPIED: "Occupied", CLEANING: "Cleaning", RESERVED: "Reserved", MAINTENANCE: "Maintenance"
}
const BED_STATUS_COLORS: Record<BedStatus, string> = {
    AVAILABLE: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    OCCUPIED: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
    CLEANING: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    RESERVED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    MAINTENANCE: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300",
}

type FormState = {
    wardId: string
    bedNumber: string
    status: BedStatus
}

const EMPTY_FORM: FormState = { wardId: "", bedNumber: "", status: "AVAILABLE" }
const PAGE_SIZE = 10

// ─── Component ────────────────────────────────────────────────────────────────

export function MasterBedsContent() {
    const [search, setSearch] = useState("")
    const [floorFilter, setFloorFilter] = useState("ALL")
    const [wardFilter, setWardFilter] = useState("ALL")
    const [statusFilter, setStatusFilter] = useState<"ALL" | BedStatus>("ALL")
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<Bed | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

    const debouncedSearch = useDebounce(search, 300)

    // ─── Live Data ──────────────────────────────────────────────────────────
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) query.set("search", debouncedSearch)
    if (wardFilter !== "ALL") query.set("wardId", wardFilter)
    if (floorFilter !== "ALL") query.set("floorId", floorFilter)
    if (statusFilter !== "ALL") query.set("status", statusFilter)

    const { data, isLoading, mutate } = useQuery<ApiListResponse<Bed>>(`/master/beds?${query.toString()}`)
    const beds = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    // Dropdown sources
    const { data: floorsData } = useQuery<ApiListResponse<Floor>>("/master/floors?limit=200&status=ACTIVE")
    const floors = floorsData?.data ?? []

    // Wards filtered by selected floor for cascading dropdown
    const wardsQuery = floorFilter !== "ALL" ? `/master/wards?limit=200&status=ACTIVE&floorId=${floorFilter}` : "/master/wards?limit=200&status=ACTIVE"
    const { data: wardsData } = useQuery<ApiListResponse<Ward>>(wardsQuery)
    const wards = wardsData?.data ?? []

    // ─── Mutations ──────────────────────────────────────────────────────────
    const { trigger: createBed, isMutating: isCreating } = useMutation<Bed, any>(
        "/master/beds", "POST", {
        successMessage: "Bed created successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: updateBed, isMutating: isUpdating } = useMutation<Bed, any>(
        () => `/master/beds/${editTarget?.id}`, "PATCH", {
        successMessage: "Bed updated successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: softDeleteBed } = useMutation<Bed, any>(
        (id) => `/master/beds/${id}`, "DELETE", {
        successMessage: "Bed set to Maintenance",
        onSuccess: () => mutate(),
    })

    // ─── Handlers ────────────────────────────────────────────────────────────
    function openCreate() {
        setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setDialogOpen(true)
    }

    function openEdit(bed: Bed) {
        setEditTarget(bed)
        setForm({ wardId: bed.wardId, bedNumber: bed.bedNumber, status: bed.status })
        setErrors({}); setDialogOpen(true)
    }

    function handleFloorFilterChange(v: string) {
        setFloorFilter(v)
        setWardFilter("ALL")
        setPage(1)
    }

    function validate(): boolean {
        const e: Partial<Record<keyof FormState, string>> = {}
        if (!form.wardId) e.wardId = "Ward is required"
        if (!form.bedNumber.trim()) e.bedNumber = "Bed number is required"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSave() {
        if (!validate()) return
        const payload = { wardId: form.wardId, bedNumber: form.bedNumber.trim(), status: form.status }
        if (editTarget) await updateBed(payload)
        else await createBed(payload)
    }

    async function handleToggleMaintenance(bed: Bed) {
        await (softDeleteBed as any)(bed.id)
    }

    const isSaving = isCreating || isUpdating

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap w-full sm:w-auto">
                    <div className="relative w-full sm:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="beds-search"
                            placeholder="Search bed number…"
                            className="pl-9"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        />
                        {search && (
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => { setSearch(""); setPage(1) }}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {/* Cascading: Floor → Ward */}
                    <Select value={floorFilter} onValueChange={handleFloorFilterChange}>
                        <SelectTrigger className="w-44" id="beds-floor-filter"><SelectValue placeholder="All Floors" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Floors</SelectItem>
                            {floors.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={wardFilter} onValueChange={(v) => { setWardFilter(v); setPage(1) }} disabled={wards.length === 0}>
                        <SelectTrigger className="w-44" id="beds-ward-filter"><SelectValue placeholder="All Wards" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Wards</SelectItem>
                            {wards.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as "ALL" | BedStatus); setPage(1) }}>
                        <SelectTrigger className="w-36" id="beds-status-filter"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            {BED_STATUSES.map((s) => <SelectItem key={s} value={s}>{BED_STATUS_LABELS[s]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button id="beds-create-btn" onClick={openCreate} className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Add Bed
                </Button>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Bed Number", "Ward", "Floor", "Status", ""].map((h) => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-14 text-muted-foreground">
                                    <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin opacity-50" />
                                    Loading beds…
                                </td>
                            </tr>
                        ) : beds.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-14 text-muted-foreground">
                                    <BedDouble className="mx-auto mb-2 w-8 h-8 opacity-30" />
                                    No beds found
                                </td>
                            </tr>
                        ) : (
                            beds.map((bed) => (
                                <tr key={bed.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono font-medium text-foreground">{bed.bedNumber}</td>
                                    <td className="px-4 py-3 text-foreground">{bed.ward?.name ?? "—"}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{bed.ward?.floor?.name ?? "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${BED_STATUS_COLORS[bed.status]}`}>
                                            {BED_STATUS_LABELS[bed.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => openEdit(bed)}>
                                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleToggleMaintenance(bed)}>
                                                    {bed.status === "AVAILABLE" ? "Mark Maintenance" : "Mark Available"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                        <span className="text-xs text-muted-foreground">{total} beds · Page {page} of {totalPages}</span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Edit Bed" : "Add Bed"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="bed-ward">Ward <span className="text-destructive">*</span></Label>
                            <Select value={form.wardId} onValueChange={(v) => setForm((f) => ({ ...f, wardId: v }))}>
                                <SelectTrigger id="bed-ward"><SelectValue placeholder="Select ward" /></SelectTrigger>
                                <SelectContent>
                                    {wards.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name}{w.floor ? ` — ${w.floor.name}` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.wardId && <p className="text-xs text-destructive">{errors.wardId}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="bed-number">Bed Number <span className="text-destructive">*</span></Label>
                            <Input id="bed-number" placeholder="e.g. NICU-01" value={form.bedNumber}
                                onChange={(e) => setForm((f) => ({ ...f, bedNumber: e.target.value }))} />
                            {errors.bedNumber && <p className="text-xs text-destructive">{errors.bedNumber}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="bed-status">Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as BedStatus }))}>
                                <SelectTrigger id="bed-status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {BED_STATUSES.map((s) => <SelectItem key={s} value={s}>{BED_STATUS_LABELS[s]}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editTarget ? "Save Changes" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
