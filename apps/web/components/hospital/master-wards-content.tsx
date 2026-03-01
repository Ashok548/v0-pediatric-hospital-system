"use client"

import { useState, useMemo } from "react"
import {
    Plus, Search, ChevronLeft, ChevronRight, Pencil, ToggleLeft, ToggleRight, X, MoreHorizontal, LayoutList, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

type WardType = "GENERAL" | "PRIVATE" | "NICU" | "PICU"

interface Floor {
    id: string
    name: string
    floorNumber: number
    status: "ACTIVE" | "INACTIVE"
}

interface Ward {
    id: string
    floorId: string
    name: string
    type: WardType
    totalBeds: number
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
    floor?: { id: string; name: string; floorNumber: number }
    _count?: { beds: number }
}

interface ApiListResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
}

const WARD_TYPES: WardType[] = ["GENERAL", "PRIVATE", "NICU", "PICU"]
const WARD_TYPE_LABELS: Record<WardType, string> = { GENERAL: "General", PRIVATE: "Private", NICU: "NICU", PICU: "PICU" }
const WARD_TYPE_COLORS: Record<WardType, string> = {
    GENERAL: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    PRIVATE: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    NICU: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
    PICU: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
}

type FormState = {
    floorId: string
    name: string
    type: WardType
    totalBeds: string
    status: "ACTIVE" | "INACTIVE"
}

const EMPTY_FORM: FormState = { floorId: "", name: "", type: "GENERAL", totalBeds: "", status: "ACTIVE" }
const PAGE_SIZE = 10

// ─── Component ────────────────────────────────────────────────────────────────

export function MasterWardsContent() {
    const [search, setSearch] = useState("")
    const [floorFilter, setFloorFilter] = useState("ALL")
    const [typeFilter, setTypeFilter] = useState<"ALL" | WardType>("ALL")
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<Ward | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

    const debouncedSearch = useDebounce(search, 300)

    // ─── Live Data ──────────────────────────────────────────────────────────
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) query.set("search", debouncedSearch)
    if (floorFilter !== "ALL") query.set("floorId", floorFilter)
    if (typeFilter !== "ALL") query.set("type", typeFilter)

    const { data, isLoading, mutate } = useQuery<ApiListResponse<Ward>>(`/master/wards?${query.toString()}`)
    const wards = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    // Floor dropdown — always fetch all active floors for the filter and form selects
    const { data: floorsData } = useQuery<ApiListResponse<Floor>>("/master/floors?limit=200&status=ACTIVE")
    const floors = floorsData?.data ?? []

    // ─── Mutations ──────────────────────────────────────────────────────────
    const { trigger: createWard, isMutating: isCreating } = useMutation<Ward, any>(
        "/master/wards", "POST", {
        successMessage: "Ward created successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: updateWard, isMutating: isUpdating } = useMutation<Ward, any>(
        () => `/master/wards/${editTarget?.id}`, "PATCH", {
        successMessage: "Ward updated successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: toggleStatus } = useMutation<Ward, any>(
        (id) => `/master/wards/${id}`, "DELETE", {
        successMessage: "Ward status updated",
        onSuccess: () => mutate(),
    })

    // ─── Handlers ────────────────────────────────────────────────────────────
    function openCreate() {
        setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setDialogOpen(true)
    }

    function openEdit(ward: Ward) {
        setEditTarget(ward)
        setForm({ floorId: ward.floorId, name: ward.name, type: ward.type, totalBeds: String(ward.totalBeds), status: ward.status })
        setErrors({}); setDialogOpen(true)
    }

    function validate(): boolean {
        const e: Partial<Record<keyof FormState, string>> = {}
        if (!form.floorId) e.floorId = "Floor is required"
        if (!form.name.trim()) e.name = "Name is required"
        if (!form.totalBeds || isNaN(Number(form.totalBeds)) || Number(form.totalBeds) < 1) e.totalBeds = "Min 1 bed"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSave() {
        if (!validate()) return
        const payload = { floorId: form.floorId, name: form.name.trim(), type: form.type, totalBeds: Number(form.totalBeds), status: form.status }
        if (editTarget) await updateWard(payload)
        else await createWard(payload)
    }

    async function handleToggle(ward: Ward) {
        await (toggleStatus as any)(ward.id)
    }

    const isSaving = isCreating || isUpdating

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap w-full sm:w-auto">
                    <div className="relative w-full sm:w-60">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="wards-search"
                            placeholder="Search wards…"
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
                    <Select value={floorFilter} onValueChange={(v) => { setFloorFilter(v); setPage(1) }}>
                        <SelectTrigger className="w-44" id="wards-floor-filter"><SelectValue placeholder="All Floors" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Floors</SelectItem>
                            {floors.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as "ALL" | WardType); setPage(1) }}>
                        <SelectTrigger className="w-32" id="wards-type-filter"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            {WARD_TYPES.map((t) => <SelectItem key={t} value={t}>{WARD_TYPE_LABELS[t]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button id="wards-create-btn" onClick={openCreate} className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Add Ward
                </Button>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Name", "Floor", "Type", "Total Beds", "Status", ""].map((h) => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-14 text-muted-foreground">
                                    <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin opacity-50" />
                                    Loading wards…
                                </td>
                            </tr>
                        ) : wards.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-14 text-muted-foreground">
                                    <LayoutList className="mx-auto mb-2 w-8 h-8 opacity-30" />
                                    No wards found
                                </td>
                            </tr>
                        ) : (
                            wards.map((ward) => (
                                <tr key={ward.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">{ward.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs leading-snug max-w-[180px] truncate">
                                        {ward.floor?.name ?? "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${WARD_TYPE_COLORS[ward.type]}`}>
                                            {WARD_TYPE_LABELS[ward.type]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground">{ward.totalBeds}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={ward.status === "ACTIVE" ? "default" : "secondary"}>
                                            {ward.status === "ACTIVE" ? "Active" : "Inactive"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => openEdit(ward)}>
                                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleToggle(ward)}>
                                                    {ward.status === "ACTIVE"
                                                        ? <><ToggleLeft className="w-3.5 h-3.5 mr-2" />Deactivate</>
                                                        : <><ToggleRight className="w-3.5 h-3.5 mr-2" />Activate</>}
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
                        <span className="text-xs text-muted-foreground">{total} wards · Page {page} of {totalPages}</span>
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
                        <DialogTitle>{editTarget ? "Edit Ward" : "Add Ward"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="ward-floor">Floor <span className="text-destructive">*</span></Label>
                            <Select value={form.floorId} onValueChange={(v) => setForm((f) => ({ ...f, floorId: v }))}>
                                <SelectTrigger id="ward-floor"><SelectValue placeholder="Select floor" /></SelectTrigger>
                                <SelectContent>
                                    {floors.map((fl) => <SelectItem key={fl.id} value={fl.id}>{fl.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.floorId && <p className="text-xs text-destructive">{errors.floorId}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ward-name">Ward Name <span className="text-destructive">*</span></Label>
                            <Input id="ward-name" placeholder="e.g. Neonatal ICU" value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="ward-type">Type</Label>
                                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as WardType }))}>
                                    <SelectTrigger id="ward-type"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {WARD_TYPES.map((t) => <SelectItem key={t} value={t}>{WARD_TYPE_LABELS[t]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ward-beds">Total Beds <span className="text-destructive">*</span></Label>
                                <Input id="ward-beds" type="number" min={1} placeholder="e.g. 15" value={form.totalBeds}
                                    onChange={(e) => setForm((f) => ({ ...f, totalBeds: e.target.value }))} />
                                {errors.totalBeds && <p className="text-xs text-destructive">{errors.totalBeds}</p>}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ward-status">Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as "ACTIVE" | "INACTIVE" }))}>
                                <SelectTrigger id="ward-status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
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
