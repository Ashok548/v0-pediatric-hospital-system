"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check, Loader2, Sparkles, Undo2 } from "lucide-react"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatMedicalText } from "@/lib/api/medical-format"
import { appendTranscript } from "@/lib/utils/transcript"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface DoctorDictationEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function DoctorDictationEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Start dictating your clinical notes...",
  className,
}: DoctorDictationEditorProps) {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [isFormatting, setIsFormatting] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const [originalTranscript, setOriginalTranscript] = useState<string | null>(null)

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const currentValueRef = useRef(value)
  const requestIdRef = useRef(0)
  const flashTimeoutsRef = useRef<number[]>([])

  const hasSuggestion = useMemo(() => Boolean(aiSuggestion?.trim()), [aiSuggestion])

  const clearFlashTimers = useCallback(() => {
    flashTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
    flashTimeoutsRef.current = []
  }, [])

  const resizeTextarea = useCallback(() => {
    const node = textAreaRef.current
    if (!node) {
      return
    }

    node.style.height = "auto"
    node.style.height = `${node.scrollHeight}px`
  }, [])

  const triggerDoubleFlash = useCallback(() => {
    clearFlashTimers()
    setIsFlashing(false)

    flashTimeoutsRef.current = [
      window.setTimeout(() => setIsFlashing(true), 20),
      window.setTimeout(() => setIsFlashing(false), 560),
      window.setTimeout(() => setIsFlashing(true), 720),
      window.setTimeout(() => setIsFlashing(false), 1260),
    ]
  }, [clearFlashTimers])

  useEffect(() => {
    currentValueRef.current = value
    resizeTextarea()
  }, [resizeTextarea, value])

  useEffect(() => {
    return () => {
      clearFlashTimers()
    }
  }, [clearFlashTimers])

  const handleFormatTranscript = useCallback(
    async (text: string) => {
      const cleanText = text.trim()
      if (!cleanText) {
        return
      }

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId
      setIsFormatting(true)

      try {
        const result = await formatMedicalText(cleanText)

        if (requestId !== requestIdRef.current) {
          return
        }

        const suggestion = result.formatted.trim()
        setAiSuggestion(suggestion || null)
        resizeTextarea()

        if (suggestion) {
          triggerDoubleFlash()
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return
        }

        const message = error instanceof Error
          ? error.message
          : "Unable to format dictation right now."

        toast.error(message)
      } finally {
        if (requestId === requestIdRef.current) {
          setIsFormatting(false)
        }
      }
    },
    [resizeTextarea, triggerDoubleFlash],
  )

  const handleGeneratedTranscript = useCallback(
    (text: string) => {
      const mergedText = appendTranscript(currentValueRef.current, text)

      onChange(mergedText)
      setOriginalTranscript(null)
      void handleFormatTranscript(mergedText)
    },
    [handleFormatTranscript, onChange],
  )

  const handleApplySuggestion = useCallback(() => {
    if (!aiSuggestion) {
      return
    }

    setOriginalTranscript(currentValueRef.current)
    onChange(aiSuggestion)

    requestAnimationFrame(() => {
      resizeTextarea()
    })
  }, [aiSuggestion, onChange, resizeTextarea])

  const handleUndo = useCallback(() => {
    if (originalTranscript === null) {
      return
    }

    onChange(originalTranscript)
    setOriginalTranscript(null)

    requestAnimationFrame(() => {
      resizeTextarea()
    })
  }, [onChange, originalTranscript, resizeTextarea])

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="doctor-dictation-editor">Doctor Dictation</Label>
        <Textarea
          id="doctor-dictation-editor"
          ref={textAreaRef}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value)
            setOriginalTranscript(null)
          }}
          className={cn(
            "min-h-28 resize-none overflow-hidden transition-colors",
            isFlashing && "dictation-editor-flash",
          )}
        />
        <VoiceRecorder
          disabled={disabled || isFormatting}
          onTextGenerated={handleGeneratedTranscript}
        />
      </div>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Suggestion
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 px-4 pt-0">
          {isFormatting && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Formatting dictation in background...
            </div>
          )}

          {hasSuggestion ? (
            <div className="bg-muted/50 rounded-md border p-3 text-sm whitespace-pre-wrap">
              {aiSuggestion}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Your formatted medical instructions will appear here after dictation.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleApplySuggestion}
              disabled={!hasSuggestion || disabled}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" />
              Apply AI Text
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={originalTranscript === null || disabled}
              className="gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
