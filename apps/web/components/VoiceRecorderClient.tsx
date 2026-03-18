"use client"

import { useEffect, useMemo, useState } from "react"
import { useReactMediaRecorder } from "react-media-recorder"
import { AlertCircle, Loader2, Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface VoiceRecorderProps {
  onTextGenerated: (text: string) => void
  disabled?: boolean
}

export function VoiceRecorderClient({ onTextGenerated, disabled = false }: VoiceRecorderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
    error,
  } = useReactMediaRecorder({
    audio: true,
    blobPropertyBag: { type: "audio/webm" },
    mediaRecorderOptions: { mimeType: "audio/webm" },
  })

  const isRecording = status === "recording"
  const isAcquiring = status === "acquiring_media"
  const canStart = !disabled && !isUploading && !isRecording && !isAcquiring
  const canStop = !disabled && !isUploading && isRecording

  const statusLabel = useMemo(() => {
    if (isUploading) return "Transcribing..."
    if (isAcquiring) return "Requesting microphone access..."
    if (isRecording) return "Recording"
    return "Ready"
  }, [isUploading, isAcquiring, isRecording])

  useEffect(() => {
    if (!error) return

    const message = error === "permission_denied"
      ? "Microphone permission denied. Please allow microphone access and try again."
      : "Unable to access microphone. Please check browser settings and try again."

    setErrorMessage(message)
    toast.error(message)
  }, [error])

  useEffect(() => {
    if (!mediaBlobUrl) return

    let cancelled = false

    // Recording upload starts automatically right after the user presses Stop.
    const uploadAndTranscribe = async () => {
      setIsUploading(true)
      setErrorMessage(null)

      try {
        const blobResponse = await fetch(mediaBlobUrl)
        const audioBlob = await blobResponse.blob()

        if (!audioBlob.size) {
          throw new Error("Recorded audio is empty. Please record again.")
        }

        const payload = new FormData()
        payload.append("audio", new File([audioBlob], "recording.webm", { type: "audio/webm" }))

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: payload,
          credentials: "include",
        })

        const result = await response.json().catch(() => null)
        if (!response.ok) {
          const message = typeof result?.message === "string"
            ? result.message
            : "Failed to transcribe recording."
          throw new Error(message)
        }

        const text = typeof result?.text === "string" ? result.text.trim() : ""
        if (!text) {
          throw new Error("No speech detected in recording. Please try again.")
        }

        if (!cancelled) {
          onTextGenerated(text)
          toast.success("Transcription inserted")
        }
      } catch (uploadError) {
        const message = uploadError instanceof Error
          ? uploadError.message
          : "Failed to transcribe recording."

        if (!cancelled) {
          setErrorMessage(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) {
          setIsUploading(false)
          clearBlobUrl()
        }
      }
    }

    void uploadAndTranscribe()

    return () => {
      cancelled = true
    }
  }, [clearBlobUrl, mediaBlobUrl, onTextGenerated])

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-2"
        onClick={startRecording}
        disabled={!canStart}
      >
        <Mic className="h-4 w-4" />
        Start Recording
      </Button>

      <Button
        type="button"
        size="sm"
        variant="destructive"
        className="gap-2"
        onClick={stopRecording}
        disabled={!canStop}
      >
        <Square className="h-4 w-4" />
        Stop Recording
      </Button>

      <Badge
        variant="outline"
        className={cn(
          "gap-1.5",
          isRecording && "border-red-200 text-red-700",
          isUploading && "border-blue-200 text-blue-700"
        )}
      >
        {(isRecording || isUploading || isAcquiring) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {statusLabel}
      </Badge>

      {errorMessage && (
        <span className="inline-flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {errorMessage}
        </span>
      )}
    </div>
  )
}
