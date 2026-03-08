import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Query,
    Patch,
} from '@nestjs/common';
import { NursingService } from './nursing.service';
import { CreateNursingNoteDto, CreateIoRecordDto, UpdateNursingNoteDto, UpdateIoRecordDto } from './dto/create-nursing-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('nursing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NursingController {
    constructor(private readonly nursingService: NursingService) { }

    // ─── Handover ─────────────────────────────────────────────────────────────

    @Get('handover')
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    async getDepartmentHandover(
        @Query('department') department: string,
        @Query('shift') shift: string,
    ) {
        // Default to some values if missing
        const dept = department || 'NICU';
        const shiftPeriod = shift || 'MORNING';
        return this.nursingService.getDepartmentHandover(dept, shiftPeriod);
    }

    // ─── Nursing Notes ────────────────────────────────────────────────────────

    @Get('notes/:admissionId')
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    async getNotes(@Param('admissionId') admissionId: string) {
        return this.nursingService.getNotesByAdmission(admissionId);
    }

    @Post('notes/:admissionId')
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    async createNote(
        @Param('admissionId') admissionId: string,
        @Body() dto: CreateNursingNoteDto,
        @CurrentUser() user: any,
    ) {
        // Normally user.firstName, but using generic name if not available
        const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : 'System User';
        return this.nursingService.createNote(admissionId, dto, userName);
    }

    @Delete('notes/:id')
    @Roles('ADMIN', 'NURSE')
    async deleteNote(@Param('id') id: string) {
        await this.nursingService.deleteNote(id);
        return { success: true };
    }

    @Patch('notes/:id')
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    async updateNote(
        @Param('id') id: string,
        @Body() dto: UpdateNursingNoteDto,
    ) {
        return this.nursingService.updateNote(id, dto);
    }

    // ─── IO Records ───────────────────────────────────────────────────────────

    @Get('io/:admissionId')
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    async getIoRecords(@Param('admissionId') admissionId: string) {
        return this.nursingService.getIoRecordsByAdmission(admissionId);
    }

    @Post('io/:admissionId')
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    async createIoRecord(
        @Param('admissionId') admissionId: string,
        @Body() dto: CreateIoRecordDto,
        @CurrentUser() user: any,
    ) {
        const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : 'System User';
        return this.nursingService.createIoRecord(admissionId, dto, userName);
    }

    @Delete('io/:id')
    @Roles('ADMIN', 'NURSE')
    async deleteIoRecord(@Param('id') id: string) {
        await this.nursingService.deleteIoRecord(id);
        return { success: true };
    }

    @Patch('io/:id')
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    async updateIoRecord(
        @Param('id') id: string,
        @Body() dto: UpdateIoRecordDto,
    ) {
        return this.nursingService.updateIoRecord(id, dto);
    }

    // ─── Vitals ───────────────────────────────────────────────────────────────

    @Delete('vitals/:id')
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    async deleteVitalRecord(@Param('id') id: string) {
        await this.nursingService.deleteVitalRecord(id);
        return { success: true };
    }
}
