const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Rupa\\Documents\\Ashok Projects\\v0-pediatric-hospital-system\\apps\\web\\components\\hospital\\appointments-content.tsx';

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add AlertTriangle to lucide-react imports if not present
if (!content.includes('AlertTriangle')) {
    content = content.replace(
        'import { Search, Plus, CalendarDays, Clock, MapPin, X, ChevronLeft, ChevronRight, Activity, ArrowRight, User2, Phone, Briefcase, FileText, BadgeCheck, Stethoscope, Syringe } from "lucide-react"',
        'import { Search, Plus, CalendarDays, Clock, MapPin, X, ChevronLeft, ChevronRight, Activity, ArrowRight, User2, Phone, Briefcase, FileText, BadgeCheck, Stethoscope, Syringe, AlertTriangle } from "lucide-react"'
    );
}

// 2. Add the banner after Page Header and before Week Calendar Strip
const target = `                {/* "?"? Week Calendar Strip `;
const replacement = `                {counts.Completed > 0 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
                        <AlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                            <p className="font-semibold">Billing Safety Net Warning</p>
                            <p className="mt-0.5 text-amber-700/90">{counts.Completed} visits have been marked as Completed. Please ensure OP Billing is generated for these visits.</p>
                        </div>
                    </div>
                )}

                {/* "?"? Week Calendar Strip `;

if (!content.includes('Billing Safety Net Warning')) {
    content = content.replace(target, replacement);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Rewrite complete");
