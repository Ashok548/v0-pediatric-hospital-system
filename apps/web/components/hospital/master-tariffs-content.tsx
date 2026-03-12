"use client"

import { useState } from "react"
import {
    Plus, Search, X, MoreHorizontal, FileText, Pencil, ToggleLeft, ToggleRight, Loader2, Calendar
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

// ─── Types ─────────────────────────────────────────────────────────────────────

type WardType = "GENERAL" | "PRIVATE" | "NICU" | "PICU" | "SURGICAL"

interface TariffPlan {
    id: string
    code: string
    name: string
    description?: string
    effectiveFrom: string
    effectiveTo?: string | null
    wardType?: WardType | null
    status: "ACTIVE" | "INACTIVE"
    _count?: { rates: number }
}

interface ApiListResponse<T> {
    data: T[]
    total: number
    page: number
    totalPages: number
}

type FormState = {
    code: string
    name: string
    description: string
    effectiveFrom: string
    effectiveTo: string
    wardType: string
    status: "ACTIVE" | "INACTIVE"
}

const EMPTY_FORM: FormState = {
    code: "", name: "", description: "",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: "", wardType: "ALL", status: "ACTIVE"
}

const WARD_LABELS: Record<string, string> = {
    GENERAL: "General Ward", PRIVATE: "Private",
    NICU: "NICU", PICU: "PICU", SURGICAL: "Surgical"
}

const WARD_COLORS: Record<string, string> = {
    GENERAL: "bg-slate-100 text-slate-700 border-slate-200",
    PRIVATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    NICU: "bg-blue-100 text-blue-700 border-blue-200",
    PICU: "bg-purple-100 text-purple-700 border-purple-200",
    SURGICAL: "bg-red-100 text-red-700 border-red-200",
    ALL: "bg-gray-100 text-gray-600 border-gray-200",
}

const PAGE_SIZE = 15

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function MasterTariffsContent() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
    const [wardFilter, setWardFilter] = useState("ALL")
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<TariffPlan | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

    const debouncedSearch = useDebounce(search, 300)

    const queryStr = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) queryStr.set("search", debouncedSearch)
    if (statusFilter !== "ALL") queryStr.set("status", statusFilter)
    if (wardFilter !== "ALL") queryStr.set("wardType", wardFilter)

    const { data, isLoading, mutate } = useQuery<ApiListResponse<TariffPlan>>(`/master/tariffs?${queryStr.toString()}`)
    const plans = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = data?.totalPages ?? 1

    const { trigger: createPlan, isMutating: isCreating } = useMutation<TariffPlan, any>(
        "/master/tariffs", "POST", {
        successMessage: "Tariff plan created",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: updatePlan, isMutating: isUpdating } = useMutation<TariffPlan, any>(
        () => `/master/tariffs/${editTarget?.id}`, "PATCH", {
        successMessage: "Tariff plan updated",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: toggleStatus } = useMutation<TariffPlan, string>(
        (id: string) => `/master/tariffs/${id}`, "DELETE", {
        successMessage: "Status toggled",
        onSuccess: () => mutate(),
    })

    function openCreate() {
        setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setDialogOpen(true)
    }

    function openEdit(plan: TariffPlan) {
        setEditTarget(plan)
        setForm({
            code: plan.code, name: plan.name,
            description: plan.description ?? "",
            effectiveFrom: plan.effectiveFrom?.slice(0, 10) ?? "",
            effectiveTo: plan.effectiveTo?.slice(0, 10) ?? "",
            wardType: plan.wardType ?? "ALL",
            status: plan.status
        })
        setErrors({}); setDialogOpen(true)
    }

    function validate(): boolean {
        const e: Partial<Record<keyof FormState, string>> = {}
        if (!form.code.trim()) e.code = "Code is required"
        if (!form.name.trim()) e.name = "Name is required"
        if (!form.effectiveFrom) e.effectiveFrom = "Effective from date required"
        if (form.effectiveTo && form.effectiveTo < form.effectiveFrom)
            e.effectiveTo = "End date must be after start date"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSave() {
        if (!validate()) return
        const payload: any = {
            code: form.code.trim(), name: form.name.trim(),
            effectiveFrom: new Date(form.effectiveFrom).toISOString(),
            status: form.status,
        }
        if (form.description.trim()) payload.description = form.description.trim()
        if (form.effectiveTo) payload.effectiveTo = new Date(form.effectiveTo).toISOString()
        if (form.wardType !== "ALL") payload.wardType = form.wardType
        if (editTarget) await updatePlan(payload)
        else await createPlan(payload)
    }

    const isSaving = isCreating || isUpdating

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap gap-2 pb-2">
                <Badge variant="outline" className="font-normal bg-muted/20 text-foreground">
                    Total: {data?.data?.length ?? 0}
                </Badge>
                <Badge variant="outline" className="font-normal bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30">
                    Active: {plans.filter(p => p.status === "ACTIVE").length}
                </Badge>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap w-full sm:w-auto">
                    <div className="relative w-full sm:w-60">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="tariff-search" placeholder="Search by name or code…" className="pl-9"
                            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
                        {search && (
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                onClick={() => { setSearch(""); setPage(1) }}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <Select value={wardFilter} onValueChange={(v) => { setWardFilter(v); setPage(1) }}>
                        <SelectTrigger className="w-40" id="tariff-ward-filter"><SelectValue placeholder="All Ward Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Wards</SelectItem>
                            {Object.entries(WARD_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1) }}>
                        <SelectTrigger className="w-32" id="tariff-status-filter"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button id="tariff-create-btn" onClick={openCreate} className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Add Tariff Plan
                </Button>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Code", "Plan Name", "Ward Type", "Effective Period", "Rates", "Status", ""].map((h) => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} className="text-center py-14 text-muted-foreground">
                                <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin opacity-50" />Loading…
                            </td></tr>
                        ) : plans.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-14 text-muted-foreground">
                                <FileText className="mx-auto mb-2 w-8 h-8 opacity-30" />
                                No tariff plans found
                            </td></tr>
                        ) : (
                            plans.map((plan) => (
                                <tr key={plan.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{plan.code}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{plan.name}</div>
                                        {plan.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${WARD_COLORS[plan.wardType ?? "ALL"]}`}>
                                            {plan.wardType ? WARD_LABELS[plan.wardType] : "All Wards"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(plan.effectiveFrom)}
                                        </div>
                                        {plan.effectiveTo && <div className="pl-4 text-muted-foreground/70">→ {formatDate(plan.effectiveTo)}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                            {plan._count?.rates ?? 0} services
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={plan.status === "ACTIVE" ? "default" : "secondary"}>
                                            {plan.status === "ACTIVE" ? "Active" : "Inactive"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => openEdit(plan)}>
                                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Plan
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => toggleStatus(plan.id)}>
                                                    {plan.status === "ACTIVE"
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
                        <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                            <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Edit Tariff Plan" : "Add Tariff Plan"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="tar-code">Code <span className="text-destructive">*</span></Label>
                                <Input id="tar-code" placeholder="e.g. GEN-2026" value={form.code}
                                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label htmlFor="tar-name">Plan Name <span className="text-destructive">*</span></Label>
                                <Input id="tar-name" placeholder="e.g. General Ward 2026" value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tar-desc">Description</Label>
                            <Input id="tar-desc" placeholder="Optional description" value={form.description}
                                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tar-ward">Applies to Ward Type</Label>
                            <Select value={form.wardType} onValueChange={(v) => setForm(f => ({ ...f, wardType: v }))}>
                                <SelectTrigger id="tar-ward"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Ward Types</SelectItem>
                                    {Object.entries(WARD_LABELS).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="tar-from">Effective From <span className="text-destructive">*</span></Label>
                                <Input id="tar-from" type="date" value={form.effectiveFrom}
                                    onChange={(e) => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
                                {errors.effectiveFrom && <p className="text-xs text-destructive">{errors.effectiveFrom}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="tar-to">Effective To</Label>
                                <Input id="tar-to" type="date" value={form.effectiveTo}
                                    onChange={(e) => setForm(f => ({ ...f, effectiveTo: e.target.value }))} />
                                {errors.effectiveTo && <p className="text-xs text-destructive">{errors.effectiveTo}</p>}
                            </div>
                        </div>
                        {editTarget && (
                            <div className="space-y-1.5">
                                <Label htmlFor="tar-status">Status</Label>
                                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as any }))}>
                                    <SelectTrigger id="tar-status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
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
