import { NursingService } from './nursing.service';
import { CreateNursingNoteDto, CreateIoRecordDto, UpdateNursingNoteDto, UpdateIoRecordDto } from './dto/create-nursing-note.dto';
export declare class NursingController {
    private readonly nursingService;
    constructor(nursingService: NursingService);
    getDepartmentHandover(department: string, shift: string): Promise<any>;
    getNotes(admissionId: string): Promise<any>;
    createNote(admissionId: string, dto: CreateNursingNoteDto, user: any): Promise<any>;
    deleteNote(id: string): Promise<{
        success: boolean;
    }>;
    updateNote(id: string, dto: UpdateNursingNoteDto): Promise<any>;
    getIoRecords(admissionId: string): Promise<any>;
    createIoRecord(admissionId: string, dto: CreateIoRecordDto, user: any): Promise<any>;
    deleteIoRecord(id: string): Promise<{
        success: boolean;
    }>;
    updateIoRecord(id: string, dto: UpdateIoRecordDto): Promise<any>;
    deleteVitalRecord(id: string): Promise<{
        success: boolean;
    }>;
}
