import { Ward } from "@/lib/data/mock-beds"
import { cn } from "@/lib/utils"

interface WardSelectorProps {
    wards: Ward[]
    activeWardId: string
    onSelectWard: (id: string) => void
}

export function WardSelector({ wards, activeWardId, onSelectWard }: WardSelectorProps) {
    return (
        <div className="flex border-b border-border overflow-x-auto no-scrollbar">
            {wards.map((ward) => (
                <button
                    key={ward.id}
                    onClick={() => onSelectWard(ward.id)}
                    className={cn(
                        "px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                        activeWardId === ward.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                >
                    {ward.name}
                    <span
                        className={cn(
                            "ml-2 rounded-full px-2 py-0.5 text-xs",
                            activeWardId === ward.id
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {ward.totalBeds}
                    </span>
                </button>
            ))}
        </div>
    )
}
