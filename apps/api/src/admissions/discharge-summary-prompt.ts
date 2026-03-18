export interface DischargeSummaryContext {
  patient: {
    uhid: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup: string | null;
    guardianName: string;
    guardianPhone: string | null;
    allergies: string[];
    birthWeight: string | null;
  };
  admission: {
    admissionNumber: string;
    admissionDate: string;
    department: string;
    admissionType: string;
    priority: string;
    status: string;
    initialDiagnosis: string | null;
    clinicalNote: string | null;
    dischargeType: string | null;
    gestationalAge: string | null;
    nicuRiskLevel: string | null;
    admittingDoctorName: string | null;
    currentBed: {
      bedNumber: string;
      wardName: string;
      wardType: string;
      floorName: string;
    } | null;
  };
  transfers: Array<{
    transferDate: string;
    reason: string | null;
    fromBed: string | null;
    toBed: string | null;
  }>;
  vitals: Array<{
    recordedAt: string;
    heartRate: number | null;
    spo2: number | null;
    temperature: string | null;
    respRate: number | null;
    bpSystolic: number | null;
    bpDiastolic: number | null;
    weight: string | null;
    notes: string | null;
    isCritical: boolean;
    alertMessage: string | null;
  }>;
  nursingNotes: Array<{
    recordedAt: string;
    noteType: string;
    priority: string;
    shiftPeriod: string | null;
    content: string;
    recordedBy: string | null;
  }>;
  ioRecords: Array<{
    recordedAt: string;
    ioType: string;
    route: string;
    volumeMl: number;
    notes: string | null;
    recordedBy: string | null;
  }>;
  consultations: Array<{
    createdAt: string;
    doctorName: string | null;
    chiefComplaint: string | null;
    historyOfIllness: string | null;
    examinationNotes: string | null;
    diagnosis: string | null;
    plan: string | null;
  }>;
  prescriptions: Array<{
    orderedAt: string;
    status: string;
    doctorName: string | null;
    notes: string | null;
    items: Array<{
      medicationName: string;
      genericName: string;
      form: string;
      strength: string;
      dose: string | null;
      frequency: string | null;
      duration: number | null;
      prescribedQty: number;
      dispensedQty: number;
      instructions: string | null;
    }>;
  }>;
  labOrders: Array<{
    orderDate: string;
    status: string;
    doctorName: string | null;
    panels: Array<{
      panelName: string;
      category: string;
      sampleType: string;
      status: string;
      collectedAt: string | null;
      items: Array<{
        parameterName: string;
        value: string | null;
        unit: string;
        refDisplay: string;
        refMin: number | null;
        refMax: number | null;
      }>;
    }>;
  }>;
  serviceOrders: Array<{
    orderDate: string;
    status: string;
    priority: string;
    quantity: number;
    serviceName: string;
    serviceCode: string;
    doctorName: string | null;
    notes: string | null;
    completedAt: string | null;
  }>;
  bills: Array<{
    billNumber: string;
    status: string;
    totalAmount: string;
    paidAmount: string;
    dueAmount: string;
    createdAt: string;
  }>;
}

const MAX_SECTION_CHARS = 3000;

function safeJson(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  if (json.length <= MAX_SECTION_CHARS) return json;
  if (Array.isArray(value) && value.length > 1) {
    let count = value.length;
    while (count > 1) {
      count = Math.floor(count * 0.6);
      const trimmed = JSON.stringify(value.slice(0, count), null, 2);
      if (trimmed.length <= MAX_SECTION_CHARS) {
        return (
          trimmed +
          `\n// [${value.length - count} more items omitted — record too large]`
        );
      }
    }
    return (
      JSON.stringify(value.slice(0, 1), null, 2) +
      `\n// [${value.length - 1} more items omitted — record too large]`
    );
  }
  return (
    json.substring(0, MAX_SECTION_CHARS) +
    '\n// [truncated — content too large]'
  );
}

export function buildDischargeSummaryPrompt(context: DischargeSummaryContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = [
    'You are a senior pediatric discharge documentation specialist.',
    'Generate a clinically accurate discharge summary using ONLY the provided patient context.',
    'Rules:',
    '- Do not hallucinate or invent values that are not in context.',
    "- If data is missing, explicitly state 'Not documented'.",
    '- Keep language concise, professional, and suitable for the hospital record.',
    '- Use standard section headers and bullet points where useful.',
    '- Include medications with dose/frequency/duration only when available.',
    '- Include follow-up recommendations and warning signs based on available diagnosis and course.',
    'Output format:',
    '1. Patient Identification',
    '2. Admission Details',
    '3. Primary Diagnosis and Clinical Indication',
    '4. Hospital Course',
    '5. Significant Investigations',
    '6. Treatments and Procedures',
    '7. Condition at Discharge',
    '8. Discharge Medications',
    '9. Follow-up Plan',
    '10. Emergency Return Precautions',
  ].join('\n');

  const userPrompt = [
    'Prepare discharge summary for the admission context below.',
    '',
    'PATIENT:',
    safeJson(context.patient),
    '',
    'ADMISSION:',
    safeJson(context.admission),
    '',
    'BED TRANSFER HISTORY:',
    safeJson(context.transfers),
    '',
    'RECENT VITALS:',
    safeJson(context.vitals),
    '',
    'NURSING NOTES:',
    safeJson(context.nursingNotes),
    '',
    'I/O RECORDS:',
    safeJson(context.ioRecords),
    '',
    'CONSULTATIONS:',
    safeJson(context.consultations),
    '',
    'PRESCRIPTIONS:',
    safeJson(context.prescriptions),
    '',
    'LAB ORDERS AND RESULTS:',
    safeJson(context.labOrders),
    '',
    'SERVICE ORDERS:',
    safeJson(context.serviceOrders),
    '',
    'BILLING SNAPSHOT:',
    safeJson(context.bills),
  ].join('\n');

  return { systemPrompt, userPrompt };
}
