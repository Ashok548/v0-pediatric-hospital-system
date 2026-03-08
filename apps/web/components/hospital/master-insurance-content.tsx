"use client"

import { useState } from "react"
import {
    Plus, Search, X, MoreHorizontal, ShieldCheck, Pencil, ToggleLeft, ToggleRight, Loader2
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

interface InsuranceProvider {
    id: string
    code: string
    name: string
    contactEmail?: string
    contactPhone?: string
    claimPrefix: string
    discountPercent: number | string
    maxCoverLimit?: number | string | null
    status: "ACTIVE" | "INACTIVE"
    notes?: string
}

interface ApiListResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

type FormState = {
    code: string
    name: string
    contactEmail: string
    contactPhone: string
    claimPrefix: string
    discountPercent: string
    maxCoverLimit: string
    notes: string
    status: "ACTIVE" | "INACTIVE"
}

const EMPTY_FORM: FormState = {
    code: "", name: "", contactEmail: "", contactPhone: "",
    claimPrefix: "CLM", discountPercent: "0", maxCoverLimit: "", notes: "", status: "ACTIVE"
}

const PAGE_SIZE = 15

function formatINR(val: number | string | null | undefined) {
    if (!val) return "—"
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val))
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function MasterInsuranceContent() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<InsuranceProvider | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

    const debouncedSearch = useDebounce(search, 300)

    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) query.set("search", debouncedSearch)
    if (statusFilter !== "ALL") query.set("status", statusFilter)

    const { data, isLoading, mutate } = useQuery<ApiListResponse<InsuranceProvider>>(`/master/insurance?${query.toString()}`)
    const providers = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = data?.totalPages ?? 1

    const { trigger: createProvider, isMutating: isCreating } = useMutation<InsuranceProvider, any>(
        "/master/insurance", "POST", {
        successMessage: "Insurance provider created",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: updateProvider, isMutating: isUpdating } = useMutation<InsuranceProvider, any>(
        () => `/master/insurance/${editTarget?.id}`, "PATCH", {
        successMessage: "Insurance provider updated",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: toggleStatus } = useMutation<InsuranceProvider, string>(
        (id: string) => `/master/insurance/${id}`, "DELETE", {
        successMessage: "Status updated",
        onSuccess: () => mutate(),
    })

    function openCreate() {
        setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setDialogOpen(true)
    }

    function openEdit(p: InsuranceProvider) {
        setEditTarget(p)
        setForm({
            code: p.code, name: p.name,
            contactEmail: p.contactEmail ?? "", contactPhone: p.contactPhone ?? "",
            claimPrefix: p.claimPrefix, discountPercent: String(p.discountPercent),
            maxCoverLimit: p.maxCoverLimit ? String(p.maxCoverLimit) : "",
            notes: p.notes ?? "", status: p.status
        })
        setErrors({}); setDialogOpen(true)
    }

    function validate(): boolean {
        const e: Partial<Record<keyof FormState, string>> = {}
        if (!form.code.trim()) e.code = "Code is required"
        if (!form.name.trim()) e.name = "Name is required"
        if (Number(form.discountPercent) < 0 || Number(form.discountPercent) > 100)
            e.discountPercent = "Must be 0–100"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSave() {
        if (!validate()) return
        const payload: any = {
            code: form.code.trim(), name: form.name.trim(),
            claimPrefix: form.claimPrefix.trim() || "CLM",
            discountPercent: Number(form.discountPercent),
            status: form.status,
        }
        if (form.contactEmail.trim()) payload.contactEmail = form.contactEmail.trim()
        if (form.contactPhone.trim()) payload.contactPhone = form.contactPhone.trim()
        if (form.maxCoverLimit.trim()) payload.maxCoverLimit = Number(form.maxCoverLimit)
        if (form.notes.trim()) payload.notes = form.notes.trim()

        if (editTarget) await updateProvider(payload)
        else await createProvider(payload)
    }

    const isSaving = isCreating || isUpdating

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap gap-2 pb-2">
                <Badge variant="outline" className="font-normal bg-muted/20 text-foreground">
                    Total: {total}
                </Badge>
                <Badge variant="outline" className="font-normal bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300">
                    Active: {providers.filter(p => p.status === "ACTIVE").length}
                </Badge>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="insurance-search"
                            placeholder="Search by name or code…"
                            className="pl-9"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        />
                        {search && (
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                onClick={() => { setSearch(""); setPage(1) }}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1) }}>
                        <SelectTrigger className="w-32" id="insurance-status-filter"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button id="insurance-create-btn" onClick={openCreate} className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Add Provider
                </Button>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Code", "Provider Name", "Contact", "Claim Prefix", "Discount", "Max Cover", "Status", ""].map((h) => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={8} className="text-center py-14 text-muted-foreground">
                                <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin opacity-50" />Loading…
                            </td></tr>
                        ) : providers.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-14 text-muted-foreground">
                                <ShieldCheck className="mx-auto mb-2 w-8 h-8 opacity-30" />
                                No insurance providers found
                            </td></tr>
                        ) : (
                            providers.map((p) => (
                                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.code}</td>
                                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">
                                        <div>{p.contactEmail ?? "—"}</div>
                                        <div>{p.contactPhone ?? ""}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">{p.claimPrefix}</td>
                                    <td className="px-4 py-3">{Number(p.discountPercent)}%</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatINR(p.maxCoverLimit)}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>
                                            {p.status === "ACTIVE" ? "Active" : "Inactive"}
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
                                                <DropdownMenuItem onSelect={() => openEdit(p)}>
                                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => toggleStatus(p.id)}>
                                                    {p.status === "ACTIVE"
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
                        <span className="text-xs text-muted-foreground">{total} providers · Page {page} of {totalPages}</span>
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
                        <DialogTitle>{editTarget ? "Edit Insurance Provider" : "Add Insurance Provider"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="ins-code">Code <span className="text-destructive">*</span></Label>
                                <Input id="ins-code" placeholder="e.g. STAR" value={form.code}
                                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label htmlFor="ins-name">Provider Name <span className="text-destructive">*</span></Label>
                                <Input id="ins-name" placeholder="e.g. Star Health Insurance" value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="ins-email">Contact Email</Label>
                                <Input id="ins-email" type="email" placeholder="claims@insurer.com" value={form.contactEmail}
                                    onChange={(e) => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ins-phone">Contact Phone</Label>
                                <Input id="ins-phone" placeholder="1800-xxx-xxxx" value={form.contactPhone}
                                    onChange={(e) => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="ins-prefix">Claim Prefix</Label>
                                <Input id="ins-prefix" placeholder="CLM" value={form.claimPrefix}
                                    onChange={(e) => setForm(f => ({ ...f, claimPrefix: e.target.value.toUpperCase() }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ins-discount">Discount %</Label>
                                <Input id="ins-discount" type="number" min={0} max={100} placeholder="0" value={form.discountPercent}
                                    onChange={(e) => setForm(f => ({ ...f, discountPercent: e.target.value }))} />
                                {errors.discountPercent && <p className="text-xs text-destructive">{errors.discountPercent}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ins-cover">Max Cover (₹)</Label>
                                <Input id="ins-cover" type="number" min={0} placeholder="Optional" value={form.maxCoverLimit}
                                    onChange={(e) => setForm(f => ({ ...f, maxCoverLimit: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ins-notes">Notes</Label>
                            <Input id="ins-notes" placeholder="Any special conditions or claim procedures" value={form.notes}
                                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                        {editTarget && (
                            <div className="space-y-1.5">
                                <Label htmlFor="ins-status">Status</Label>
                                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as any }))}>
                                    <SelectTrigger id="ins-status"><SelectValue /></SelectTrigger>
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
