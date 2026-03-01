"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface Role { id: number; name: string; description: string | null }

export default function CreateUserPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [roleId, setRoleId] = useState<string>("");

    useEffect(() => {
        fetch(`${API_URL}/api/roles`, { credentials: "include" })
            .then(r => r.json()).then(setRoles).catch(() => { });
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsPending(true);

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsPending(false);
            return;
        }

        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            roleId: parseInt(roleId),
            password,
            confirmPassword,
        };

        try {
            const res = await fetch(`${API_URL}/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json();
                setError(body.message ?? "Failed to create user");
                return;
            }

            router.push("/users");
        } catch {
            setError("Unable to connect to server");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="p-6 max-w-xl">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/users"><Button variant="ghost" size="icon-sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Create User</h1>
                    <p className="text-sm text-muted-foreground">Add a new system user</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" required minLength={2} placeholder="Dr. Priya Reddy" />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" required placeholder="priya@carenest.com" />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" type="tel" required pattern="[0-9]{10}" maxLength={10} placeholder="9000000000" />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="roleId">Role</Label>
                        <Select required value={roleId} onValueChange={setRoleId}>
                            <SelectTrigger id="roleId"><SelectValue placeholder="Select a role" /></SelectTrigger>
                            <SelectContent>
                                {roles.map(r => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                        <span className="font-medium">{r.name}</span>
                                        {r.description && <span className="text-muted-foreground ml-2">— {r.description}</span>}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required minLength={8} placeholder="Min. 8 characters" />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} placeholder="Re-enter password" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={isPending || !roleId} className="flex-1 gap-2">
                            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : "Create User"}
                        </Button>
                        <Link href="/users"><Button type="button" variant="outline">Cancel</Button></Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
