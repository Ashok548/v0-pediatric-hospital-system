"use client"

import { useState } from "react"
import {
    Plus, Search, ChevronLeft, ChevronRight, Pencil, ToggleLeft, ToggleRight, X, MoreHorizontal, IndianRupee, Loader2
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

type ServiceCategory = "CONSULTATION" | "LAB" | "PROCEDURE" | "ROOM" | "MISC"

interface MasterService {
    id: string
    code: string
    name: string
    category: ServiceCategory
    basePrice: number | string
    taxPercent: number | string
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
}

interface ApiListResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
    categoryCounts?: Record<string, number>
}

const CATEGORIES: ServiceCategory[] = ["CONSULTATION", "LAB", "PROCEDURE", "ROOM", "MISC"]
const CATEGORY_LABELS: Record<ServiceCategory, string> = {
    CONSULTATION: "Consultation", LAB: "Lab", PROCEDURE: "Procedure", ROOM: "Room", MISC: "Misc"
}
const CATEGORY_COLORS: Record<ServiceCategory, string> = {
    CONSULTATION: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    LAB: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    PROCEDURE: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    ROOM: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    MISC: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300",
}

type FormState = {
    code: string
    name: string
    category: ServiceCategory
    basePrice: string
    taxPercent: string
    status: "ACTIVE" | "INACTIVE"
}

const EMPTY_FORM: FormState = { code: "", name: "", category: "CONSULTATION", basePrice: "", taxPercent: "0", status: "ACTIVE" }
const PAGE_SIZE = 10

function formatCurrency(amount: number | string) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(amount))
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MasterServicesContent() {
    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<"ALL" | ServiceCategory>("ALL")
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<MasterService | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

    const debouncedSearch = useDebounce(search, 300)

    // ─── Live Data ──────────────────────────────────────────────────────────
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) query.set("search", debouncedSearch)
    if (categoryFilter !== "ALL") query.set("category", categoryFilter)
    if (statusFilter !== "ALL") query.set("status", statusFilter)

    const { data, isLoading, mutate } = useQuery<ApiListResponse<MasterService>>(`/master/services?${query.toString()}`)
    const services = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const categoryCounts = data?.categoryCounts ?? {}

    // ─── Mutations ──────────────────────────────────────────────────────────
    const { trigger: createService, isMutating: isCreating } = useMutation<MasterService, any>(
        "/master/services", "POST", {
        successMessage: "Service created successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: updateService, isMutating: isUpdating } = useMutation<MasterService, any>(
        () => `/master/services/${editTarget?.id}`, "PATCH", {
        successMessage: "Service updated successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: toggleStatus } = useMutation<MasterService, string>(
        (id: string) => `/master/services/${id}`, "DELETE", {
        successMessage: "Service status updated",
        onSuccess: () => mutate(),
    })

    // ─── Handlers ────────────────────────────────────────────────────────────
    function openCreate() {
        setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setDialogOpen(true)
    }

    function openEdit(svc: MasterService) {
        setEditTarget(svc)
        setForm({ code: svc.code, name: svc.name, category: svc.category, basePrice: String(svc.basePrice), taxPercent: String(svc.taxPercent), status: svc.status })
        setErrors({}); setDialogOpen(true)
    }

    function validate(): boolean {
        const e: Partial<Record<keyof FormState, string>> = {}
        if (!form.name.trim()) e.name = "Name is required"
        if (!form.basePrice || isNaN(Number(form.basePrice)) || Number(form.basePrice) < 0) e.basePrice = "Valid price required"
        if (isNaN(Number(form.taxPercent)) || Number(form.taxPercent) < 0 || Number(form.taxPercent) > 100) e.taxPercent = "0–100"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSave() {
        if (!validate()) return
        const payload: any = { name: form.name.trim(), category: form.category, basePrice: Number(form.basePrice), taxPercent: Number(form.taxPercent), status: form.status }
        if (form.code.trim()) payload.code = form.code.trim();
        if (editTarget) await updateService(payload)
        else await createService(payload)
    }

    async function handleToggle(svc: MasterService) {
        await toggleStatus(svc.id)
    }

    const isSaving = isCreating || isUpdating

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Category Badges (Overview) */}
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground pb-2">
                <Badge variant="outline" className="font-normal border-border/50 text-foreground bg-muted/20">
                    Total: {total}
                </Badge>
                {CATEGORIES.map(cat => (
                    categoryCounts[cat] > 0 && (
                        <Badge key={cat} variant="outline" className={`font-normal border-border/50 ${CATEGORY_COLORS[cat]}`}>
                            {CATEGORY_LABELS[cat]}: {categoryCounts[cat]}
                        </Badge>
                    )
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="services-search"
                            placeholder="Search by name or code…"
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
                    <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v as "ALL" | ServiceCategory); setPage(1) }}>
                        <SelectTrigger className="w-40" id="services-cat-filter"><SelectValue placeholder="All Categories" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Categories</SelectItem>
                            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as "ALL" | "ACTIVE" | "INACTIVE"); setPage(1) }}>
                        <SelectTrigger className="w-32" id="services-status-filter"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button id="services-create-btn" onClick={openCreate} className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Add Service
                </Button>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Code", "Name", "Category", "Base Price", "Tax %", "Status", ""].map((h) => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-14 text-muted-foreground">
                                    <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin opacity-50" />
                                    Loading services…
                                </td>
                            </tr>
                        ) : services.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-14 text-muted-foreground">
                                    <IndianRupee className="mx-auto mb-2 w-8 h-8 opacity-30" />
                                    No services found
                                </td>
                            </tr>
                        ) : (
                            services.map((svc) => (
                                <tr key={svc.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{svc.code}</td>
                                    <td className="px-4 py-3 font-medium text-foreground">{svc.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[svc.category]}`}>
                                            {CATEGORY_LABELS[svc.category]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground font-medium">{formatCurrency(svc.basePrice)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{svc.taxPercent}%</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={svc.status === "ACTIVE" ? "default" : "secondary"}>
                                            {svc.status === "ACTIVE" ? "Active" : "Inactive"}
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
                                                <DropdownMenuItem onSelect={() => openEdit(svc)}>
                                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleToggle(svc)}>
                                                    {svc.status === "ACTIVE"
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
                        <span className="text-xs text-muted-foreground">{total} services · Page {page} of {totalPages}</span>
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
                        <DialogTitle>{editTarget ? "Edit Service" : "Add Service"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1 space-y-1.5">
                                <Label htmlFor="svc-code">Code</Label>
                                <Input id="svc-code" placeholder="Auto-generated" value={form.code}
                                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label htmlFor="svc-name">Service Name <span className="text-destructive">*</span></Label>
                                <Input id="svc-name" placeholder="e.g. Complete Blood Count (CBC)" value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="svc-category">Category</Label>
                            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ServiceCategory }))}>
                                <SelectTrigger id="svc-category"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="svc-price">Base Price (₹) <span className="text-destructive">*</span></Label>
                                <Input id="svc-price" type="number" min={0} placeholder="0" value={form.basePrice}
                                    onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} />
                                {errors.basePrice && <p className="text-xs text-destructive">{errors.basePrice}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="svc-tax">Tax %</Label>
                                <Input id="svc-tax" type="number" min={0} max={100} placeholder="0" value={form.taxPercent}
                                    onChange={(e) => setForm((f) => ({ ...f, taxPercent: e.target.value }))} />
                                {errors.taxPercent && <p className="text-xs text-destructive">{errors.taxPercent}</p>}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="svc-status">Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as "ACTIVE" | "INACTIVE" }))}>
                                <SelectTrigger id="svc-status"><SelectValue /></SelectTrigger>
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
