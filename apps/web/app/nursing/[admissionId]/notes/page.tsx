import { AppShell } from "@/components/hospital/app-shell"
import { NotesPageContent } from "@/components/hospital/nursing/notes-page-content"

export default async function NursingNotesPage({ params }: { params: Promise<{ admissionId: string }> }) {
    const p = await params;
    return (
        <AppShell>
            <NotesPageContent admissionId={p.admissionId} />
        </AppShell>
    )
}
