"use client"

import { useAuthStore, MOCK_USERS } from "@/lib/store/auth-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    doctor: "Doctor",
    nurse: "Nurse",
    billing_clerk: "Billing Clerk",
    pharmacist: "Pharmacist",
}

const ROLE_COLORS: Record<string, string> = {
    admin: "text-purple-600",
    doctor: "text-blue-600",
    nurse: "text-emerald-600",
    billing_clerk: "text-amber-600",
    pharmacist: "text-rose-600",
}

export function RoleSwitcher() {
    const { currentUser, setMockRole } = useAuthStore()

    if (process.env.NODE_ENV === "production" || !currentUser) {
        return null
    }

    return (
        <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Role:</span>
            </div>
            <Select value={currentUser.id} onValueChange={setMockRole}>
                <SelectTrigger className="h-8 w-[160px] text-xs border-dashed bg-background">
                    <SelectValue>
                        <span className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${currentUser.role === "admin" ? "bg-purple-500" :
                                    currentUser.role === "doctor" ? "bg-blue-500" :
                                        currentUser.role === "nurse" ? "bg-emerald-500" :
                                            currentUser.role === "billing_clerk" ? "bg-amber-500" :
                                                "bg-rose-500"
                                }`} />
                            <span className={ROLE_COLORS[currentUser.role]}>
                                {ROLE_LABELS[currentUser.role]}
                            </span>
                        </span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {MOCK_USERS.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                            <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]} · {user.department}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
