"use client"

import { useState } from "react"
import { useNursingNotes, useCreateNursingNote, useUpdateNursingNote, useDeleteNursingNote, type ApiNursingNote } from "@/lib/api/nursing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { appendTranscript } from "@/lib/utils/transcript"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { FileText, Loader2, Plus, AlertCircle, Clock, Trash2, Edit2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
    admissionId: string
}

const NOTE_TYPES = ["PROGRESS", "OBSERVATION", "MEDICATION", "PROCEDURE", "HANDOVER"]

export function NotesPanel({ admissionId }: Props) {
    const { notes, isLoading } = useNursingNotes(admissionId)
    const createNote = useCreateNursingNote()
    const updateNote = useUpdateNursingNote()
    const deleteNote = useDeleteNursingNote()

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
    const [noteType, setNoteType] = useState("PROGRESS")
    const [priority, setPriority] = useState<"NORMAL" | "URGENT" | "CRITICAL">("NORMAL")
    const [shiftPeriod, setShiftPeriod] = useState<"MORNING" | "AFTERNOON" | "NIGHT">("MORNING")
    const [content, setContent] = useState("")

    // Delete state
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    function openNewForm() {
        setEditingNoteId(null)
        setNoteType("PROGRESS")
        setPriority("NORMAL")
        setShiftPeriod("MORNING")
        setContent("")
        setIsFormOpen(true)
    }

    function openEditForm(note: ApiNursingNote) {
        setEditingNoteId(note.id)
        setNoteType(note.noteType)
        setPriority(note.priority)
        setShiftPeriod(note.shiftPeriod || "MORNING")
        setContent(note.content)
        setIsFormOpen(true)
    }

    async function handleDeleteConfirmed() {
        if (!noteToDelete) return
        setIsDeleting(true)
        try {
            await deleteNote(noteToDelete, admissionId)
            toast.success("Nursing note deleted")
        } catch {
            toast.error("Failed to delete nursing note")
        } finally {
            setIsDeleting(false)
            setNoteToDelete(null)
        }
    }

    async function handleSubmit() {
        if (!content.trim()) return

        setIsSubmitting(true)
        try {
            if (editingNoteId) {
                await updateNote(editingNoteId, {
                    noteType,
                    priority,
                    shiftPeriod,
                    content
                })
                toast.success("Nursing note updated")
            } else {
                await createNote(admissionId, {
                    noteType,
                    priority,
                    shiftPeriod,
                    content
                })
                toast.success("Nursing note added")
            }
            setContent("")
            setIsFormOpen(false)
            setEditingNoteId(null)
        } catch {
            toast.error(editingNoteId ? "Failed to update nursing note" : "Failed to add nursing note")
        } finally {
            setIsSubmitting(false)
        }
    }

    const priorityColor = {
        NORMAL: "bg-blue-100 text-blue-700",
        URGENT: "bg-orange-100 text-orange-700",
        CRITICAL: "bg-red-100 text-red-700"
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Nursing Notes</h3>
                {!isFormOpen && (
                    <Button onClick={openNewForm} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Add Note
                    </Button>
                )}
            </div>

            {isFormOpen && (
                <Card className="border-primary/20 shadow-sm mb-4">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> {editingNoteId ? 'Edit Clinical Note' : 'New Clinical Note'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label>Note Type</Label>
                                <Select value={noteType} onValueChange={setNoteType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {NOTE_TYPES.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Priority</Label>
                                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NORMAL">Normal</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                        <SelectItem value="CRITICAL">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Shift</Label>
                                <Select value={shiftPeriod} onValueChange={(v: any) => setShiftPeriod(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MORNING">Morning Shift</SelectItem>
                                        <SelectItem value="AFTERNOON">Afternoon Shift</SelectItem>
                                        <SelectItem value="NIGHT">Night Shift</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Clinical Notes / Observations</Label>
                            <Textarea
                                rows={4}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Patient resting comfortably..."
                            />
                            <VoiceRecorder
                                disabled={isSubmitting}
                                onTextGenerated={(text) => {
                                    setContent((prev) => appendTranscript(prev, text))
                                }}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => { setIsFormOpen(false); setEditingNoteId(null) }}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Note
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="space-y-3">
                    {notes.map(note => (
                        <Card key={note.id} className="overflow-hidden group">
                            <div className="flex">
                                {/* Side marker line based on priority */}
                                <div className={`w-1 shrink-0 ${note.priority === 'CRITICAL' ? 'bg-red-500' :
                                    note.priority === 'URGENT' ? 'bg-orange-500' : 'bg-blue-400'
                                    }`} />

                                <CardContent className="p-4 flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                                                {note.noteType}
                                            </Badge>
                                            {note.priority !== "NORMAL" && (
                                                <Badge className={`text-[10px] ${priorityColor[note.priority]} shadow-none border-none`}>
                                                    {note.priority === "CRITICAL" && <AlertCircle className="h-3 w-3 mr-1" />}
                                                    {note.priority}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1.5">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditForm(note)}>
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50/50" onClick={() => setNoteToDelete(note.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-foreground">{note.recordedBy}</p>
                                                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(note.recordedAt), "dd MMM, HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                                        {note.content}
                                    </p>
                                </CardContent>
                            </div>
                        </Card>
                    ))}
                    {!isLoading && notes.length === 0 && (
                        <div className="text-center p-8 bg-muted/20 border border-dashed rounded-lg text-muted-foreground text-sm">
                            No nursing notes recorded for this admission.
                        </div>
                    )}
                </div>
            )}

            <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Nursing Note?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this nursing note? This action cannot be undone and will permanently remove it from the patient's record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteConfirmed();
                            }}
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete Note
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
