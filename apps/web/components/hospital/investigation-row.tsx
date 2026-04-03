"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ApiLabTestProfile } from "@/lib/api/labs"
import type { ApiService } from "@/lib/api/services"

export type InvestigationType = "LAB" | "SCAN"
export type InvestigationReferenceType = "" | "LAB_PROFILE" | "IMAGING_SERVICE"

export interface InvestigationRowData {
  id: string
  testName: string
  referenceId: string
  referenceType: InvestigationReferenceType
  type: InvestigationType
  sampleType: string
  notes: string
}

export interface InvestigationSuggestion {
  key: string
  referenceId: string
  referenceType: InvestigationReferenceType
  testName: string
  type: InvestigationType
  sampleType: string
  category: string
  subtitle?: string
}

interface InvestigationRowProps {
  row: InvestigationRowData
  index: number
  profiles: ApiLabTestProfile[]
  imagingServices: ApiService[]
  isLast: boolean
  sectionType: InvestigationType
  onChange: (id: string, field: keyof InvestigationRowData, value: string) => void
  onSelect: (id: string, suggestion: InvestigationSuggestion) => void
  onRemove: (id: string) => void
  onFocusRow: (rowId: string) => void
  registerRef: (rowId: string, field: string, el: HTMLInputElement | null) => void
  onFieldKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, rowId: string, field: string) => void
}

function inferTypeFromProfile(profile: ApiLabTestProfile): InvestigationType {
  return profile.category.toUpperCase() === "IMAGING" ? "SCAN" : "LAB"
}

function buildSuggestions(
  profiles: ApiLabTestProfile[],
  imagingServices: ApiService[],
  query: string,
  type: InvestigationType
) {
  const normalized = query.trim().toLowerCase()

  if (type === "SCAN") {
    return imagingServices
      .filter((service) => service.status === "ACTIVE")
      .filter((service) => {
        if (!normalized) return true
        return (
          service.name.toLowerCase().includes(normalized) ||
          service.code.toLowerCase().includes(normalized) ||
          service.category.toLowerCase().includes(normalized)
        )
      })
      .slice(0, 8)
      .map<InvestigationSuggestion>((service) => ({
        key: service.id,
        referenceId: service.id,
        referenceType: "IMAGING_SERVICE",
        testName: service.name,
        type: "SCAN",
        sampleType: "Imaging",
        category: service.category,
        subtitle: service.code,
      }))
  }

  return profiles
    .filter((profile) => inferTypeFromProfile(profile) === type)
    .filter((profile) => {
      if (!normalized) return true
      return (
        profile.panelName.toLowerCase().includes(normalized) ||
        profile.category.toLowerCase().includes(normalized) ||
        profile.sampleType.toLowerCase().includes(normalized)
      )
    })
    .slice(0, 8)
    .map<InvestigationSuggestion>((profile) => ({
      key: profile.id,
      referenceId: profile.id,
      referenceType: "LAB_PROFILE",
      testName: profile.panelName,
      type: inferTypeFromProfile(profile),
      sampleType: profile.sampleType,
      category: profile.category,
    }))
}

export function InvestigationRow({
  row,
  index,
  profiles,
  imagingServices,
  isLast,
  sectionType,
  onChange,
  onSelect,
  onRemove,
  onFocusRow,
  registerRef,
  onFieldKeyDown,
}: InvestigationRowProps) {
  const [searchQuery, setSearchQuery] = useState(row.testName)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    setSearchQuery(row.testName)
  }, [row.testName])

  const suggestions = useMemo(
    () => buildSuggestions(profiles, imagingServices, searchQuery, sectionType),
    [imagingServices, profiles, searchQuery, sectionType]
  )

  return (
    <div className="border-b border-border/70 px-4 py-4 last:border-b-0">
      <div
        className="grid items-start gap-3"
        style={{
          gridTemplateColumns: "minmax(280px,2fr) minmax(260px,1.5fr) 40px",
        }}
      >
        <div className="relative">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
            <span>{index + 1}.</span>
            Test Name
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={(el) => registerRef(row.id, "test", el)}
              value={searchQuery}
              placeholder={
                isLast
                  ? sectionType === "LAB"
                    ? "Start typing a lab test"
                    : "Start typing a scan"
                  : "Test name"
              }
              className="pl-9"
              onFocus={() => {
                onFocusRow(row.id)
                setDropdownOpen(true)
              }}
              onBlur={() => {
                window.setTimeout(() => setDropdownOpen(false), 120)
              }}
              onKeyDown={(event) => onFieldKeyDown(event, row.id, "test")}
              onChange={(event) => {
                const value = event.target.value
                setSearchQuery(value)
                setDropdownOpen(true)
                onChange(row.id, "testName", value)
              }}
            />
          </div>

          {dropdownOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.key}
                  type="button"
                  className="flex w-full items-start justify-between gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/50"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onSelect(row.id, suggestion)
                    setSearchQuery(suggestion.testName)
                    setDropdownOpen(false)
                  }}
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">{suggestion.testName}</div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.subtitle ? `${suggestion.subtitle} • ` : ""}
                      {suggestion.category} • {suggestion.sampleType}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    {suggestion.type === "SCAN" ? "Scan" : "Lab"}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!!row.testName && !row.referenceId && (
            <div className="mt-1 text-xs text-muted-foreground">
              Manual entry will save without a catalog reference.
            </div>
          )}
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
            Notes
          </div>
          <Input
            ref={(el) => registerRef(row.id, "notes", el)}
            value={row.notes}
            placeholder="Fasting, contrast, bedside, urgency..."
            onFocus={() => onFocusRow(row.id)}
            onKeyDown={(event) => onFieldKeyDown(event, row.id, "notes")}
            onChange={(event) => onChange(row.id, "notes", event.target.value)}
          />
        </div>

        <div className="flex items-center justify-end pt-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onRemove(row.id)}
            disabled={!row.testName && !row.notes}
            aria-label={`Remove investigation row ${index + 1}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}