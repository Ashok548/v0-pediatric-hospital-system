"use client"

import { useState, useEffect } from "react"
import {
    Settings, User, Bell, Shield, Printer, Globe,
    ChevronRight, Save, Moon, Sun, Monitor, CheckCircle2, Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAllSettings, updateSettings } from "@/lib/api/settings"
import { useUsers } from "@/lib/api/users"
import { useAuthStore } from "@/lib/store/auth-store"

// ─── Settings Categories ────────────────────────────────────────────────────
const settingsSections = [
    { id: "profile", label: "Hospital Profile", icon: Settings },
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
    const [activeSection, setActiveSection] = useState("profile")
    const [theme, setTheme] = useState<Theme>("light")
    const [saved, setSaved] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const { currentUser } = useAuthStore()

    // Data Hooks
    const { allSettings, isLoading } = useAllSettings()
    const { users, isLoading: usersLoading } = useUsers()

    // Active States
    const [profileSettings, setProfileSettings] = useState({
        hospitalName: "CareNest Children's Hospital",
        registrationNumber: "MH-HOSP-2012-04521",
        totalBeds: "200",
        contactEmail: "admin@carenest.in",
        emergencyPhone: "+91 99999 88888",
        address: "14 Healing Road, Banjara Hills, Hyderabad – 500034"
    })

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

    const [printSettings, setPrintSettings] = useState({
        headerText: "CareNest Children's Hospital",
        footerText: "This is a computer generated document.",
        defaultPaperSize: "A4",
        defaultPrinter: "HP LaserJet Pro – Ward 1"
    })

    const [localeSettings, setLocaleSettings] = useState({
        timezone: "Asia/Kolkata (IST +05:30)",
        dateFormat: "DD MMM YYYY",
        timeFormat: "12-hour (AM/PM)",
        currency: "Indian Rupee (₹ INR)",
        language: "English"
    })

    // Sync from API
    useEffect(() => {
        if (!allSettings) return;
        if (allSettings.profile) setProfileSettings(p => ({ ...p, ...allSettings.profile }))
        if (allSettings.notifications) setNotifSettings(p => ({ ...p, ...allSettings.notifications }))
        if (allSettings.security) setSecuritySettings(p => ({ ...p, ...allSettings.security }))
        if (allSettings.printing) setPrintSettings(p => ({ ...p, ...allSettings.printing }))
        if (allSettings.locale) setLocaleSettings(p => ({ ...p, ...allSettings.locale }))
    }, [allSettings])

    const handleSave = async () => {
        if (activeSection === "users") return; // Users are saved elsewhere

        setIsSaving(true)

        let dataToSave = {};
        switch (activeSection) {
            case "profile": dataToSave = profileSettings; break;
            case "notifications": dataToSave = notifSettings; break;
            case "security": dataToSave = securitySettings; break;
            case "printing": dataToSave = printSettings; break;
            case "locale": dataToSave = localeSettings; break;
        }

        try {
            await updateSettings(activeSection, dataToSave, currentUser?.id);
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (error) {
            console.error("Failed to save settings", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
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
                {activeSection !== "users" && (
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2 shrink-0">
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : saved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
                        {isSaving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                    </Button>
                )}
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
                    {activeSection === "profile" && (
                        <>
                            <Card className="py-0">
                                <CardHeader className="px-5 pt-4 pb-2">
                                    <CardTitle className="text-sm font-semibold">Hospital Information</CardTitle>
                                    <CardDescription className="text-xs">Basic details shown across system</CardDescription>
                                </CardHeader>
                                <CardContent className="px-5 pb-5 flex flex-col gap-4">
                                    {[
                                        { key: "hospitalName", label: "Hospital Name", type: "text" },
                                        { key: "registrationNumber", label: "Registration Number", type: "text" },
                                        { key: "totalBeds", label: "Total Beds", type: "number" },
                                        { key: "contactEmail", label: "Contact Email", type: "email" },
                                        { key: "emergencyPhone", label: "Emergency Phone", type: "tel" },
                                        { key: "address", label: "Address", type: "text" },
                                    ].map(field => (
                                        <div key={field.key}>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">{field.label}</label>
                                            <input
                                                type={field.type}
                                                value={(profileSettings as any)[field.key] || ""}
                                                onChange={(e) => setProfileSettings(s => ({ ...s, [field.key]: e.target.value }))}
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
                                {usersLoading ? (
                                    <div className="p-8 flex justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
                                ) : users.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground">No users found.</div>
                                ) : (
                                    users.map((user: any, i: number, arr: any[]) => (
                                        <div key={user.id} className={cn(
                                            "flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors",
                                            i < arr.length - 1 && "border-b border-border"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                                                    {user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                                                    <p className="text-[11px] text-muted-foreground">{user.role?.name || "User"} · {user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn(
                                                    "text-[11px]",
                                                    user.status === "ACTIVE"
                                                        ? "text-[#1a7a4c] border-[#b4e4cb] bg-[#e6f6ee]"
                                                        : "text-muted-foreground"
                                                )}>
                                                    {user.status}
                                                </Badge>
                                                <Button variant="ghost" size="sm" className="size-7 p-0 text-muted-foreground">
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
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
                                    { key: "timezone", label: "Timezone", options: ["Asia/Kolkata (IST +05:30)", "UTC", "America/New_York"] },
                                    { key: "dateFormat", label: "Date Format", options: ["DD MMM YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
                                    { key: "timeFormat", label: "Time Format", options: ["12-hour (AM/PM)", "24-hour"] },
                                    { key: "currency", label: "Currency", options: ["Indian Rupee (₹ INR)", "US Dollar ($ USD)", "Euro (€ EUR)"] },
                                    { key: "language", label: "Language", options: ["English", "Hindi", "Telugu"] },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label className="text-xs font-medium text-muted-foreground block mb-1">{field.label}</label>
                                        <select
                                            value={(localeSettings as any)[field.key] || field.options[0]}
                                            onChange={e => setLocaleSettings(s => ({ ...s, [field.key]: e.target.value }))}
                                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                                        >
                                            {field.options.map(opt => <option key={opt}>{opt}</option>)}
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
                                    { key: "headerText", label: "Report Header Text" },
                                    { key: "footerText", label: "Footer Text" },
                                    { key: "defaultPaperSize", label: "Default Paper Size" },
                                    { key: "defaultPrinter", label: "Default Printer" },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label className="text-xs font-medium text-muted-foreground block mb-1">{field.label}</label>
                                        <input
                                            type="text"
                                            value={(printSettings as any)[field.key] || ""}
                                            onChange={e => setPrintSettings(s => ({ ...s, [field.key]: e.target.value }))}
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
