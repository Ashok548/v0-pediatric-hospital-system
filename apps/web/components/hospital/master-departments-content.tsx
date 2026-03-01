"use client"

import { useState } from "react"
import {
    Plus, Search, ChevronLeft, ChevronRight, Pencil, ToggleLeft, ToggleRight, X, Building2, MoreHorizontal, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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

interface Department {
    id: string
    name: string
    description: string
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
}

interface ApiListResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE"

type FormState = {
    name: string
    description: string
    status: "ACTIVE" | "INACTIVE"
}

const EMPTY_FORM: FormState = { name: "", description: "", status: "ACTIVE" }
const PAGE_SIZE = 10

// ─── Component ────────────────────────────────────────────────────────────────

export function MasterDepartmentsContent() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<Department | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [errors, setErrors] = useState<Partial<FormState>>({})

    const debouncedSearch = useDebounce(search, 300)

    // ─── Live Data ──────────────────────────────────────────────────────────
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) query.set("search", debouncedSearch)
    if (statusFilter !== "ALL") query.set("status", statusFilter)

    const { data, isLoading, mutate } = useQuery<ApiListResponse<Department>>(`/master/departments?${query.toString()}`)
    const departments = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    // ─── Mutations ──────────────────────────────────────────────────────────
    const { trigger: createDept, isMutating: isCreating } = useMutation<Department, Omit<Department, "id" | "createdAt">>(
        "/master/departments", "POST", {
        successMessage: "Department created successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: updateDept, isMutating: isUpdating } = useMutation<Department, Partial<Department>>(
        (vars) => `/master/departments/${editTarget?.id}`, "PATCH", {
        successMessage: "Department updated successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: toggleStatus } = useMutation<Department, void>(
        (id) => `/master/departments/${id}`, "DELETE", {
        successMessage: "Department status updated",
        onSuccess: () => mutate(),
    })

    // ─── Handlers ────────────────────────────────────────────────────────────
    function openCreate() {
        setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setDialogOpen(true)
    }

    function openEdit(dept: Department) {
        setEditTarget(dept)
        setForm({ name: dept.name, description: dept.description, status: dept.status })
        setErrors({}); setDialogOpen(true)
    }

    function validate(): boolean {
        const e: Partial<FormState> = {}
        if (!form.name.trim()) e.name = "Name is required"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSave() {
        if (!validate()) return
        const payload = { name: form.name.trim(), description: form.description.trim(), status: form.status }
        if (editTarget) {
            await updateDept(payload)
        } else {
            await createDept(payload as any)
        }
    }

    async function handleToggle(dept: Department) {
        await (toggleStatus as any)(dept.id)
    }

    const isSaving = isCreating || isUpdating

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="depts-search"
                            placeholder="Search departments…"
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
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1) }}>
                        <SelectTrigger className="w-36" id="depts-status-filter">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button id="depts-create-btn" onClick={openCreate} className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Add Department
                </Button>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Name", "Description", "Status", "Created", ""].map((h) => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-14 text-muted-foreground">
                                    <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin opacity-50" />
                                    Loading departments…
                                </td>
                            </tr>
                        ) : departments.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-14 text-muted-foreground">
                                    <Building2 className="mx-auto mb-2 w-8 h-8 opacity-30" />
                                    No departments found
                                </td>
                            </tr>
                        ) : (
                            departments.map((dept) => (
                                <tr key={dept.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">{dept.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{dept.description}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={dept.status === "ACTIVE" ? "default" : "secondary"}>
                                            {dept.status === "ACTIVE" ? "Active" : "Inactive"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(dept.createdAt).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => openEdit(dept)}>
                                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleToggle(dept)}>
                                                    {dept.status === "ACTIVE"
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
                        <span className="text-xs text-muted-foreground">{total} departments · Page {page} of {totalPages}</span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Edit Department" : "Add Department"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="dept-name">Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="dept-name"
                                placeholder="e.g. Pediatric Surgery"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="dept-desc">Description</Label>
                            <Textarea
                                id="dept-desc"
                                rows={3}
                                placeholder="Brief description of the department…"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="dept-status">Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as "ACTIVE" | "INACTIVE" }))}>
                                <SelectTrigger id="dept-status"><SelectValue /></SelectTrigger>
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
