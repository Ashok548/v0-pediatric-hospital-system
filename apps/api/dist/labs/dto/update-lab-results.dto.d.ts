export declare class UpdateLabItemDto {
    id?: string;
    parameterName: string;
    value?: string;
    unit: string;
    refDisplay: string;
    refMin?: number;
    refMax?: number;
    criticalMin?: number;
    criticalMax?: number;
}
export declare class UpdateLabPanelResultsDto {
    items: UpdateLabItemDto[];
}
