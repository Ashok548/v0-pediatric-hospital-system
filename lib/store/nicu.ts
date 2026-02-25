"use client"

import type { NicuBaby } from "@/lib/data/types"
import { nicuBabies as _baseNicu } from "@/lib/data/nicu"

// Mutable in-memory store — module-level singleton
let _nicuBabies: NicuBaby[] = [..._baseNicu]
const _listeners = new Set<() => void>()

// ─── Read ─────────────────────────────────────────────────────────────────────
export function getNicuBabies(): NicuBaby[] {
    return _nicuBabies
}

// ─── Write ────────────────────────────────────────────────────────────────────
export function setNicuBabies(babies: NicuBaby[]) {
    _nicuBabies = babies
    _notify()
}

export function addNicuBaby(baby: NicuBaby) {
    _nicuBabies = [baby, ..._nicuBabies]
    _notify()
}

export function removeNicuBaby(id: string) {
    _nicuBabies = _nicuBabies.filter(b => b.id !== id)
    _notify()
}

// ─── Subscribe ────────────────────────────────────────────────────────────────
export function subscribeNicu(fn: () => void): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

function _notify() {
    _listeners.forEach(fn => fn())
}
