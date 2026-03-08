import { CreateNursingNoteDto, CreateIoRecordDto, UpdateNursingNoteDto, UpdateIoRecordDto } from './dto/create-nursing-note.dto';
export declare class NursingService {
    private getAdmission;
    getNotesByAdmission(admissionId: string): Promise<any>;
    createNote(admissionId: string, dto: CreateNursingNoteDto, userName: string): Promise<any>;
    updateNote(id: string, dto: UpdateNursingNoteDto): Promise<any>;
    deleteNote(id: string): Promise<void>;
    getIoRecordsByAdmission(admissionId: string): Promise<any>;
    createIoRecord(admissionId: string, dto: CreateIoRecordDto, userName: string): Promise<any>;
    deleteIoRecord(id: string): Promise<void>;
    updateIoRecord(id: string, dto: UpdateIoRecordDto): Promise<any>;
    deleteVitalRecord(id: string): Promise<void>;
    getDepartmentHandover(department: string, shiftPeriod: string): Promise<any>;
}
