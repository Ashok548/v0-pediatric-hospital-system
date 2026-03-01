import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-8">
            <ShieldX className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground max-w-sm mb-6">
                You don&apos;t have permission to view this page. Please contact your administrator if you believe this is an error.
            </p>
            <Link
                href="/dashboard"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
                Back to Dashboard
            </Link>
        </div>
    );
}
