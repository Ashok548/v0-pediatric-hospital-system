import { AppShell } from "@/components/hospital/app-shell"
import { SettingsContent } from "@/components/hospital/settings-content"

export default function SettingsPage() {
    return (
        <AppShell activeItem="Settings">
            <SettingsContent />
        </AppShell>
    )
}
