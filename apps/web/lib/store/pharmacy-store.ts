// ─────────────────────────────────────────────────────────────────────────────
// lib/store/pharmacy-store.ts
// Pharmacy dispensing workflow store.
// ─────────────────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react"
import type { PharmacyOrder } from "../data/pharmacy"
import { mockPharmacyOrders } from "../data/pharmacy"
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
        if (item.dispensedQty > 0 && order.admissionId) {
            // Find the running bill for this admission and add the item.
            // We'll call the API directly instead of the old billingActions.
            import('../api/billing').then(api => {
                // First we need to find the bill id for this admission
                const query = new URLSearchParams({ admissionId: order.admissionId, status: 'DRAFT' });
                fetch(`/api/billing?${query}`).then(r => r.json()).then(res => {
                    const bill = res?.data?.[0];
                    if (bill) {
                        api.addBillItem(bill.id, {
                            serviceId: item.id, // Use item.id as serviceId for now
                            quantity: item.dispensedQty, // Use dispensedQty from the item
                            discountPercent: 0
                        }).catch(console.error);
                    }
                }).catch(console.error);
            });
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
