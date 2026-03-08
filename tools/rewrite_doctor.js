const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Rupa\\Documents\\Ashok Projects\\v0-pediatric-hospital-system\\apps\\web\\components\\hospital\\doctor-dashboard-content.tsx';

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Imports
content = content.replace(
    'import { useAdmissions } from "@/lib/api/admissions"',
    'import { useAdmissions } from "@/lib/api/admissions"\nimport { useAppointments } from "@/lib/api/appointments"'
);

// 2. Remove mock data
content = content.replace(
    /const todaysAppointments = \[[\s\S]*?\]\n/,
    '// todaysAppointments removed, using live data\n'
);

// 3. Update hook
content = content.replace(
    '  const [searchFocused, setSearchFocused] = useState(false)\n\n  // Fetch real admission data\n  const { admissions = [] } = useAdmissions({ status: "ADMITTED" })',
    `  const [searchFocused, setSearchFocused] = useState(false)

  // Fetch real admission data
  const { admissions = [] } = useAdmissions({ status: "ADMITTED" })
  
  // Fetch live appointments
  const { appointments = [], isLoading: apptsLoading } = useAppointments({ date: new Date().toISOString() })`
);

// 4. Update status color functions
content = content.replace(
    /function getStatusColor\(status: string\) {[\s\S]*?}/,
    `function getStatusColor(status: string) {
  switch (status) {
    case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "In Progress": return "bg-blue-50 text-blue-700 border-blue-200"
    case "Scheduled": return "bg-amber-50 text-amber-700 border-amber-200"
    default: return "bg-muted text-muted-foreground"
  }
}`
);

// 5. Update counts
content = content.replace(
    /const completedCount = todaysAppointments\.filter\(a => a\.status === "completed"\)\.length\n  const inProgressCount = todaysAppointments\.filter\(a => a\.status === "in-progress"\)\.length\n  const waitingCount = todaysAppointments\.filter\(a => a\.status === "waiting"\)\.length/,
    `const todaysAppointments = appointments;
  const completedCount = todaysAppointments.filter((a: any) => a.status === "Completed").length
  const inProgressCount = todaysAppointments.filter((a: any) => a.status === "In Progress").length
  const waitingCount = todaysAppointments.filter((a: any) => a.status === "Scheduled").length`
);

// 6. Update mapped component properties
// appt.status === "in-progress" -> appt.status === "In Progress"
content = content.replace(/appt\.status === "in-progress"/g, 'appt.status === "In Progress"');
// appt.status === "completed" -> appt.status === "Completed"
content = content.replace(/appt\.status === "completed"/g, 'appt.status === "Completed"');
// appt.status === "waiting" -> appt.status === "Scheduled"
content = content.replace(/appt\.status === "waiting"/g, 'appt.status === "Scheduled"');

// appt.patient -> appt.patientName
content = content.replace(/appt\.patient\b/g, 'appt.patientName');

// appt.complaint -> (appt.chiefComplaint || "Follow-up")
content = content.replace(/appt\.complaint\b/g, '(appt.chiefComplaint || appt.notes || "Follow-up check")');

// "in-progress" string usage
content = content.replace(/"in-progress"/g, '"In Progress"');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Rewrite complete");
