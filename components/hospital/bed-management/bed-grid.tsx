import { Floor, Ward, Bed } from "@/lib/data/mock-floors"
import { StandardBedCard } from "./cards/standard-bed-card"
import { NicuBedCard } from "./cards/nicu-bed-card"

interface BedGridProps {
    floor: Floor
    ward: Ward
    floors: Floor[]
}

export function BedGrid({ floor, ward, floors }: BedGridProps) {
    const isNicu = ward.type === "NICU"

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-2">
            {ward.beds.map((bed) => {
                if (isNicu) {
                    return <NicuBedCard key={bed.id} bed={bed} floorId={floor.id} wardId={ward.id} floors={floors} />
                }
                return <StandardBedCard key={bed.id} bed={bed} floorId={floor.id} wardId={ward.id} floors={floors} />
            })}
        </div>
    )
}
