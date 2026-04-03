"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Search, Trash2 } from "lucide-react"

import type { ApiMedication } from "@/lib/api/pharmacy"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChipSelector } from "@/components/hospital/chip-selector"

export interface PrescriptionRowData {
  id: string
  drugId: string
  drugName: string
  genericName: string
  dose: string
  frequency: string
  duration: string
  route: string
  instructions: string
}

export interface PrescriptionDrugSuggestion {
  key: string
  drugId: string
  drugName: string
  genericName: string
  form?: string
  strength?: string
  medication?: ApiMedication
  source: "inventory" | "mock"
}

interface MockDrugSuggestion {
  drugName: string
  genericName: string
  form: string
}

const MOCK_DRUGS: MockDrugSuggestion[] = [
  { drugName: "Paracetamol Syrup", genericName: "Acetaminophen", form: "Syrup" },
  { drugName: "Paracetamol Drops", genericName: "Acetaminophen", form: "Drops" },
  { drugName: "Amoxicillin Syrup", genericName: "Amoxicillin", form: "Syrup" },
  { drugName: "Cefixime Drops", genericName: "Cefixime", form: "Drops" },
]

const FREQUENCY_OPTIONS = [
  { label: "OD", value: "OD" },
  { label: "BD", value: "BD" },
  { label: "TDS", value: "TDS" },
  { label: "QID", value: "QID" },
]

const DURATION_OPTIONS = [
  { label: "3d", value: "3d" },
  { label: "5d", value: "5d" },
  { label: "7d", value: "7d" },
  { label: "10d", value: "10d" },
]

interface PrescriptionRowProps {
  row: PrescriptionRowData
  index: number
  inventory: ApiMedication[]
  isLast: boolean
  usedDrugIds: string[]
  usedDrugNames: string[]
  onChange: (id: string, field: keyof PrescriptionRowData, value: string) => void
  onDrugSelect: (id: string, suggestion: PrescriptionDrugSuggestion) => void
  onRemove: (id: string) => void
  onFocusRow: (rowId: string) => void
  registerRef: (rowId: string, field: string, el: HTMLInputElement | null) => void
  onFieldKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, rowId: string, field: string) => void
  overdoseMessage?: string | null
  note?: string | null
  inventoryMissing?: boolean
}

function buildInventorySuggestions(inventory: ApiMedication[], query: string) {
  const normalized = query.trim().toLowerCase()

  return inventory
    .filter((item) => item.status !== "INACTIVE")
    .filter((item) => {
      if (!normalized) return true
      return (
        item.drugName.toLowerCase().includes(normalized) ||
        item.genericName.toLowerCase().includes(normalized) ||
        `${item.form} ${item.strength}`.toLowerCase().includes(normalized)
      )
    })
    .slice(0, 8)
    .map<PrescriptionDrugSuggestion>((item) => ({
      key: `inventory-${item.id}`,
      drugId: item.id,
      drugName: item.drugName,
      genericName: item.genericName,
      form: item.form,
      strength: item.strength,
      medication: item,
      source: "inventory",
    }))
}

function buildMockSuggestions(inventory: ApiMedication[], query: string) {
  const normalized = query.trim().toLowerCase()

  return MOCK_DRUGS.filter((item) => {
    if (!normalized) return true
    return (
      item.drugName.toLowerCase().includes(normalized) ||
      item.genericName.toLowerCase().includes(normalized) ||
      item.form.toLowerCase().includes(normalized)
    )
  }).map<PrescriptionDrugSuggestion>((item) => {
    const matchedInventory = inventory.find((entry) => {
      const drug = entry.drugName.toLowerCase()
      const generic = entry.genericName.toLowerCase()
      return drug.includes(item.drugName.toLowerCase().split(" ")[0]) || generic.includes(item.genericName.toLowerCase())
    })

    return {
      key: `mock-${item.drugName}`,
      drugId: matchedInventory?.id ?? "",
      drugName: matchedInventory?.drugName ?? item.drugName,
      genericName: matchedInventory?.genericName ?? item.genericName,
      form: matchedInventory?.form ?? item.form,
      strength: matchedInventory?.strength,
      medication: matchedInventory,
      source: matchedInventory ? "inventory" : "mock",
    }
  })
}

export function PrescriptionRow({
  row,
  index,
  inventory,
  isLast,
  usedDrugIds,
  usedDrugNames,
  onChange,
  onDrugSelect,
  onRemove,
  onFocusRow,
  registerRef,
  onFieldKeyDown,
  overdoseMessage,
  note,
  inventoryMissing,
}: PrescriptionRowProps) {
  const [searchQuery, setSearchQuery] = useState(row.drugName)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    setSearchQuery(row.drugName)
  }, [row.drugName])

  const suggestions = useMemo(() => {
    const inventorySuggestions = buildInventorySuggestions(inventory, searchQuery)
    const seen = new Set(inventorySuggestions.map((item) => item.drugName.toLowerCase()))
    const mockSuggestions = buildMockSuggestions(inventory, searchQuery).filter((item) => !seen.has(item.drugName.toLowerCase()))

    return [...inventorySuggestions, ...mockSuggestions].slice(0, 8)
  }, [inventory, searchQuery])

  return (
    <div className="border-b border-border/70 px-4 py-4 last:border-b-0">
      <div
        className="grid items-start gap-3"
        style={{
          gridTemplateColumns:
            "minmax(220px,2.4fr) minmax(120px,1fr) minmax(170px,1.2fr) minmax(160px,1.1fr) minmax(110px,0.8fr) minmax(220px,1.8fr) 40px",
        }}
      >
        <div className="relative">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
            <span>{index + 1}.</span>
            Drug
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={(el) => registerRef(row.id, "drug", el)}
              value={searchQuery}
              placeholder={isLast ? "Start typing a medicine" : "Medicine"}
              className="pl-9"
              onFocus={() => {
                onFocusRow(row.id)
                setDropdownOpen(true)
              }}
              onBlur={() => {
                window.setTimeout(() => setDropdownOpen(false), 120)
              }}
              onKeyDown={(event) => onFieldKeyDown(event, row.id, "drug")}
              onChange={(event) => {
                const value = event.target.value
                setSearchQuery(value)
                setDropdownOpen(true)
                onChange(row.id, "drugName", value)
              }}
            />
          </div>

          {dropdownOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg">
              {suggestions.map((suggestion) => {
                const isDuplicate = suggestion.drugId
                  ? usedDrugIds.includes(suggestion.drugId) && suggestion.drugId !== row.drugId
                  : usedDrugNames.includes(suggestion.drugName.toLowerCase()) && suggestion.drugName.toLowerCase() !== row.drugName.toLowerCase()

                return (
                  <button
                    key={suggestion.key}
                    type="button"
                    className={cn(
                      "flex w-full items-start justify-between gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/50",
                      isDuplicate && "cursor-not-allowed opacity-50"
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      if (isDuplicate) return
                      onDrugSelect(row.id, suggestion)
                      setSearchQuery(suggestion.drugName)
                      setDropdownOpen(false)
                    }}
                    disabled={isDuplicate}
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-foreground">{suggestion.drugName}</div>
                      <div className="text-xs text-muted-foreground">
                        {suggestion.genericName}
                        {suggestion.form ? ` • ${suggestion.form}` : ""}
                        {suggestion.strength ? ` ${suggestion.strength}` : ""}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground">
                      {suggestion.medication ? (
                        <>
                          <div>Stock {suggestion.medication.stockAvailable}</div>
                          <div className="text-emerald-600">Inventory</div>
                        </>
                      ) : (
                        <div className="text-amber-600">Mock</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {inventoryMissing && (
            <div className="mt-1 text-xs text-amber-700">
              Select an inventory-backed medicine to save this row.
            </div>
          )}
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
            Dose
          </div>
          <Input
            ref={(el) => registerRef(row.id, "dose", el)}
            value={row.dose}
            placeholder="e.g. 5 ml"
            onFocus={() => onFocusRow(row.id)}
            onKeyDown={(event) => onFieldKeyDown(event, row.id, "dose")}
            onChange={(event) => onChange(row.id, "dose", event.target.value)}
          />
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
            Frequency
          </div>
          <ChipSelector
            options={FREQUENCY_OPTIONS}
            selected={row.frequency}
            onChange={(value) => onChange(row.id, "frequency", value)}
          />
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
            Duration
          </div>
          <ChipSelector
            options={DURATION_OPTIONS}
            selected={row.duration}
            onChange={(value) => onChange(row.id, "duration", value)}
          />
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
            Route
          </div>
          <Select value={row.route || "Oral"} onValueChange={(value) => onChange(row.id, "route", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Route" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Oral">Oral</SelectItem>
              <SelectItem value="IV">IV</SelectItem>
              <SelectItem value="IM">IM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
            Instructions
          </div>
          <Input
            ref={(el) => registerRef(row.id, "instructions", el)}
            value={row.instructions}
            placeholder="After food, before sleep..."
            onFocus={() => onFocusRow(row.id)}
            onKeyDown={(event) => onFieldKeyDown(event, row.id, "instructions")}
            onChange={(event) => onChange(row.id, "instructions", event.target.value)}
          />
        </div>

        <div className="flex items-center justify-end pt-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onRemove(row.id)}
            disabled={!row.drugName && !row.dose && !row.instructions}
            aria-label={`Remove row ${index + 1}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {(note || overdoseMessage) && (
        <div className="mt-3 space-y-2 pl-1">
          {overdoseMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {overdoseMessage}
            </div>
          )}
          {note && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="mt-0.5 size-3.5 text-emerald-600" />
              <span>{note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}