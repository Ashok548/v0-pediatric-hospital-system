"use client"

import { useState, useEffect } from "react"
import { Bed, Floor } from "@/lib/data/mock-floors"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Baby, Activity, ArrowRightLeft, Brush, MoreHorizontal } from "lucide-react"
import { updateBedStatus } from "@/lib/store/bed-store"
import { cn } from "@/lib/utils"
import { AssignBedModal } from "../modals/assign-bed-modal"
import { TransferBedModal } from "../modals/transfer-bed-modal"
import { ActivityLogSheet } from "../activity-log-sheet"
import { bedStatusConfig, CheckIcon, allowedTransitions } from "../bed-card-utils"
import type { BedStatus } from "@/lib/data/mock-floors"
import type { StandardBedCardProps } from "./standard-bed-card"

export function NicuBedCard({ bed, floorId, wardId, floors }: StandardBedCardProps) {
    const [showAssign, setShowAssign] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)
    const [showActivity, setShowActivity] = useState(false)

    const config = bedStatusConfig[bed.status]
    const StatusIcon = config.icon

    const floor = floors.find(f => f.id === floorId)
    const wardName = floor?.wards.find(w => w.id === wardId)?.name || "NICU"

    // Fix #7: Transitions available from the current status
    const transitions = allowedTransitions[bed.status] ?? []

    return (
        <>
            <div className={cn(
                "flex flex-col rounded-xl border bg-card transition-all overflow-hidden h-full shadow-sm",
                bed.status === "Occupied" && bed.nicuData?.riskLevel === "HIGH" ? "border-destructive/40 ring-1 ring-destructive/20" : config.border
            )}>
                {/* Header */}
                <div className={cn("px-4 py-2.5 flex items-center justify-between border-b border-border/40", config.bg)}>
                    <div className="flex items-center gap-2">
                        <Baby className={cn("size-4", config.color)} />
                        <span className="font-bold text-sm">{bed.id}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={cn("text-[10px] gap-1 px-1.5 py-0 uppercase font-bold", config.color, config.border, bed.status === "Occupied" && "bg-background")}>
                            <StatusIcon className="size-3" />
                            {config.label}
                        </Badge>
                        {/* Fix #7: Overflow menu for status transitions */}
                        {transitions.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md">
                                        <MoreHorizontal className="size-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {transitions.map((status) => {
                                        const c = bedStatusConfig[status]
                                        const Icon = c.icon
                                        return (
                                            <DropdownMenuItem
                                                key={status}
                                                className={cn("text-xs cursor-pointer", c.color)}
                                                onClick={() => updateBedStatus(floorId, wardId, bed.id, status as BedStatus)}
                                            >
                                                <Icon className="size-3.5 mr-2" />
                                                Mark {c.label}
                                            </DropdownMenuItem>
                                        )
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-center gap-2">
                    {bed.status === "Occupied" && bed.patientName ? (
                        <>
                            <div className="flex flex-col">
                                <span className="font-bold text-base line-clamp-1 leading-tight">{bed.nicuData?.babyName || bed.patientName}</span>
                                <span className="text-xs text-muted-foreground mt-0.5">{bed.nicuData?.gestationalAge || "N/A"}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                {bed.nicuData?.riskLevel && (
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] uppercase tracking-wider",
                                        bed.nicuData.riskLevel === "HIGH" && "text-destructive border-destructive/30 bg-destructive/10",
                                        bed.nicuData.riskLevel === "MODERATE" && "text-yellow-700 border-yellow-300 bg-yellow-50",
                                        bed.nicuData.riskLevel === "LOW" && "text-success border-success/30 bg-success/10"
                                    )}>
                                        {bed.nicuData.riskLevel} Risk
                                    </Badge>
                                )}
                            </div>
                        </>
                    ) : bed.status === "Cleaning" ? (
                        <div className="flex flex-col items-center text-center justify-center text-muted-foreground py-2">
                            <Brush className="size-6 mb-2 text-yellow-500/50" />
                            <span className="text-sm font-medium">Incubator Cleaning</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center justify-center text-muted-foreground py-2">
                            <Baby className="size-6 mb-2 text-muted-foreground/30" />
                            <span className="text-sm font-medium">Ready for Neonate</span>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-3 py-2 border-t border-border/40 bg-muted/30 flex items-center justify-end gap-2">
                    {bed.status === "Available" && (
                        <Button size="sm" variant="secondary" className="w-full text-xs h-8" onClick={() => setShowAssign(true)}>
                            Admit Neonate
                        </Button>
                    )}
                    {bed.status === "Occupied" && (
                        <>
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-medium text-muted-foreground" onClick={() => setShowActivity(true)}>
                                <Activity className="size-3.5 mr-1.5" /> Activity
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs font-medium text-primary border-primary/20" onClick={() => setShowTransfer(true)}>
                                <ArrowRightLeft className="size-3.5 mr-1" /> Transfer
                            </Button>
                        </>
                    )}
                    {(bed.status === "Cleaning" || bed.status === "Maintenance") && (
                        <Button
                            size="sm" variant="outline"
                            className="w-full text-xs h-8 text-success hover:text-success border-success/30"
                            onClick={() => updateBedStatus(floorId, wardId, bed.id, "Available")}
                        >
                            <CheckIcon className="size-3.5 mr-1.5" />
                            Mark Available
                        </Button>
                    )}
                </div>
            </div>

            {showAssign && (
                <AssignBedModal bed={bed} floorId={floorId} wardId={wardId} floors={floors} open={showAssign} onClose={() => setShowAssign(false)} />
            )}
            {showTransfer && (
                <TransferBedModal bed={bed} floorId={floorId} wardId={wardId} floors={floors} open={showTransfer} onClose={() => setShowTransfer(false)} />
            )}
            <ActivityLogSheet bed={bed} wardName={wardName} open={showActivity} onClose={() => setShowActivity(false)} />
        </>
    )
}
