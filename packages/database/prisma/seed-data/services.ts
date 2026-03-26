import { ServiceCategory, BillingType, CareType, AutoAddTrigger, ServiceIntent, RecurrenceUnit } from "../../generated/prisma/index.js";

export const seedServices = [
  // Rooms & Beds (Billed per Day)
  { name: "NICU Bed Charges", category: ServiceCategory.ROOM, billingType: BillingType.DAY, basePrice: 5000.00, careType: CareType.IP, isRecurring: true, recurrenceUnit: RecurrenceUnit.DAILY, intent: ServiceIntent.FACILITY_CHARGE, autoAddTrigger: AutoAddTrigger.ON_NICU_ADMISSION, isDefault: true, uiGroup: "Rooms & Beds", displayOrder: 1, departmentNames: ["Neonatology (NICU)"] },
  { name: "Level 1 NICU Care", category: ServiceCategory.ROOM, billingType: BillingType.DAY, basePrice: 8000.00, careType: CareType.IP, isRecurring: true, recurrenceUnit: RecurrenceUnit.DAILY, intent: ServiceIntent.FACILITY_CHARGE, uiGroup: "Rooms & Beds", displayOrder: 2, departmentNames: ["Neonatology (NICU)"] },
  { name: "Level 2 NICU Care", category: ServiceCategory.ROOM, billingType: BillingType.DAY, basePrice: 12000.00 },
  { name: "Level 3 NICU Care", category: ServiceCategory.ROOM, billingType: BillingType.DAY, basePrice: 18000.00 },
  { name: "Isolation NICU Bed", category: ServiceCategory.ROOM, billingType: BillingType.DAY, basePrice: 15000.00 },
  { name: "Incubator Bed Charges", category: ServiceCategory.ROOM, billingType: BillingType.DAY, basePrice: 3000.00 },
  { name: "Radiant Warmer Bed", category: ServiceCategory.ROOM, billingType: BillingType.DAY, basePrice: 2500.00 },
  
  // Respiratory
  { name: "Oxygen Therapy", category: ServiceCategory.RESPIRATORY, billingType: BillingType.HOUR, basePrice: 150.00 },
  { name: "Nasal Cannula Oxygen", category: ServiceCategory.RESPIRATORY, billingType: BillingType.HOUR, basePrice: 100.00 },
  { name: "CPAP Support", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY, basePrice: 4000.00, careType: CareType.IP, conflictGroupCode: "RESP_VENT", isRecurring: true, recurrenceUnit: RecurrenceUnit.DAILY, intent: ServiceIntent.THERAPEUTIC, uiGroup: "Respiratory Support", autoAddPriority: 10, departmentNames: ["Neonatology (NICU)", "Pediatrics"] },
  { name: "BiPAP Support", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY, basePrice: 5000.00, careType: CareType.IP, conflictGroupCode: "RESP_VENT", isRecurring: true, recurrenceUnit: RecurrenceUnit.DAILY, intent: ServiceIntent.THERAPEUTIC, uiGroup: "Respiratory Support", departmentNames: ["Neonatology (NICU)", "Pediatrics"] },
  { name: "Mechanical Ventilator", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY, basePrice: 10000.00, careType: CareType.IP, conflictGroupCode: "RESP_VENT", isRecurring: true, recurrenceUnit: RecurrenceUnit.DAILY, intent: ServiceIntent.THERAPEUTIC, uiGroup: "Respiratory Support", autoAddPriority: 50, departmentNames: ["Neonatology (NICU)", "Pediatrics"] },
  { name: "High Frequency Ventilator", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY, basePrice: 12000.00, careType: CareType.IP, conflictGroupCode: "RESP_VENT", isRecurring: true, recurrenceUnit: RecurrenceUnit.DAILY, intent: ServiceIntent.THERAPEUTIC, uiGroup: "Respiratory Support", departmentNames: ["Neonatology (NICU)"] },
  { name: "HFNC Support", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY, basePrice: 6000.00 },
  { name: "Intubation Procedure", category: ServiceCategory.RESPIRATORY, billingType: BillingType.PROCEDURE, basePrice: 2500.00 },
  { name: "Extubation Procedure", category: ServiceCategory.RESPIRATORY, billingType: BillingType.PROCEDURE, basePrice: 1500.00 },
  { name: "Surfactant Administration", category: ServiceCategory.RESPIRATORY, billingType: BillingType.PROCEDURE, basePrice: 4000.00 },
  
  // Monitoring (Billed per Day)
  { name: "Multiparameter Monitor", category: ServiceCategory.MONITORING, billingType: BillingType.DAY, basePrice: 1500.00 },
  { name: "Heart Rate Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY, basePrice: 500.00 },
  { name: "SpO2 Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY, basePrice: 500.00 },
  { name: "Blood Pressure Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY, basePrice: 500.00 },
  { name: "Temperature Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY, basePrice: 300.00 },
  { name: "Apnea Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY, basePrice: 800.00 },
  { name: "Central Monitoring Station", category: ServiceCategory.MONITORING, billingType: BillingType.DAY, basePrice: 2000.00 },
  
  // Therapy (Phototherapy - Billed per Day)
  { name: "Single Surface Phototherapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY, basePrice: 2500.00 },
  { name: "Double Surface Phototherapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY, basePrice: 4000.00 },
  { name: "LED Phototherapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY, basePrice: 5000.00 },
  { name: "Intensive Phototherapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY, basePrice: 6000.00 },
  { name: "Biliblanket Therapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY, basePrice: 3500.00 },
  
  // Infusion
  { name: "IV Line Insertion", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE, basePrice: 500.00 },
  { name: "Peripheral IV Cannula", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE, basePrice: 500.00 },
  { name: "Umbilical Venous Catheter (UVC)", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE, basePrice: 3500.00 },
  { name: "Umbilical Arterial Catheter (UAC)", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE, basePrice: 3500.00 },
  { name: "PICC Line Insertion", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE, basePrice: 5000.00 },
  { name: "Infusion Pump Usage", category: ServiceCategory.INFUSION, billingType: BillingType.DAY, basePrice: 1000.00 },
  { name: "Syringe Pump Usage", category: ServiceCategory.INFUSION, billingType: BillingType.DAY, basePrice: 1000.00 },
  { name: "Total Parenteral Nutrition (TPN)", category: ServiceCategory.INFUSION, billingType: BillingType.DAY, basePrice: 3000.00 },
  
  // Feeding (Billed per Day)
  { name: "Nasogastric Tube Feeding", category: ServiceCategory.FEEDING, billingType: BillingType.DAY, basePrice: 500.00 },
  { name: "Orogastric Tube Feeding", category: ServiceCategory.FEEDING, billingType: BillingType.DAY, basePrice: 500.00 },
  { name: "Expressed Breast Milk Feeding", category: ServiceCategory.FEEDING, billingType: BillingType.DAY, basePrice: 300.00 },
  { name: "Donor Milk Feeding", category: ServiceCategory.FEEDING, billingType: BillingType.DAY, basePrice: 1500.00 },
  { name: "Breast Milk Fortification", category: ServiceCategory.FEEDING, billingType: BillingType.DAY, basePrice: 800.00 },
  { name: "Feeding Pump Usage", category: ServiceCategory.FEEDING, billingType: BillingType.DAY, basePrice: 1000.00 },
  
  // Laboratory (Billed per Test)
  { name: "Complete Blood Count (CBC)", category: ServiceCategory.LAB, billingType: BillingType.TEST, basePrice: 400.00 },
  { name: "C-Reactive Protein (CRP)", category: ServiceCategory.LAB, billingType: BillingType.TEST, basePrice: 500.00 },
  { name: "Blood Culture", category: ServiceCategory.LAB, billingType: BillingType.TEST, basePrice: 1200.00 },
  { name: "Blood Gas (ABG)", category: ServiceCategory.LAB, billingType: BillingType.TEST, basePrice: 800.00 },
  { name: "Serum Bilirubin", category: ServiceCategory.LAB, billingType: BillingType.TEST, basePrice: 400.00 },
  { name: "Electrolytes Test", category: ServiceCategory.LAB, billingType: BillingType.TEST, basePrice: 600.00 },
  { name: "Blood Sugar Test", category: ServiceCategory.LAB, billingType: BillingType.TEST, basePrice: 150.00 },
  { name: "Calcium Test", category: ServiceCategory.LAB, billingType: BillingType.TEST, basePrice: 300.00 },
  { name: "Magnesium Test", category: ServiceCategory.LAB, billingType: BillingType.TEST, basePrice: 400.00 },
  
  // Imaging (Billed per Test)
  { name: "Baby X-Ray", category: ServiceCategory.IMAGING, billingType: BillingType.TEST, basePrice: 600.00 },
  { name: "Cranial Ultrasound", category: ServiceCategory.IMAGING, billingType: BillingType.TEST, basePrice: 2500.00 },
  { name: "Abdominal Ultrasound", category: ServiceCategory.IMAGING, billingType: BillingType.TEST, basePrice: 2000.00 },
  { name: "Echocardiography", category: ServiceCategory.IMAGING, billingType: BillingType.TEST, basePrice: 3500.00 },
  { name: "CT Scan", category: ServiceCategory.IMAGING, billingType: BillingType.TEST, basePrice: 6000.00 },
  { name: "MRI Scan", category: ServiceCategory.IMAGING, billingType: BillingType.TEST, basePrice: 8000.00 },
  
  // Procedures
  { name: "Lumbar Puncture", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE, basePrice: 3500.00 },
  { name: "Exchange Transfusion", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE, basePrice: 8000.00 },
  { name: "Blood Transfusion", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE, basePrice: 3000.00 },
  { name: "Platelet Transfusion", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE, basePrice: 3500.00 },
  { name: "Chest Tube Insertion", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE, basePrice: 5000.00 },
  
  // Professional / Consultation
  { name: "NICU Nursing Care", category: ServiceCategory.CONSULTATION, billingType: BillingType.DAY, basePrice: 3000.00 },
  { name: "IP Pediatrician Visit", category: ServiceCategory.CONSULTATION, billingType: BillingType.VISIT, basePrice: 1000.00 },
  { name: "IP Neonatologist Visit", category: ServiceCategory.CONSULTATION, billingType: BillingType.VISIT, basePrice: 1500.00 },
  { name: "Resident Doctor Visit", category: ServiceCategory.CONSULTATION, billingType: BillingType.VISIT, basePrice: 500.00 },
  
  // Outpatient (OP) Consultations
  { name: "OP Pediatrician Consultation", category: ServiceCategory.CONSULTATION, billingType: BillingType.VISIT, basePrice: 800.00, careType: CareType.OP, autoAddTrigger: AutoAddTrigger.ON_OP_CREATION, isDefault: true, intent: ServiceIntent.PROFESSIONAL_FEE, uiGroup: "Consultations", displayOrder: 1, autoAddPriority: 10, departmentNames: ["Pediatrics"] },
  { name: "OP Neonatologist Consultation", category: ServiceCategory.CONSULTATION, billingType: BillingType.VISIT, basePrice: 1200.00, careType: CareType.OP, autoAddTrigger: AutoAddTrigger.ON_OP_CREATION, isDefault: false, intent: ServiceIntent.PROFESSIONAL_FEE, uiGroup: "Consultations", displayOrder: 2, autoAddPriority: 20, departmentNames: ["Neonatology (NICU)"] },
  { name: "OP Follow-up Visit", category: ServiceCategory.CONSULTATION, billingType: BillingType.VISIT, basePrice: 500.00 },
];
