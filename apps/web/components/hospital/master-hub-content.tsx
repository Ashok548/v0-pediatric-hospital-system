"use client"

import { useState } from "react"
import { Layers, LayoutList, BedDouble, Building2, IndianRupee, ShieldCheck, FileText } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MasterFloorsContent } from "@/components/hospital/master-floors-content"
import { MasterWardsContent } from "@/components/hospital/master-wards-content"
import { MasterBedsContent } from "@/components/hospital/master-beds-content"
import { MasterDepartmentsContent } from "@/components/hospital/master-departments-content"
import { MasterServicesContent } from "@/components/hospital/master-services-content"
import { MasterInsuranceContent } from "@/components/hospital/master-insurance-content"
import { MasterTariffsContent } from "@/components/hospital/master-tariffs-content"

const TABS = [
    {
        value: "floors",
        label: "Floors",
        icon: Layers,
        description: "Configure hospital floor structure",
        content: MasterFloorsContent,
    },
    {
        value: "wards",
        label: "Wards",
        icon: LayoutList,
        description: "Define wards by floor, type, and bed capacity",
        content: MasterWardsContent,
    },
    {
        value: "beds",
        label: "Beds",
        icon: BedDouble,
        description: "Manage individual beds across wards",
        content: MasterBedsContent,
    },
    {
        value: "departments",
        label: "Departments",
        icon: Building2,
        description: "Clinical and administrative departments",
        content: MasterDepartmentsContent,
    },
    {
        value: "services",
        label: "Services",
        icon: IndianRupee,
        description: "Billable services and charge items",
        content: MasterServicesContent,
    },
    {
        value: "insurance",
        label: "Insurance",
        icon: ShieldCheck,
        description: "Insurance providers, TPAs, and claim settings",
        content: MasterInsuranceContent,
    },
    {
        value: "tariffs",
        label: "Tariffs",
        icon: FileText,
        description: "Pricing plans by ward type and effective date",
        content: MasterTariffsContent,
    },
] as const

type TabValue = (typeof TABS)[number]["value"]

export function MasterHubContent() {
    const [activeTab, setActiveTab] = useState<TabValue>("floors")

    const active = TABS.find((t) => t.value === activeTab)!

    return (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="space-y-4">
            {/* Tab navigation */}
            <TabsList className="h-auto flex-wrap gap-1 bg-muted/60 p-1 rounded-xl">
                {TABS.map(({ value, label, icon: Icon }) => (
                    <TabsTrigger
                        key={value}
                        value={value}
                        id={`master-tab-${value}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* Active tab header */}
            <div className="flex items-center gap-3 pb-1 border-b border-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <active.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">{active.label}</h2>
                    <p className="text-xs text-muted-foreground">{active.description}</p>
                </div>
            </div>

            {/* Tab content panels */}
            {TABS.map(({ value, content: Content }) => (
                <TabsContent key={value} value={value} className="mt-0">
                    <Content />
                </TabsContent>
            ))}
        </Tabs>
    )
}
