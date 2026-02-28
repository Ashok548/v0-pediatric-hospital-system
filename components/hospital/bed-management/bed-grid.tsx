import { Ward, Bed } from "@/lib/data/mock-beds"
import { StandardBedCard } from "./cards/standard-bed-card"
import { NicuBedCard } from "./cards/nicu-bed-card"

interface BedGridProps {
    ward: Ward
    wards: Ward[]
}

export function BedGrid({ ward, wards }: BedGridProps) {
    const isNicu = ward.id === "W-NICU"

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-2">
            {ward.beds.map((bed) => {
                if (isNicu) {
                    return <NicuBedCard key={bed.id} bed={bed} wardId={ward.id} wards={wards} />
                }
                return <StandardBedCard key={bed.id} bed={bed} wardId={ward.id} wards={wards} />
            })}
        </div>
    )
}
