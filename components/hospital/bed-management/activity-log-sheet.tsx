import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Bed } from "@/lib/data/mock-beds"
import { Activity, Clock, LogOut, ArrowRightLeft, Brush, AlertTriangle, User, BedDouble } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ActivityLogSheetProps {
    bed: Bed | null
    wardName: string
    open: boolean
    onClose: () => void
}

function getActionIcon(action: string) {
    switch (action) {
        case "ASSIGNED": return User
        case "TRANSFERRED_IN":
        case "TRANSFERRED_OUT": return ArrowRightLeft
        case "MARKED_AVAILABLE": return BedDouble
        case "MARKED_CLEANING": return Brush
        case "RESERVED": return Clock
        case "MAINTENANCE": return AlertTriangle
        default: return Activity
    }
}

export function ActivityLogSheet({ bed, wardName, open, onClose }: ActivityLogSheetProps) {
    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md">
                <SheetHeader className="pb-4 border-b border-border mb-6">
                    <SheetTitle>Bed Activity Log</SheetTitle>
                    <SheetDescription>
                        History of assignments and status changes for Bed {bed?.id} in {wardName}.
                    </SheetDescription>
                </SheetHeader>

                {bed?.history && bed.history.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-border/40 ml-4 space-y-6">
                        {bed.history.map((log, idx) => {
                            const ActionIcon = getActionIcon(log.action)
                            const date = new Date(log.timestamp)
                            return (
                                <div key={idx} className="relative">
                                    {/* Timeline Node */}
                                    <div className="absolute -left-[35px] bg-background p-1 rounded-full border border-border mt-1">
                                        <ActionIcon className="size-4 text-primary" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground">
                                                {log.action.replace("_", " ")}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {date.toLocaleString()}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {log.details}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Activity className="size-12 text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground text-sm font-medium">No activity history available for this bed.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
