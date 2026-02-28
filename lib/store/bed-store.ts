import { Ward, Bed, BedStatus, initialWards } from "../data/mock-beds"

let _wards: Ward[] = [...initialWards]
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

export function getWards(): Ward[] {
    return _wards
}

export function getBedDetails(wardId: string, bedId: string): Bed | undefined {
    const ward = _wards.find(w => w.id === wardId)
    return ward?.beds.find(b => b.id === bedId)
}

export function assignBed(wardId: string, bedId: string, patientName: string, admissionId: string) {
    _wards = _wards.map(ward => {
        if (ward.id !== wardId) return ward
        return {
            ...ward,
            beds: ward.beds.map(bed => {
                if (bed.id !== bedId) return bed
                return {
                    ...bed,
                    status: "OCCUPIED" as BedStatus,
                    patientName,
                    admissionId,
                    history: [
                        { action: "ASSIGNED", timestamp: new Date().toISOString(), details: `Assigned to ${patientName}` },
                        ...bed.history
                    ]
                }
            })
        }
    })
    _notify()
}

export function updateBedStatus(wardId: string, bedId: string, newStatus: BedStatus, notes?: string) {
    _wards = _wards.map(ward => {
        if (ward.id !== wardId) return ward
        return {
            ...ward,
            beds: ward.beds.map(bed => {
                if (bed.id !== bedId) return bed

                const actionMap: Record<BedStatus, string> = {
                    AVAILABLE: "MARKED_AVAILABLE",
                    OCCUPIED: "MARKED_OCCUPIED",
                    CLEANING: "MARKED_CLEANING",
                    RESERVED: "RESERVED",
                    MAINTENANCE: "MAINTENANCE"
                }

                const isAvailableNow = newStatus === "AVAILABLE"

                return {
                    ...bed,
                    status: newStatus,
                    patientName: isAvailableNow ? undefined : bed.patientName,
                    admissionId: isAvailableNow ? undefined : bed.admissionId,
                    history: [
                        { action: actionMap[newStatus], timestamp: new Date().toISOString(), details: notes },
                        ...bed.history
                    ]
                }
            })
        }
    })
    _notify()
}

export function transferBed(oldWardId: string, oldBedId: string, newWardId: string, newBedId: string, reason?: string) {
    const oldBed = getBedDetails(oldWardId, oldBedId)
    if (!oldBed || !oldBed.patientName || !oldBed.admissionId) return

    // Need to atomic operation across two wards potentially
    _wards = _wards.map(ward => {
        // Process removals from old ward
        let updatedWard = { ...ward }
        if (ward.id === oldWardId) {
            updatedWard.beds = updatedWard.beds.map(bed => {
                if (bed.id !== oldBedId) return bed
                return {
                    ...bed,
                    status: "CLEANING" as BedStatus, // Assuming it goes strictly to cleaning after transfer
                    patientName: undefined,
                    admissionId: undefined,
                    nicuData: undefined,
                    history: [
                        { action: "TRANSFERRED_OUT", timestamp: new Date().toISOString(), details: `Transferred to ${newBedId}` },
                        ...bed.history
                    ]
                }
            })
        }

        // Process additions to new ward
        if (ward.id === newWardId) {
            updatedWard.beds = updatedWard.beds.map(bed => {
                if (bed.id !== newBedId) return bed
                return {
                    ...bed,
                    status: "OCCUPIED" as BedStatus,
                    patientName: oldBed.patientName,
                    admissionId: oldBed.admissionId,
                    nicuData: oldBed.nicuData,
                    history: [
                        { action: "TRANSFERRED_IN", timestamp: new Date().toISOString(), details: `Transferred from ${oldBedId}. Reason: ${reason || 'N/A'}` },
                        ...bed.history
                    ]
                }
            })
        }

        return updatedWard
    })
    _notify()
}
