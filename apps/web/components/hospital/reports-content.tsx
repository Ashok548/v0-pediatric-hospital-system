"use client"

import { useState } from "react"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Baby,
    CalendarDays,
    IndianRupee,
    Syringe,
    FlaskConical,
    Download,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import {
    useReportKpis,
    useAdmissionsTrend,
    useRevenueTrend,
    useDepartmentCensus,
    useTopDiagnoses,
    useVaccinationTrend,
    type DepartmentCensusData,
    type TopDiagnosisData
} from "@/lib/api/reports"
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

// ─── Component ──────────────────────────────────────────────────────────────
export function ReportsContent() {
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [vaccinationDays, setVaccinationDays] = useState<number>(7)

    const dateRange = {
        start: startDate ? new Date(startDate) : undefined,
        end: endDate ? new Date(endDate) : undefined
    }

    const isFiltered = !!(startDate || endDate);

    // 1. Fetch live data via SWR
    const { kpis, isLoading: isKpiLoading } = useReportKpis(dateRange)
    const { data: admissionsData, isLoading: isAdmLoading } = useAdmissionsTrend(6)
    const { data: revenueData, isLoading: isRevLoading } = useRevenueTrend(4)
    const { data: censusData, isLoading: isCenLoading } = useDepartmentCensus(dateRange)
    const { data: diagnosesData, isLoading: isDiagLoading } = useTopDiagnoses(6, dateRange)
    const { data: vaccinationTrendData, isLoading: isVaccLoading } = useVaccinationTrend(vaccinationDays)

    // 2. Format currency safely
    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return "0"
        return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)
    }

    // 3. Construct KPI Stats array from live data
    const kpiStats = [
        {
            label: "Bed Occupancy Rate",
            value: isKpiLoading ? "..." : `${kpis?.bedOccupancy.percentage ?? 0}%`,
            change: "Live census",
            positive: true, icon: Users, iconColor: "text-primary", iconBg: "bg-primary/10"
        },
        {
            label: "Total Inpatients",
            value: isKpiLoading ? "..." : String(kpis?.totalPatients ?? 0),
            change: "Admitted today",
            positive: true, icon: CalendarDays, iconColor: "text-chart-2", iconBg: "bg-chart-2/10"
        },
        {
            label: "NICU Utilisation",
            value: isKpiLoading ? "..." : `${kpis?.nicuOccupancy.percentage ?? 0}%`,
            change: "Live census",
            positive: false, icon: Baby, iconColor: "text-destructive", iconBg: "bg-destructive/10"
        },
        {
            label: isFiltered ? "Revenue for Period" : "Revenue This Month",
            value: isKpiLoading ? "..." : `₹${formatCurrency(kpis?.revenueThisMonth)}`,
            change: "Live billing",
            positive: true, icon: IndianRupee, iconColor: "text-chart-3", iconBg: "bg-chart-3/10"
        },
        {
            label: isFiltered ? "Vaccinations (Period)" : "Vaccinations This Month",
            value: isKpiLoading ? "..." : String(kpis?.vaccinationsThisMonth ?? 0),
            change: "Live data",
            positive: true, icon: Syringe, iconColor: "text-chart-5", iconBg: "bg-chart-5/10"
        },
        {
            label: isFiltered ? "Lab Tests (Period)" : "Lab Tests Ordered",
            value: isKpiLoading ? "..." : String(kpis?.labsThisMonth ?? 0),
            change: "Live data",
            positive: true, icon: FlaskConical, iconColor: "text-chart-4", iconBg: "bg-chart-4/10"
        },
    ]

    return (
        <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Reports & Analytics</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        CareNest Hospital &middot; Live Data Snapshot &middot; All departments
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="h-9 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <input
                            type="date"
                            className="h-9 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                        {(startDate || endDate) && (
                            <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate("") }} className="text-xs h-8 px-2 text-muted-foreground">
                                Clear
                            </Button>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2 shrink-0"
                        onClick={async () => {
                            const toastId = toast.loading("Generating report...");
                            try {
                                let url = "/api/reports/export";
                                const params = new URLSearchParams();
                                if (startDate) params.append("startDate", new Date(startDate).toISOString());
                                if (endDate) params.append("endDate", new Date(endDate).toISOString());

                                const queryString = params.toString();
                                if (queryString) {
                                    url += `?${queryString}`;
                                }

                                const response = await fetch(url);
                                if (!response.ok) throw new Error("Export failed");

                                const blob = await response.blob();
                                const downloadUrl = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = downloadUrl;

                                const disposition = response.headers.get('content-disposition');
                                let filename = 'carenest-report.csv';
                                if (disposition && disposition.indexOf('filename=') !== -1) {
                                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                    const matches = filenameRegex.exec(disposition);
                                    if (matches != null && matches[1]) {
                                        filename = matches[1].replace(/['"]/g, '');
                                    }
                                }
                                a.download = filename;

                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(downloadUrl);
                                document.body.removeChild(a);

                                toast.success("Report exported successfully", { id: toastId });
                            } catch (error) {
                                console.error("Export error:", error);
                                toast.error(error instanceof Error ? error.message : "Failed to export report", { id: toastId });
                            }
                        }}
                    >
                        <Download className="size-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {kpiStats.map(stat => (
                    <Card key={stat.label} className="py-0">
                        <CardContent className="px-4 py-3 flex flex-col gap-2">
                            <div className={`flex items-center justify-center size-9 rounded-lg ${stat.iconBg} self-start`}>
                                <stat.icon className={`size-4.5 ${stat.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-foreground tabular-nums leading-tight">{stat.value}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-[11px] font-medium ${stat.positive ? "text-[#1a7a4c]" : "text-[#c53030]"}`}>
                                {stat.positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                {stat.change}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row 1: Admissions + Census */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                {/* Admissions vs Discharges */}
                <Card className="xl:col-span-3 py-0">
                    <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="text-sm font-semibold">Admissions vs Discharges</CardTitle>
                        <CardDescription className="text-xs">Last 6 months trend</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 pb-4">
                        {isAdmLoading ? (
                            <div className="flex items-center justify-center h-[220px]">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={admissionsData} barGap={4} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                                            cursor={{ fill: "hsl(var(--muted))" }}
                                        />
                                        <Bar dataKey="admissions" name="Admissions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="discharges" name="Discharges" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex items-center justify-center gap-4 mt-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className="size-2.5 rounded-sm bg-primary inline-block" />Admissions
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className="size-2.5 rounded-sm bg-chart-2 inline-block" />Discharges
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Department Load – Pie */}
                <Card className="xl:col-span-2 py-0">
                    <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="text-sm font-semibold">Census by Department</CardTitle>
                        <CardDescription className="text-xs">Active inpatients</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        {isCenLoading ? (
                            <div className="flex items-center justify-center h-[160px]">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : censusData.length === 0 ? (
                            <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
                                No active admissions
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                            <Pie data={censusData} dataKey="value" cx="50%" cy="50%" outerRadius={72} innerRadius={44} paddingAngle={2}>
                                                {censusData.map((entry: DepartmentCensusData, i: number) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-col gap-1.5 mt-1">
                                    {censusData.map((d: DepartmentCensusData) => (
                                        <div key={d.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                                <span className="truncate max-w-[140px]">{d.name}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-foreground tabular-nums">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2: Revenue + Vaccination */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Weekly Revenue */}
                <Card className="py-0">
                    <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="text-sm font-semibold">Weekly Revenue</CardTitle>
                        <CardDescription className="text-xs">Gross receipts past 4 weeks</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 pb-4">
                        {isRevLoading ? (
                            <div className="flex items-center justify-center h-[200px]">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={revenueData} barGap={4} barCategoryGap="35%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                                    <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                                        formatter={(v: number) => [`₹${new Intl.NumberFormat("en-IN").format(v)}`, ""]}
                                        cursor={{ fill: "hsl(var(--muted))" }}
                                    />
                                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Vaccination Trend */}
                <Card className="py-0">
                    <CardHeader className="px-4 pt-4 pb-2 flex flex-row flex-wrap items-start justify-between gap-2">
                        <div>
                            <CardTitle className="text-sm font-semibold">Daily Vaccination Count</CardTitle>
                            <CardDescription className="text-xs">Doses administered over time</CardDescription>
                        </div>
                        <div className="flex bg-muted/50 rounded-md border border-border overflow-hidden p-[2px]">
                            {[7, 14, 30].map(days => (
                                <button
                                    key={days}
                                    onClick={() => setVaccinationDays(days)}
                                    className={`px-2 py-1 text-[10px] font-medium rounded-sm transition-colors ${vaccinationDays === days
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {days}d
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 pb-4">
                        {isVaccLoading ? (
                            <div className="flex items-center justify-center h-[200px]">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={vaccinationTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="Vaccinations"
                                        stroke="hsl(var(--chart-5))"
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: "hsl(var(--chart-5))", strokeWidth: 0 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Diagnoses */}
            <Card className="py-0">
                <CardHeader className="px-4 pt-4 pb-2">
                    <CardTitle className="text-sm font-semibold">Top Diagnoses All Time</CardTitle>
                    <CardDescription className="text-xs">Aggregated from initial admission definitions</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    {isDiagLoading ? (
                        <div className="flex items-center justify-center h-[120px]">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : diagnosesData.length === 0 ? (
                        <div className="flex items-center justify-center h-[120px] text-sm text-muted-foreground">
                            No diagnoses recorded yet
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {diagnosesData.map((diag: TopDiagnosisData, i: number) => (
                                <div key={diag.diagnosis} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm font-medium text-foreground">{diag.diagnosis}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-foreground tabular-nums">{diag.count}</span>
                                        <Badge
                                            variant="outline"
                                            className={
                                                diag.trend === "up"
                                                    ? "text-[11px] text-[#c53030] border-[#f5bcbc] bg-[#fde8e8]"
                                                    : diag.trend === "down"
                                                        ? "text-[11px] text-[#1a7a4c] border-[#b4e4cb] bg-[#e6f6ee]"
                                                        : "text-[11px] text-[#856404] border-[#ffeaa0] bg-[#fef3cd]"
                                            }
                                        >
                                            {diag.trend === "up" ? "↑" : diag.trend === "down" ? "↓" : "→"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-4">
                <div className="flex items-center gap-1.5">
                    <BarChart3 className="size-3.5" />
                    <span>CareNest HMS · Analytics Module · Live Connected</span>
                </div>
                <TooltipProvider>
                    <UITooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                            <span className="inline-block"> {/* Wrap in span to reliably trigger tooltip on disabled button */}
                                <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2 text-muted-foreground/60 cursor-not-allowed hidden sm:inline-flex" disabled>
                                    <Download className="size-3" />
                                    PDF Report
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="end" className="text-xs">
                            <p>Coming Soon</p>
                        </TooltipContent>
                    </UITooltip>
                </TooltipProvider>
            </div>
        </div>
    )
}
