export declare class CreateLabPanelDto {
    panelName: string;
    category: string;
    sampleType: string;
}
export declare class CreateLabOrderDto {
    patientId: string;
    panels: CreateLabPanelDto[];
    technicianNotes?: string;
}
