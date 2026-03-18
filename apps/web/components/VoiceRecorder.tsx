"use client"

import dynamic from "next/dynamic"
import type { VoiceRecorderProps } from "@/components/VoiceRecorderClient"

const VoiceRecorderClient = dynamic(
  () => import("@/components/VoiceRecorderClient").then((mod) => mod.VoiceRecorderClient),
  {
    ssr: false,
  }
)

export type { VoiceRecorderProps }

export function VoiceRecorder(props: VoiceRecorderProps) {
  return <VoiceRecorderClient {...props} />
}
