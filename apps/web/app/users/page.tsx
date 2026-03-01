"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserPlus, Search, ChevronLeft, ChevronRight, MoreHorizontal, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Role { id: number; name: string }
interface User {
    id: string; name: string; email: string; phone: string;
    status: "ACTIVE" | "INACTIVE"; createdAt: string; lastLoginAt: string | null;
    role: Role;
}
interface PaginatedUsers { data: User[]; total: number; page: number; limit: number; totalPages: number }

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
    DOCTOR: "bg-blue-100 text-blue-700 border-blue-200",
    NURSE: "bg-green-100 text-green-700 border-green-200",
    RECEPTIONIST: "bg-amber-100 text-amber-700 border-amber-200",
    BILLING: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function UsersPage() {
    const [users, setUsers] = useState<PaginatedUsers | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "10" });
        if (search) params.set("search", search);
        if (roleFilter !== "ALL") params.set("role", roleFilter);
        if (statusFilter !== "ALL") params.set("status", statusFilter);

        const res = await fetch(`${API_URL}/api/users?${params}`, { credentials: "include" });
        if (res.ok) setUsers(await res.json());
        setLoading(false);
    }, [page, search, roleFilter, statusFilter]);

    useEffect(() => {
        fetch(`${API_URL}/api/roles`, { credentials: "include" })
            .then(r => r.json()).then(setRoles).catch(() => { });
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const deactivate = async (id: string) => {
        if (!confirm("Deactivate this user?")) return;
        await fetch(`${API_URL}/api/users/${id}/deactivate`, { method: "PATCH", credentials: "include" });
        fetchUsers();
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Users</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage system users and their roles</p>
                </div>
                <Link href="/users/create">
                    <Button className="gap-2"><UserPlus className="w-4 h-4" />Add User</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search name or email..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Roles</SelectItem>
                        {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Name", "Email", "Phone", "Role", "Status", "Created", "Last Login", ""].map(h => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
                        ) : users?.data.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No users found</td></tr>
                        ) : users?.data.map(user => (
                            <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_COLORS[user.role.name] ?? "bg-gray-100 text-gray-700"}`}>
                                        {user.role.name}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                                        {user.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                                <td className="px-4 py-3 text-muted-foreground">{formatDate(user.lastLoginAt)}</td>
                                <td className="px-4 py-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild><Link href={`/users/${user.id}/edit`}>Edit</Link></DropdownMenuItem>
                                            {user.status === "ACTIVE" && (
                                                <DropdownMenuItem variant="destructive" onSelect={() => deactivate(user.id)}>
                                                    <ShieldOff className="w-4 h-4" />Deactivate
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {users && users.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                        <span className="text-xs text-muted-foreground">
                            {users.total} users · Page {users.page} of {users.totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" disabled={page === users.totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
