"use client"

import { useState } from "react"
import {
    Plus, Search, ChevronLeft, ChevronRight, Pencil, ToggleLeft, ToggleRight, X, Layers, MoreHorizontal, Loader2
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

interface Floor {
    id: string
    name: string
    floorNumber: number
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
}

interface ApiListResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
}

type FormState = {
    name: string
    floorNumber: string
    status: "ACTIVE" | "INACTIVE"
}

const EMPTY_FORM: FormState = { name: "", floorNumber: "", status: "ACTIVE" }
const PAGE_SIZE = 10

// ─── Component ────────────────────────────────────────────────────────────────

export function MasterFloorsContent() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<Floor | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [errors, setErrors] = useState<Partial<FormState>>({})

    const debouncedSearch = useDebounce(search, 300)

    // ─── Live Data ──────────────────────────────────────────────────────────
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) query.set("search", debouncedSearch)

    const { data, isLoading, mutate } = useQuery<ApiListResponse<Floor>>(`/master/floors?${query.toString()}`)
    const floors = data?.data ?? []
    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    // ─── Mutations ──────────────────────────────────────────────────────────
    const { trigger: createFloor, isMutating: isCreating } = useMutation<Floor, Omit<Floor, "id" | "createdAt">>(
        "/master/floors", "POST", {
        successMessage: "Floor created successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: updateFloor, isMutating: isUpdating } = useMutation<Floor, Partial<Floor>>(
        (vars) => `/master/floors/${editTarget?.id}`, "PATCH", {
        successMessage: "Floor updated successfully",
        onSuccess: () => { mutate(); setDialogOpen(false) },
    })

    const { trigger: toggleStatus } = useMutation<Floor, void>(
        (id) => `/master/floors/${id}`, "DELETE", {
        successMessage: "Floor status updated",
        onSuccess: () => mutate(),
    })

    // ─── Handlers ────────────────────────────────────────────────────────────
    function openCreate() {
        setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setDialogOpen(true)
    }

    function openEdit(floor: Floor) {
        setEditTarget(floor)
        setForm({ name: floor.name, floorNumber: String(floor.floorNumber), status: floor.status })
        setErrors({}); setDialogOpen(true)
    }

    function validate(): boolean {
        const e: Partial<FormState> = {}
        if (!form.name.trim()) e.name = "Name is required"
        if (form.floorNumber === "" || isNaN(Number(form.floorNumber)))
            e.floorNumber = "Valid floor number required"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSave() {
        if (!validate()) return
        const payload = { name: form.name.trim(), floorNumber: Number(form.floorNumber), status: form.status }
        if (editTarget) {
            await updateFloor(payload)
        } else {
            await createFloor(payload as any)
        }
    }

    async function handleToggle(floor: Floor) {
        await (toggleStatus as any)(floor.id)
    }

    const isSaving = isCreating || isUpdating

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="floors-search"
                        placeholder="Search by name or floor number…"
                        className="pl-9"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    />
                    {search && (
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => { setSearch(""); setPage(1) }}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <Button id="floors-create-btn" onClick={openCreate} className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Add Floor
                </Button>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Floor No.", "Name", "Status", "Created", ""].map((h) => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-14 text-muted-foreground">
                                    <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin opacity-50" />
                                    Loading floors…
                                </td>
                            </tr>
                        ) : floors.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-14 text-muted-foreground">
                                    <Layers className="mx-auto mb-2 w-8 h-8 opacity-30" />
                                    No floors found
                                </td>
                            </tr>
                        ) : (
                            floors.map((floor) => (
                                <tr key={floor.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                                        {floor.floorNumber === 0 ? "G" : floor.floorNumber}
                                    </td>
                                    <td className="px-4 py-3 text-foreground font-medium">{floor.name}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={floor.status === "ACTIVE" ? "default" : "secondary"}>
                                            {floor.status === "ACTIVE" ? "Active" : "Inactive"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(floor.createdAt).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => openEdit(floor)}>
                                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleToggle(floor)}>
                                                    {floor.status === "ACTIVE"
                                                        ? <><ToggleLeft className="w-3.5 h-3.5 mr-2" /> Deactivate</>
                                                        : <><ToggleRight className="w-3.5 h-3.5 mr-2" /> Activate</>}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                        <span className="text-xs text-muted-foreground">
                            {total} floors · Page {page} of {totalPages}
                        </span>
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

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Edit Floor" : "Add New Floor"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="floor-name">Floor Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="floor-name"
                                placeholder="e.g. Ground Floor – Intensive Care"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="floor-number">Floor Number <span className="text-destructive">*</span></Label>
                            <Input
                                id="floor-number"
                                type="number"
                                placeholder="0 = Ground Floor"
                                value={form.floorNumber}
                                onChange={(e) => setForm((f) => ({ ...f, floorNumber: e.target.value }))}
                            />
                            {errors.floorNumber && <p className="text-xs text-destructive">{errors.floorNumber}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="floor-status">Status</Label>
                            <Select
                                value={form.status}
                                onValueChange={(v) => setForm((f) => ({ ...f, status: v as "ACTIVE" | "INACTIVE" }))}
                            >
                                <SelectTrigger id="floor-status"><SelectValue /></SelectTrigger>
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
                            {editTarget ? "Save Changes" : "Create Floor"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
