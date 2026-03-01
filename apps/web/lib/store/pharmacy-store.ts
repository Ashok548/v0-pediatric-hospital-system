// ─────────────────────────────────────────────────────────────────────────────
// lib/store/pharmacy-store.ts
// Pharmacy dispensing workflow store.
// On dispense, auto-pushes charges to the IP billing store.
// ─────────────────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react"
import type { PharmacyOrder } from "../data/pharmacy"
import { mockPharmacyOrders } from "../data/pharmacy"
import { billingActions } from "./billing-store"
import { logActivity } from "./activity-store"

// ─── State ────────────────────────────────────────────────────────────────────
let _orders: PharmacyOrder[] = [...mockPharmacyOrders]
const _listeners = new Set<() => void>()

function emit() {
    _orders = [..._orders]
    _listeners.forEach(fn => fn())
}
function subscribe(fn: () => void) {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}
function getSnapshot() { return _orders }

// ─── Actions ──────────────────────────────────────────────────────────────────
export type DispensedItemInput = { itemId: string; dispensedQty: number }

export function dispenseOrder(
    orderId: string,
    dispensedItems: DispensedItemInput[],
    dispensedBy: string
): { success: boolean; error?: string } {
    const order = _orders.find(o => o.id === orderId)
    if (!order) return { success: false, error: "Order not found" }
    if (order.status === "dispensed") return { success: false, error: "Already dispensed" }

    const updatedItems = order.items.map(item => {
        const di = dispensedItems.find(d => d.itemId === item.id)
        return di ? { ...item, dispensedQty: di.dispensedQty } : item
    })

    const allFull = updatedItems.every(i => i.dispensedQty >= i.prescribedQty)
    const newStatus: PharmacyOrder["status"] = allFull ? "dispensed" : "partial"

    _orders = _orders.map(o =>
        o.id !== orderId ? o : {
            ...o,
            status: newStatus,
            dispensedAt: new Date().toISOString(),
            dispensedBy,
            items: updatedItems,
        }
    )
    emit()

    // ── Auto-push charges to IP Billing ──────────────────────────────────────
    updatedItems.forEach(item => {
        if (item.dispensedQty > 0) {
            billingActions.addChargeToIpBill(order.admissionId, {
                id: `PHARM-CHARGE-${item.id}-${Date.now()}`,
                category: "Pharmacy",
                description: `${item.drugName} (${item.strength}) × ${item.dispensedQty} ${item.unit}`,
                quantity: item.dispensedQty,
                unitPrice: item.unitPrice,
                discountPercent: 0,
                taxPercent: 0,
            })
        }
    })

    // ── Audit Log ─────────────────────────────────────────────────────────────
    logActivity({
        patientId: order.patientId,
        admissionId: order.admissionId,
        timestamp: new Date().toISOString(),
        actor: dispensedBy,
        category: "pharmacy",
        action: `Prescription Dispensed (${newStatus === "partial" ? "Partial" : "Full"})`,
        details: updatedItems
            .filter(i => i.dispensedQty > 0)
            .map(i => `${i.drugName} × ${i.dispensedQty} ${i.unit}`)
            .join(", "),
    })

    return { success: true }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePharmacyStore() {
    const orders = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    return {
        orders,
        pendingOrders: orders.filter(o => o.status === "pending" || o.status === "partial"),
        dispensedOrders: orders.filter(o => o.status === "dispensed"),
        dispenseOrder,
    }
}
