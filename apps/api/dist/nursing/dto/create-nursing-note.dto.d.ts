export declare class CreateNursingNoteDto {
    noteType: string;
    content: string;
    priority?: string;
    shiftPeriod?: string;
}
declare const UpdateNursingNoteDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateNursingNoteDto>>;
export declare class UpdateNursingNoteDto extends UpdateNursingNoteDto_base {
}
export declare class CreateIoRecordDto {
    ioType: string;
    route: string;
    volumeMl: number;
    notes?: string;
}
export declare class UpdateIoRecordDto {
    ioType?: string;
    route?: string;
    volumeMl?: number;
    notes?: string;
}
export {};
