export const labMasterData = [
  {
    category: "Hematology",
    panelName: "CBC",
    sampleType: "Blood",
    parameters: [
      { parameterName: "Hemoglobin", unit: "g/dL", refDisplay: "12 - 16", refMin: 12, refMax: 16 },
      { parameterName: "WBC Count", unit: "10^3/uL", refDisplay: "4.0 - 11.0", refMin: 4, refMax: 11 },
      { parameterName: "Platelet Count", unit: "10^3/uL", refDisplay: "150 - 450", refMin: 150, refMax: 450 },
      { parameterName: "RBC Count", unit: "10^6/uL", refDisplay: "4.5 - 5.5", refMin: 4.5, refMax: 5.5 }
    ]
  },
  {
    category: "Biochemistry",
    panelName: "Lipid Profile",
    sampleType: "Blood",
    parameters: [
      { parameterName: "Total Cholesterol", unit: "mg/dL", refDisplay: "< 200", refMin: 0, refMax: 200 },
      { parameterName: "Triglycerides", unit: "mg/dL", refDisplay: "< 150", refMin: 0, refMax: 150 },
      { parameterName: "HDL Cholesterol", unit: "mg/dL", refDisplay: "> 40", refMin: 40, refMax: 100 },
      { parameterName: "LDL Cholesterol", unit: "mg/dL", refDisplay: "< 130", refMin: 0, refMax: 130 }
    ]
  },
  {
    category: "Biochemistry",
    panelName: "Liver Function Test",
    sampleType: "Blood",
    parameters: [
      { parameterName: "Bilirubin Total", unit: "mg/dL", refDisplay: "0.1 - 1.2", refMin: 0.1, refMax: 1.2 },
      { parameterName: "SGOT (AST)", unit: "U/L", refDisplay: "< 40", refMin: 0, refMax: 40 },
      { parameterName: "SGPT (ALT)", unit: "U/L", refDisplay: "< 40", refMin: 0, refMax: 40 },
      { parameterName: "Alkaline Phosphatase", unit: "U/L", refDisplay: "44 - 147", refMin: 44, refMax: 147 }
    ]
  },
  {
    category: "Biochemistry",
    panelName: "Kidney Function Test",
    sampleType: "Blood",
    parameters: [
      { parameterName: "Urea", unit: "mg/dL", refDisplay: "15 - 45", refMin: 15, refMax: 45 },
      { parameterName: "Creatinine", unit: "mg/dL", refDisplay: "0.6 - 1.2", refMin: 0.6, refMax: 1.2 },
      { parameterName: "Uric Acid", unit: "mg/dL", refDisplay: "3.5 - 7.2", refMin: 3.5, refMax: 7.2 }
    ]
  },
  {
    category: "Biochemistry",
    panelName: "Electrolyte Panel",
    sampleType: "Blood",
    parameters: [
      { parameterName: "Sodium", unit: "mmol/L", refDisplay: "135 - 145", refMin: 135, refMax: 145 },
      { parameterName: "Potassium", unit: "mmol/L", refDisplay: "3.5 - 5.1", refMin: 3.5, refMax: 5.1 },
      { parameterName: "Chloride", unit: "mmol/L", refDisplay: "98 - 107", refMin: 98, refMax: 107 }
    ]
  },
  {
    category: "Endocrinology",
    panelName: "Thyroid Profile",
    sampleType: "Blood",
    parameters: [
      { parameterName: "TSH", unit: "uIU/mL", refDisplay: "0.5 - 5.0", refMin: 0.5, refMax: 5 },
      { parameterName: "T3", unit: "ng/dL", refDisplay: "80 - 200", refMin: 80, refMax: 200 },
      { parameterName: "T4", unit: "ug/dL", refDisplay: "5 - 12", refMin: 5, refMax: 12 }
    ]
  },
  {
    category: "Inflammation",
    panelName: "Inflammation Panel",
    sampleType: "Blood",
    parameters: [
      { parameterName: "CRP", unit: "mg/L", refDisplay: "0 - 5", refMin: 0, refMax: 5 },
      { parameterName: "Procalcitonin", unit: "ng/mL", refDisplay: "0 - 0.5", refMin: 0, refMax: 0.5 },
      { parameterName: "ESR", unit: "mm/hr", refDisplay: "0 - 20", refMin: 0, refMax: 20 }
    ]
  },
  {
    category: "Blood Gas",
    panelName: "ABG",
    sampleType: "Arterial Blood",
    parameters: [
      { parameterName: "pH", unit: "", refDisplay: "7.35 - 7.45", refMin: 7.35, refMax: 7.45 },
      { parameterName: "pCO2", unit: "mmHg", refDisplay: "35 - 45", refMin: 35, refMax: 45 },
      { parameterName: "pO2", unit: "mmHg", refDisplay: "80 - 100", refMin: 80, refMax: 100 },
      { parameterName: "HCO3", unit: "mmol/L", refDisplay: "22 - 26", refMin: 22, refMax: 26 }
    ]
  },
  {
    category: "Biochemistry",
    panelName: "Glucose Test",
    sampleType: "Blood",
    parameters: [
      { parameterName: "Blood Glucose", unit: "mg/dL", refDisplay: "70 - 140", refMin: 70, refMax: 140 }
    ]
  },
  {
    category: "Coagulation",
    panelName: "Coagulation Profile",
    sampleType: "Blood",
    parameters: [
      { parameterName: "PT", unit: "seconds", refDisplay: "11 - 13.5", refMin: 11, refMax: 13.5 },
      { parameterName: "INR", unit: "", refDisplay: "0.8 - 1.1", refMin: 0.8, refMax: 1.1 },
      { parameterName: "APTT", unit: "seconds", refDisplay: "25 - 35", refMin: 25, refMax: 35 }
    ]
  },
  {
    category: "Urine",
    panelName: "Urine Routine",
    sampleType: "Urine",
    parameters: [
      { parameterName: "pH", unit: "", refDisplay: "4.5 - 8", refMin: 4.5, refMax: 8 },
      { parameterName: "Specific Gravity", unit: "", refDisplay: "1.005 - 1.03", refMin: 1.005, refMax: 1.03 },
      { parameterName: "Protein", unit: "mg/dL", refDisplay: "0 - 10", refMin: 0, refMax: 10 },
      { parameterName: "Glucose", unit: "mg/dL", refDisplay: "0 - 0", refMin: 0, refMax: 0 }
    ]
  }
];
