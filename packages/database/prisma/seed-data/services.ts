import { ServiceCategory, BillingType } from "../../generated/prisma/index.js";

export const seedServices = [
  // Beds
  { name: "NICU Bed Charges", category: ServiceCategory.ROOM, billingType: BillingType.DAY },
  { name: "Level 1 NICU Care", category: ServiceCategory.ROOM, billingType: BillingType.DAY },
  { name: "Level 2 NICU Care", category: ServiceCategory.ROOM, billingType: BillingType.DAY },
  { name: "Level 3 NICU Care", category: ServiceCategory.ROOM, billingType: BillingType.DAY },
  { name: "Isolation NICU Bed", category: ServiceCategory.ROOM, billingType: BillingType.DAY },
  { name: "Incubator Bed Charges", category: ServiceCategory.ROOM, billingType: BillingType.DAY },
  { name: "Radiant Warmer Bed", category: ServiceCategory.ROOM, billingType: BillingType.DAY },
  
  // Respiratory
  { name: "Oxygen Therapy", category: ServiceCategory.RESPIRATORY, billingType: BillingType.HOUR },
  { name: "Nasal Cannula Oxygen", category: ServiceCategory.RESPIRATORY, billingType: BillingType.HOUR },
  { name: "CPAP Support", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY },
  { name: "BiPAP Support", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY },
  { name: "Mechanical Ventilator", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY },
  { name: "High Frequency Ventilator", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY },
  { name: "HFNC Support", category: ServiceCategory.RESPIRATORY, billingType: BillingType.DAY },
  { name: "Intubation Procedure", category: ServiceCategory.RESPIRATORY, billingType: BillingType.PROCEDURE },
  { name: "Extubation Procedure", category: ServiceCategory.RESPIRATORY, billingType: BillingType.PROCEDURE },
  { name: "Surfactant Administration", category: ServiceCategory.RESPIRATORY, billingType: BillingType.PROCEDURE },
  
  // Monitoring
  { name: "Multiparameter Monitor", category: ServiceCategory.MONITORING, billingType: BillingType.DAY },
  { name: "Heart Rate Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY },
  { name: "SpO2 Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY },
  { name: "Blood Pressure Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY },
  { name: "Temperature Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY },
  { name: "Apnea Monitoring", category: ServiceCategory.MONITORING, billingType: BillingType.DAY },
  { name: "Central Monitoring Station", category: ServiceCategory.MONITORING, billingType: BillingType.DAY },
  
  // Therapy
  { name: "Single Surface Phototherapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY },
  { name: "Double Surface Phototherapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY },
  { name: "LED Phototherapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY },
  { name: "Intensive Phototherapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY },
  { name: "Biliblanket Therapy", category: ServiceCategory.THERAPY, billingType: BillingType.DAY },
  
  // Infusion
  { name: "IV Line Insertion", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE },
  { name: "Peripheral IV Cannula", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE },
  { name: "Umbilical Venous Catheter (UVC)", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE },
  { name: "Umbilical Arterial Catheter (UAC)", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE },
  { name: "PICC Line Insertion", category: ServiceCategory.INFUSION, billingType: BillingType.PROCEDURE },
  { name: "Infusion Pump Usage", category: ServiceCategory.INFUSION, billingType: BillingType.DAY },
  { name: "Syringe Pump Usage", category: ServiceCategory.INFUSION, billingType: BillingType.DAY },
  { name: "Total Parenteral Nutrition (TPN)", category: ServiceCategory.INFUSION, billingType: BillingType.DAY },
  
  // Feeding
  { name: "Nasogastric Tube Feeding", category: ServiceCategory.FEEDING, billingType: BillingType.DAY },
  { name: "Orogastric Tube Feeding", category: ServiceCategory.FEEDING, billingType: BillingType.DAY },
  { name: "Expressed Breast Milk Feeding", category: ServiceCategory.FEEDING, billingType: BillingType.DAY },
  { name: "Donor Milk Feeding", category: ServiceCategory.FEEDING, billingType: BillingType.DAY },
  { name: "Breast Milk Fortification", category: ServiceCategory.FEEDING, billingType: BillingType.DAY },
  { name: "Feeding Pump Usage", category: ServiceCategory.FEEDING, billingType: BillingType.DAY },
  
  // Laboratory
  { name: "Complete Blood Count (CBC)", category: ServiceCategory.LAB, billingType: BillingType.TEST },
  { name: "C-Reactive Protein (CRP)", category: ServiceCategory.LAB, billingType: BillingType.TEST },
  { name: "Blood Culture", category: ServiceCategory.LAB, billingType: BillingType.TEST },
  { name: "Blood Gas (ABG)", category: ServiceCategory.LAB, billingType: BillingType.TEST },
  { name: "Serum Bilirubin", category: ServiceCategory.LAB, billingType: BillingType.TEST },
  { name: "Electrolytes Test", category: ServiceCategory.LAB, billingType: BillingType.TEST },
  { name: "Blood Sugar Test", category: ServiceCategory.LAB, billingType: BillingType.TEST },
  { name: "Calcium Test", category: ServiceCategory.LAB, billingType: BillingType.TEST },
  { name: "Magnesium Test", category: ServiceCategory.LAB, billingType: BillingType.TEST },
  
  // Imaging
  { name: "Baby X-Ray", category: ServiceCategory.IMAGING, billingType: BillingType.TEST },
  { name: "Cranial Ultrasound", category: ServiceCategory.IMAGING, billingType: BillingType.TEST },
  { name: "Abdominal Ultrasound", category: ServiceCategory.IMAGING, billingType: BillingType.TEST },
  { name: "Echocardiography", category: ServiceCategory.IMAGING, billingType: BillingType.TEST },
  { name: "CT Scan", category: ServiceCategory.IMAGING, billingType: BillingType.TEST },
  { name: "MRI Scan", category: ServiceCategory.IMAGING, billingType: BillingType.TEST },
  
  // Procedures
  { name: "Lumbar Puncture", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE },
  { name: "Exchange Transfusion", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE },
  { name: "Blood Transfusion", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE },
  { name: "Platelet Transfusion", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE },
  { name: "Chest Tube Insertion", category: ServiceCategory.PROCEDURE, billingType: BillingType.PROCEDURE },
  
  // Professional
  { name: "NICU Nursing Care", category: ServiceCategory.CONSULTATION, billingType: BillingType.DAY },
  { name: "Pediatrician Visit", category: ServiceCategory.CONSULTATION, billingType: BillingType.VISIT },
  { name: "Neonatologist Visit", category: ServiceCategory.CONSULTATION, billingType: BillingType.VISIT },
  { name: "Resident Doctor Visit", category: ServiceCategory.CONSULTATION, billingType: BillingType.VISIT },
];
