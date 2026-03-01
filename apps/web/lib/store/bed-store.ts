import { Floor, Ward, Bed, BedStatus, initialFloors } from "../data/mock-floors"

let _floors: Floor[] = [...initialFloors]
let _listeners: (() => void)[] = []

function _notify() {
    _listeners.forEach((l) => l())
}

export function subscribeBeds(callback: () => void) {
    _listeners.push(callback)
    return () => {
        _listeners = _listeners.filter((l) => l !== callback)
    }
}

export function getFloors(): Floor[] {
    return _floors
}

export function getBedDetails(floorId: string, wardId: string, bedId: string): Bed | undefined {
    const floor = _floors.find(f => f.id === floorId)
    const ward = floor?.wards.find(w => w.id === wardId)
    return ward?.beds.find(b => b.id === bedId)
}

// Global lookup for backward compatibility in some components
export function getBedDetailsGlobal(bedId: string): { bed: Bed, ward: Ward, floor: Floor } | undefined {
    for (const floor of _floors) {
        for (const ward of floor.wards) {
            const bed = ward.beds.find(b => b.id === bedId)
            if (bed) return { bed, ward, floor }
        }
    }
    return undefined
}

export function assignBed(floorId: string, wardId: string, bedId: string, patientName: string, admissionId: string) {
    _floors = _floors.map(floor => {
        if (floor.id !== floorId) return floor
        return {
            ...floor,
            wards: floor.wards.map(ward => {
                if (ward.id !== wardId) return ward
                return {
                    ...ward,
                    beds: ward.beds.map(bed => {
                        if (bed.id !== bedId) return bed
                        return {
                            ...bed,
                            status: "Occupied" as BedStatus,
                            patientName,
                            admissionId,
                            history: [
                                { action: "Assigned", timestamp: new Date().toISOString(), details: `Assigned to ${patientName}` },
                                ...bed.history
                            ]
                        }
                    })
                }
            })
        }
    })
    _notify()
}

export function updateBedStatus(floorId: string, wardId: string, bedId: string, newStatus: BedStatus, notes?: string) {
    _floors = _floors.map(floor => {
        if (floor.id !== floorId) return floor
        return {
            ...floor,
            wards: floor.wards.map(ward => {
                if (ward.id !== wardId) return ward
                return {
                    ...ward,
                    beds: ward.beds.map(bed => {
                        if (bed.id !== bedId) return bed

                        const actionMap: Record<BedStatus, string> = {
                            "Available": "Marked Available",
                            "Occupied": "Marked Occupied",
                            "Cleaning": "Marked Cleaning",
                            "Reserved": "Reserved",
                            "Maintenance": "Maintenance"
                        }

                        // Clear patient data when bed becomes Available or Maintenance
                        const shouldClearPatient = newStatus === "Available" || newStatus === "Maintenance"

                        return {
                            ...bed,
                            status: newStatus,
                            patientName: shouldClearPatient ? undefined : bed.patientName,
                            admissionId: shouldClearPatient ? undefined : bed.admissionId,
                            history: [
                                { action: actionMap[newStatus], timestamp: new Date().toISOString(), details: notes },
                                ...bed.history
                            ]
                        }
                    })
                }
            })
        }
    })
    _notify()
}

export function transferBed(oldFloorId: string, oldWardId: string, oldBedId: string, newFloorId: string, newWardId: string, newBedId: string, reason?: string) {
    const oldBed = getBedDetails(oldFloorId, oldWardId, oldBedId)
    if (!oldBed || !oldBed.patientName || !oldBed.admissionId) return

    // Atomic operation across potentially different floors
    _floors = _floors.map(floor => {
        let updatedFloor = { ...floor }

        // Needs clearing old bed?
        if (floor.id === oldFloorId) {
            updatedFloor.wards = updatedFloor.wards.map(ward => {
                if (ward.id !== oldWardId) return ward
                return {
                    ...ward,
                    beds: ward.beds.map(bed => {
                        if (bed.id !== oldBedId) return bed
                        return {
                            ...bed,
                            status: "Cleaning" as BedStatus,
                            patientName: undefined,
                            admissionId: undefined,
                            nicuData: undefined,
                            history: [
                                { action: "Transferred Out", timestamp: new Date().toISOString(), details: `Transferred to ${newBedId}` },
                                ...bed.history
                            ]
                        }
                    })
                }
            })
        }

        // Needs occupying new bed?
        if (floor.id === newFloorId) {
            // Re-fetch wards to ensure we don't overwrite if source and target are on same floor
            const targetWards = updatedFloor.id === oldFloorId ? updatedFloor.wards : floor.wards

            updatedFloor.wards = targetWards.map(ward => {
                if (ward.id !== newWardId) return ward
                return {
                    ...ward,
                    beds: ward.beds.map(bed => {
                        if (bed.id !== newBedId) return bed
                        return {
                            ...bed,
                            status: "Occupied" as BedStatus,
                            patientName: oldBed.patientName,
                            admissionId: oldBed.admissionId,
                            nicuData: oldBed.nicuData,
                            history: [
                                { action: "Transferred In", timestamp: new Date().toISOString(), details: `Transferred from ${oldBedId}. Reason: ${reason || 'N/A'}` },
                                ...bed.history
                            ]
                        }
                    })
                }
            })
        }

        return updatedFloor
    })
    _notify()
}
