"use client"

import type { ApiBed, ApiFloorWithWards, ApiAdmission } from "@/lib/types/admission"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { BedDouble, Activity, ArrowRightLeft, Brush, Key, MoreHorizontal } from "lucide-react"
import { useUpdateBedStatus } from "@/lib/api/admissions"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ActivityLogSheet } from "../activity-log-sheet"
import { bedStatusConfig, CheckIcon, allowedTransitions } from "../bed-card-utils"

export interface StandardBedCardProps {
    bed: ApiBed
    admission?: ApiAdmission
    floorId: string
    wardId: string
    floors: ApiFloorWithWards[]
}

export function StandardBedCard({ bed, admission, floorId, wardId, floors }: StandardBedCardProps) {
    const router = useRouter()
    const [showActivity, setShowActivity] = useState(false)
    const updateStatus = useUpdateBedStatus()

    const config = bedStatusConfig[bed.status] || bedStatusConfig["AVAILABLE"]
    const StatusIcon = config.icon

    const floor = floors.find(f => f.id === floorId)
    const wardName = floor?.wards.find(w => w.id === wardId)?.name || "Ward"

    // Transitions available from the current status (for overflow menu)
    const transitions = allowedTransitions[bed.status] ?? []

    return (
        <>
            <div className={cn(
                "flex flex-col rounded-xl border bg-card transition-all overflow-hidden h-full",
                config.border
            )}>
                {/* Header */}
                <div className={cn("px-4 py-3 flex items-center justify-between border-b border-border/40", config.bg)}>
                    <div className="flex items-center gap-2">
                        <BedDouble className={cn("size-4", config.color)} />
                        <span className="font-semibold text-sm">{bed.bedNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={cn("text-[10px] gap-1 px-1.5 py-0 uppercase font-bold", config.color, config.border)}>
                            <StatusIcon className="size-3" />
                            {config.label}
                        </Badge>
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
                                        if (!c) return null
                                        const Icon = c.icon
                                        return (
                                            <DropdownMenuItem
                                                key={status}
                                                className={cn("text-xs cursor-pointer", c.color)}
                                                onClick={() => updateStatus(bed.id, status)}
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
                <div className="p-4 flex-1 flex flex-col justify-center">
                    {bed.status === "OCCUPIED" && admission ? (
                        <div className="flex flex-col">
                            <span className="font-bold text-base truncate">{admission.patient.firstName} {admission.patient.lastName}</span>
                            <span className="text-xs text-muted-foreground mt-0.5 font-mono">{admission.admissionNumber}</span>
                        </div>
                    ) : bed.status === "RESERVED" ? (
                        <div className="flex flex-col items-center text-center justify-center text-muted-foreground py-2">
                            <Key className="size-6 mb-2 text-blue-500/50" />
                            <span className="text-sm font-medium">Reserved for incoming ADM</span>
                        </div>
                    ) : bed.status === "CLEANING" ? (
                        <div className="flex flex-col items-center text-center justify-center text-muted-foreground py-2">
                            <Brush className="size-6 mb-2 text-yellow-500/50" />
                            <span className="text-sm font-medium">Housekeeping required</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center justify-center text-muted-foreground py-2">
                            <BedDouble className="size-6 mb-2 text-muted-foreground/30" />
                            <span className="text-sm font-medium">Ready for Patient</span>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-3 py-2 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-2">
                    {bed.status === "AVAILABLE" && (
                        <Button size="sm" variant="secondary" className="w-full text-xs h-8" onClick={() => router.push(`/admissions/new?bedId=${bed.id}&wardId=${wardId}`)}>
                            Assign Patient
                        </Button>
                    )}

                    {bed.status === "OCCUPIED" && (
                        <>
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => setShowActivity(true)}>
                                <Activity className="size-3.5 mr-1" /> View Activity
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs text-primary border-primary/20" onClick={() => {
                                if (admission?.id) router.push(`/admissions/${admission.id}/transfer`)
                            }}>
                                <ArrowRightLeft className="size-3.5 mr-1" /> Transfer
                            </Button>
                        </>
                    )}

                    {(bed.status === "CLEANING" || bed.status === "MAINTENANCE") && (
                        <Button
                            size="sm" variant="outline"
                            className="w-full text-xs h-8 text-success hover:text-success"
                            onClick={() => updateStatus(bed.id, "AVAILABLE")}
                        >
                            <CheckIcon className="size-3.5 mr-1.5" />
                            Mark Available
                        </Button>
                    )}

                    {bed.status === "RESERVED" && (
                        <Button
                            size="sm" variant="outline"
                            className="w-full text-xs h-8 text-destructive hover:text-destructive"
                            onClick={() => updateStatus(bed.id, "AVAILABLE")}
                        >
                            Cancel Reservation
                        </Button>
                    )}
                </div>
            </div>

            <ActivityLogSheet bed={bed} wardName={wardName} open={showActivity} onClose={() => setShowActivity(false)} />
        </>
    )
}
