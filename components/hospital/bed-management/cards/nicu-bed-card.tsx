import { StandardBedCardProps } from "./standard-bed-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, ArrowRightLeft, Brush, AlertTriangle, Baby, CheckIcon as LucideCheckIcon, HeartPulse, User, Clock } from "lucide-react"
import { updateBedStatus } from "@/lib/store/bed-store"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { AssignBedModal } from "../modals/assign-bed-modal"
import { TransferBedModal } from "../modals/transfer-bed-modal"
import { ActivityLogSheet } from "../activity-log-sheet"

const statusConfig = {
    AVAILABLE: { label: "Available", color: "text-success", bg: "bg-success/10", border: "border-success/30", icon: CheckIcon },
    OCCUPIED: { label: "Occupied", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: User },
    CLEANING: { label: "Cleaning", color: "text-yellow-600 dark:text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Brush },
    RESERVED: { label: "Reserved", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Clock },
    MAINTENANCE: { label: "Maintenance", color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: AlertTriangle }
}

function CheckIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

export function NicuBedCard({ bed, wardId, wards }: StandardBedCardProps) {
    const [showAssign, setShowAssign] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)
    const [showActivity, setShowActivity] = useState(false)

    const config = statusConfig[bed.status]
    const StatusIcon = config.icon

    return (
        <>
            <div className={cn(
                "flex flex-col rounded-xl border bg-card transition-all overflow-hidden h-full shadow-sm",
                bed.status === "OCCUPIED" && bed.nicuData?.riskLevel === "HIGH" ? "border-destructive/40 ring-1 ring-destructive/20" : config.border
            )}>
                {/* Header */}
                <div className={cn("px-4 py-2.5 flex items-center justify-between border-b border-border/40", config.bg)}>
                    <div className="flex items-center gap-2">
                        <Baby className={cn("size-4", config.color)} />
                        <span className="font-bold text-sm">{bed.id}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] gap-1 px-1.5 py-0 uppercase font-bold", config.color, config.border, bed.status === "OCCUPIED" && "bg-background")}>
                        <StatusIcon className="size-3" />
                        {config.label}
                    </Badge>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-center gap-2">
                    {bed.status === "OCCUPIED" && bed.patientName ? (
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
                                        bed.nicuData.riskLevel === "MODERATE" && "text-warning-foreground border-warning/30 bg-warning/10",
                                        bed.nicuData.riskLevel === "LOW" && "text-success border-success/30 bg-success/10"
                                    )}>
                                        {bed.nicuData.riskLevel} Risk
                                    </Badge>
                                )}
                            </div>
                        </>
                    ) : bed.status === "CLEANING" ? (
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
                    {bed.status === "AVAILABLE" && (
                        <Button size="sm" variant="secondary" className="w-full text-xs h-8" onClick={() => setShowAssign(true)}>
                            Admit Neonate
                        </Button>
                    )}

                    {bed.status === "OCCUPIED" && (
                        <>
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-medium text-muted-foreground" onClick={() => setShowActivity(true)}>
                                <Activity className="size-3.5 mr-1.5" /> Activity
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs font-medium text-primary border-primary/20" onClick={() => setShowTransfer(true)}>
                                <ArrowRightLeft className="size-3.5 mr-1" /> Transfer
                            </Button>
                        </>
                    )}
                    {(bed.status === "CLEANING" || bed.status === "MAINTENANCE") && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-8 text-success hover:text-success border-success/30"
                            onClick={() => updateBedStatus(wardId, bed.id, "AVAILABLE")}
                        >
                            <CheckIcon className="size-3.5 mr-1.5" />
                            Mark Available
                        </Button>
                    )}
                </div>
            </div>
            <AssignBedModal bed={bed} wardId={wardId} open={showAssign} onClose={() => setShowAssign(false)} />
            <TransferBedModal bed={bed} wardId={wardId} wards={wards} open={showTransfer} onClose={() => setShowTransfer(false)} />
            <ActivityLogSheet bed={bed} wardName={wards.find(w => w.id === wardId)?.name || "NICU"} open={showActivity} onClose={() => setShowActivity(false)} />
        </>
    )
}
