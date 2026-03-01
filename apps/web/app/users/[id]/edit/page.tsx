"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Role { id: number; name: string; description: string | null }
interface User { id: string; name: string; email: string; phone: string; status: "ACTIVE" | "INACTIVE"; role: Role }

export default function EditUserPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };

    const [user, setUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetPending, setResetPending] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [roleId, setRoleId] = useState("");
    const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/api/users/${id}`, { credentials: "include" }).then(r => r.json()),
            fetch(`${API_URL}/api/roles`, { credentials: "include" }).then(r => r.json()),
        ]).then(([u, r]) => {
            setUser(u);
            setRoles(r);
            setName(u.name);
            setPhone(u.phone);
            setRoleId(String(u.role.id));
            setStatus(u.status);
        });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsPending(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name, phone, roleId: parseInt(roleId), status }),
            });
            if (!res.ok) {
                const body = await res.json();
                setError(body.message ?? "Update failed");
            } else {
                router.push("/users");
            }
        } catch {
            setError("Unable to connect to server");
        } finally {
            setIsPending(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setResetError(null);
        setResetPending(true);
        const formData = new FormData(e.currentTarget);
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;
        if (newPassword !== confirmPassword) {
            setResetError("Passwords do not match");
            setResetPending(false);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/users/${id}/reset-password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ newPassword, confirmPassword }),
            });
            if (!res.ok) {
                const body = await res.json();
                setResetError(body.message ?? "Reset failed");
            } else {
                setShowResetModal(false);
            }
        } catch {
            setResetError("Unable to connect to server");
        } finally {
            setResetPending(false);
        }
    };

    if (!user) return <div className="p-6 text-muted-foreground">Loading...</div>;

    return (
        <div className="p-6 max-w-xl">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/users"><Button variant="ghost" size="icon-sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Edit User</h1>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge className="ml-auto" variant={user.status === "ACTIVE" ? "default" : "secondary"}>{user.status}</Badge>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required minLength={2} />
                    </div>

                    {/* Email is read-only */}
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-muted-foreground">Email Address <span className="text-xs">(read-only)</span></Label>
                        <Input id="email" value={user.email} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} pattern="[0-9]{10}" maxLength={10} required />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="role">Role</Label>
                        <Select value={roleId} onValueChange={setRoleId}>
                            <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={v => setStatus(v as "ACTIVE" | "INACTIVE")}>
                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={isPending} className="flex-1 gap-2">
                            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : "Save Changes"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowResetModal(true)} className="gap-2">
                            <KeyRound className="w-4 h-4" />Reset Password
                        </Button>
                    </div>
                </form>
            </div>

            {/* Reset Password Modal */}
            <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>Set a new password for {user.name}. No old password is required.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4 py-2">
                        {resetError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{resetError}</div>}
                        <div className="space-y-1.5">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowResetModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={resetPending} className="gap-2">
                                {resetPending ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting...</> : "Reset Password"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
