import { StandardBedCard } from "./cards/standard-bed-card"
import { NicuBedCard } from "./cards/nicu-bed-card"
import type { ApiFloorWithWards, ApiWardWithBeds, ApiAdmission } from "@/lib/types/admission"

interface BedGridProps {
    floor: ApiFloorWithWards
    ward: ApiWardWithBeds
    floors: ApiFloorWithWards[]
    admissionsMap: Map<string, ApiAdmission>
}

export function BedGrid({ floor, ward, floors, admissionsMap }: BedGridProps) {
    const isNicu = ward.type === "NICU"

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-2">
            {ward.beds.map((bed) => {
                const admission = admissionsMap.get(bed.id)
                if (isNicu) {
                    return <NicuBedCard key={bed.id} bed={bed} admission={admission} floorId={floor.id} wardId={ward.id} floors={floors} />
                }
                return <StandardBedCard key={bed.id} bed={bed} admission={admission} floorId={floor.id} wardId={ward.id} floors={floors} />
            })}
        </div>
    )
}
