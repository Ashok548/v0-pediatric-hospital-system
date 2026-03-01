"use client"

import {
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Computed hex colors -- Recharts does NOT support CSS variables
const COLORS = {
  primary: "#2563eb",
  p3: "#fca5a5",
  p15: "#fde68a",
  p50: "#bbf7d0",
  p85: "#fde68a",
  p97: "#fca5a5",
  p3Fill: "rgba(252, 165, 165, 0.08)",
  p15Fill: "rgba(253, 230, 138, 0.10)",
  p50Fill: "rgba(187, 247, 208, 0.12)",
  p85Fill: "rgba(253, 230, 138, 0.10)",
  p97Fill: "rgba(252, 165, 165, 0.08)",
  grid: "#e5e7eb",
  dangerZone: "rgba(239, 68, 68, 0.06)",
}

export interface GrowthDataPoint {
  month: number
  value: number
  p3: number
  p15: number
  p50: number
  p85: number
  p97: number
}

interface GrowthPercentileChartProps {
  title: string
  description: string
  unit: string
  data: GrowthDataPoint[]
  currentPercentile: number
  status: "normal" | "warning" | "critical"
}

export function GrowthPercentileChart({
  title,
  description,
  unit,
  data,
  currentPercentile,
  status,
}: GrowthPercentileChartProps) {
  const statusColor =
    status === "critical"
      ? "#dc2626"
      : status === "warning"
        ? "#d97706"
        : "#16a34a"

  const statusLabel =
    status === "critical"
      ? "Below 3rd"
      : status === "warning"
        ? "Below 15th"
        : "Normal"

  const chartConfig = {
    value: {
      label: "Measured",
      color: COLORS.primary,
    },
    p3: { label: "3rd %ile", color: COLORS.p3 },
    p15: { label: "15th %ile", color: COLORS.p15 },
    p50: { label: "50th %ile", color: COLORS.p50 },
    p85: { label: "85th %ile", color: COLORS.p85 },
    p97: { label: "97th %ile", color: COLORS.p97 },
  }

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor:
                  status === "critical"
                    ? "rgba(220,38,38,0.08)"
                    : status === "warning"
                      ? "rgba(217,119,6,0.08)"
                      : "rgba(22,163,98,0.08)",
                color: statusColor,
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
                aria-hidden="true"
              />
              {statusLabel} percentile
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Current: P{currentPercentile}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: COLORS.grid }}
                label={{ value: "Age (months)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#6b7280" }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{ value: unit, angle: -90, position: "insideLeft", offset: 16, fontSize: 11, fill: "#6b7280" }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(val) => `Month ${val}`}
                  />
                }
              />

              {/* WHO reference lines -- using Line only to avoid duplicate Area+Line dataKey conflicts */}
              <Line
                dataKey="p97"
                stroke={COLORS.p97}
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                name="97th %ile"
                legendType="line"
              />
              <Line
                dataKey="p85"
                stroke={COLORS.p85}
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                name="85th %ile"
                legendType="line"
              />
              <Line
                dataKey="p50"
                stroke={COLORS.p50}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive={false}
                name="50th %ile (Median)"
                legendType="line"
              />
              <Line
                dataKey="p15"
                stroke={COLORS.p15}
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                name="15th %ile"
                legendType="line"
              />
              <Line
                dataKey="p3"
                stroke={COLORS.p3}
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                name="3rd %ile"
                legendType="line"
              />

              {/* Patient's actual measurements -- rendered last to be on top */}
              <Line
                dataKey="value"
                stroke={COLORS.primary}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: COLORS.primary, strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 5, fill: COLORS.primary, strokeWidth: 2, stroke: "#ffffff" }}
                name="Measured"
              />

              {/* Latest reading reference line */}
              {data.length > 0 && (
                <ReferenceLine
                  x={data[data.length - 1].month}
                  stroke={COLORS.primary}
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                />
              )}

              <Legend
                verticalAlign="top"
                align="right"
                iconType="line"
                iconSize={10}
                wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
