"use client"

import { useState } from "react"
import {
    Settings,
    User,
    Bell,
    Shield,
    Printer,
    Globe,
    ChevronRight,
    Save,
    Moon,
    Sun,
    Monitor,
    CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Settings Categories ────────────────────────────────────────────────────
const settingsSections = [
    { id: "hospital", label: "Hospital Profile", icon: Settings },
    { id: "users", label: "Users & Roles", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "printing", label: "Printing", icon: Printer },
    { id: "locale", label: "Locale & Region", icon: Globe },
]

type Theme = "light" | "dark" | "system"

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
                checked ? "bg-primary" : "bg-muted-foreground/30"
            )}
            role="switch"
            aria-checked={checked}
        >
            <span
                className={cn(
                    "inline-block size-4 rounded-full bg-white shadow transition-transform",
                    checked ? "translate-x-4.5" : "translate-x-0.5"
                )}
            />
        </button>
    )
}

// ─── Component ──────────────────────────────────────────────────────────────
export function SettingsContent() {
    const [activeSection, setActiveSection] = useState("hospital")
    const [theme, setTheme] = useState<Theme>("light")
    const [saved, setSaved] = useState(false)

    const [notifSettings, setNotifSettings] = useState({
        criticalAlerts: true,
        labResults: true,
        appointmentReminders: true,
        billingAlerts: false,
        nicuAlerts: true,
        dailySummary: false,
    })

    const [securitySettings, setSecuritySettings] = useState({
        twoFactor: false,
        sessionTimeout: true,
        auditLog: true,
        ipWhitelist: false,
    })

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1100px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Settings</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage hospital system preferences and configuration
                    </p>
                </div>
                <Button onClick={handleSave} className="gap-2 shrink-0">
                    {saved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
                    {saved ? "Saved!" : "Save Changes"}
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
                {/* Sidebar Nav */}
                <nav className="lg:w-52 shrink-0">
                    <Card className="py-2 px-1">
                        <ul className="flex flex-col gap-0.5">
                            {settingsSections.map(section => (
                                <li key={section.id}>
                                    <button
                                        onClick={() => setActiveSection(section.id)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors",
                                            activeSection === section.id
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <section.icon className="size-4 shrink-0" />
                                        {section.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </nav>

                {/* Content Panel */}
                <div className="flex-1 flex flex-col gap-4">

                    {/* ── Hospital Profile ────────────────────────────────────── */}
                    {activeSection === "hospital" && (
                        <>
                            <Card className="py-0">
                                <CardHeader className="px-5 pt-4 pb-2">
                                    <CardTitle className="text-sm font-semibold">Hospital Information</CardTitle>
                                    <CardDescription className="text-xs">Basic details shown across system</CardDescription>
                                </CardHeader>
                                <CardContent className="px-5 pb-5 flex flex-col gap-4">
                                    {[
                                        { label: "Hospital Name", value: "CareNest Children's Hospital", type: "text" },
                                        { label: "Registration Number", value: "MH-HOSP-2012-04521", type: "text" },
                                        { label: "Total Beds", value: "200", type: "number" },
                                        { label: "Contact Email", value: "admin@carenest.in", type: "email" },
                                        { label: "Emergency Phone", value: "+91 99999 88888", type: "tel" },
                                        { label: "Address", value: "14 Healing Road, Banjara Hills, Hyderabad – 500034", type: "text" },
                                    ].map(field => (
                                        <div key={field.label}>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">{field.label}</label>
                                            <input
                                                type={field.type}
                                                defaultValue={field.value}
                                                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="py-0">
                                <CardHeader className="px-5 pt-4 pb-2">
                                    <CardTitle className="text-sm font-semibold">Appearance</CardTitle>
                                    <CardDescription className="text-xs">Choose the interface theme</CardDescription>
                                </CardHeader>
                                <CardContent className="px-5 pb-5">
                                    <div className="flex gap-3">
                                        {([
                                            { value: "light", label: "Light", Icon: Sun },
                                            { value: "dark", label: "Dark", Icon: Moon },
                                            { value: "system", label: "System", Icon: Monitor },
                                        ] as { value: Theme; label: string; Icon: React.ElementType }[]).map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setTheme(opt.value)}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 flex-1 transition-all text-sm font-medium",
                                                    theme === opt.value
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-border text-muted-foreground hover:border-primary/30"
                                                )}
                                            >
                                                <opt.Icon className="size-5" />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* ── Notifications ───────────────────────────────────────── */}
                    {activeSection === "notifications" && (
                        <Card className="py-0">
                            <CardHeader className="px-5 pt-4 pb-2">
                                <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
                                <CardDescription className="text-xs">Control which alerts trigger in-app notifications</CardDescription>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 flex flex-col gap-0">
                                {(Object.entries(notifSettings) as [keyof typeof notifSettings, boolean][]).map(([key, val], i, arr) => {
                                    const labels: Record<keyof typeof notifSettings, { label: string; desc: string }> = {
                                        criticalAlerts: { label: "Critical Patient Alerts", desc: "Notify when a patient's condition becomes critical" },
                                        labResults: { label: "Lab Results Ready", desc: "Notify when investigation reports are available" },
                                        appointmentReminders: { label: "Appointment Reminders", desc: "30-minute reminders before scheduled appointments" },
                                        billingAlerts: { label: "Billing Alerts", desc: "Notify for overdue bills and payment receipts" },
                                        nicuAlerts: { label: "NICU Vitals Alerts", desc: "Real-time vitals threshold breach notifications" },
                                        dailySummary: { label: "Daily Summary Email", desc: "Send end-of-day census report to admin email" },
                                    }
                                    const item = labels[key]
                                    return (
                                        <div key={key} className={cn("flex items-center justify-between py-3.5", i < arr.length - 1 && "border-b border-border")}>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{item.label}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                            </div>
                                            <Toggle checked={val} onChange={v => setNotifSettings(s => ({ ...s, [key]: v }))} />
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Security ─────────────────────────────────────────────── */}
                    {activeSection === "security" && (
                        <>
                            <Card className="py-0">
                                <CardHeader className="px-5 pt-4 pb-2">
                                    <CardTitle className="text-sm font-semibold">Security Settings</CardTitle>
                                    <CardDescription className="text-xs">Access control and authentication options</CardDescription>
                                </CardHeader>
                                <CardContent className="px-5 pb-5 flex flex-col gap-0">
                                    {(Object.entries(securitySettings) as [keyof typeof securitySettings, boolean][]).map(([key, val], i, arr) => {
                                        const labels: Record<keyof typeof securitySettings, { label: string; desc: string; badge?: string }> = {
                                            twoFactor: { label: "Two-Factor Authentication", desc: "Require OTP on login for all staff accounts", badge: "Recommended" },
                                            sessionTimeout: { label: "Auto Session Timeout", desc: "Log out inactive sessions after 30 minutes" },
                                            auditLog: { label: "Audit Logging", desc: "Track all data access and changes with timestamps" },
                                            ipWhitelist: { label: "IP Whitelist", desc: "Restrict login to hospital network IP ranges only" },
                                        }
                                        const item = labels[key]
                                        return (
                                            <div key={key} className={cn("flex items-center justify-between py-3.5", i < arr.length - 1 && "border-b border-border")}>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                                                        {item.badge && (
                                                            <Badge variant="outline" className="text-[10px] text-[#1a7a4c] border-[#b4e4cb] bg-[#e6f6ee]">
                                                                {item.badge}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                                </div>
                                                <Toggle checked={val} onChange={v => setSecuritySettings(s => ({ ...s, [key]: v }))} />
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                            <Card className="py-0 border-destructive/30 bg-destructive/[0.02]">
                                <CardContent className="px-5 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Reset System Passwords</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Force all staff to reset passwords at next login</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 text-xs">
                                        Force Reset
                                    </Button>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* ── Users & Roles ────────────────────────────────────────── */}
                    {activeSection === "users" && (
                        <Card className="py-0">
                            <CardHeader className="px-5 pt-4 pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-semibold">Users & Roles</CardTitle>
                                        <CardDescription className="text-xs">Manage staff accounts and permissions</CardDescription>
                                    </div>
                                    <Button size="sm" className="text-xs h-8">Add User</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                {[
                                    { name: "Dr. Priya Reddy", role: "Senior Paediatrician", dept: "Neonatology", status: "Active" },
                                    { name: "Dr. Anil Kumar", role: "Consultant", dept: "General Paediatrics", status: "Active" },
                                    { name: "Dr. Meera Iyer", role: "Paediatric Cardiologist", dept: "Cardiology", status: "Active" },
                                    { name: "Nandini Rao", role: "Head Nurse", dept: "NICU", status: "Active" },
                                    { name: "Ravi Shankar", role: "Lab Technician", dept: "Pathology", status: "Active" },
                                    { name: "Admin User", role: "System Administrator", dept: "IT", status: "Active" },
                                ].map((user, i, arr) => (
                                    <div key={user.name} className={cn(
                                        "flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors",
                                        i < arr.length - 1 && "border-b border-border"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                {user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{user.name}</p>
                                                <p className="text-[11px] text-muted-foreground">{user.role} · {user.dept}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[11px] text-[#1a7a4c] border-[#b4e4cb] bg-[#e6f6ee]">
                                                {user.status}
                                            </Badge>
                                            <Button variant="ghost" size="sm" className="size-7 p-0 text-muted-foreground">
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Locale ───────────────────────────────────────────────── */}
                    {activeSection === "locale" && (
                        <Card className="py-0">
                            <CardHeader className="px-5 pt-4 pb-2">
                                <CardTitle className="text-sm font-semibold">Locale & Regional Settings</CardTitle>
                                <CardDescription className="text-xs">Date formats, timezone, and language</CardDescription>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 flex flex-col gap-4">
                                {[
                                    { label: "Timezone", value: "Asia/Kolkata (IST +05:30)" },
                                    { label: "Date Format", value: "DD MMM YYYY" },
                                    { label: "Time Format", value: "12-hour (AM/PM)" },
                                    { label: "Currency", value: "Indian Rupee (₹ INR)" },
                                    { label: "Language", value: "English" },
                                ].map(field => (
                                    <div key={field.label}>
                                        <label className="text-xs font-medium text-muted-foreground block mb-1">{field.label}</label>
                                        <select
                                            defaultValue={field.value}
                                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                                        >
                                            <option>{field.value}</option>
                                        </select>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Printing ─────────────────────────────────────────────── */}
                    {activeSection === "printing" && (
                        <Card className="py-0">
                            <CardHeader className="px-5 pt-4 pb-2">
                                <CardTitle className="text-sm font-semibold">Print & Report Settings</CardTitle>
                                <CardDescription className="text-xs">Configure headers, footers, and printer defaults</CardDescription>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 flex flex-col gap-4">
                                {[
                                    { label: "Report Header Text", value: "CareNest Children's Hospital" },
                                    { label: "Footer Text", value: "This is a computer generated document." },
                                    { label: "Default Paper Size", value: "A4" },
                                    { label: "Default Printer", value: "HP LaserJet Pro – Ward 1" },
                                ].map(field => (
                                    <div key={field.label}>
                                        <label className="text-xs font-medium text-muted-foreground block mb-1">{field.label}</label>
                                        <input
                                            type="text"
                                            defaultValue={field.value}
                                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
