import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import type { ApiBed } from "@/lib/types/admission"
import { Activity } from "lucide-react"

interface ActivityLogSheetProps {
    bed: ApiBed | null
    wardName: string
    open: boolean
    onClose: () => void
}

export function ActivityLogSheet({ bed, wardName, open, onClose }: ActivityLogSheetProps) {
    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md">
                <SheetHeader className="pb-4 border-b border-border mb-6">
                    <SheetTitle>Bed Activity Log</SheetTitle>
                    <SheetDescription>
                        History of assignments and status changes for Bed {bed?.bedNumber} in {wardName}.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="size-12 text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground text-sm font-medium">No activity history available for this bed.</p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
