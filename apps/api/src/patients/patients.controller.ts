import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { PatientsService } from "./patients.service";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { QueryPatientsDto } from "./dto/query-patients.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AdmissionsService } from "../admissions/admissions.service";

// Protect all routes with JWT and Role Guards
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("patients")
export class PatientsController {
    constructor(
        private readonly patientsService: PatientsService,
        private readonly admissionsService: AdmissionsService,
    ) { }

    // Only Admins and Receptionists can create/update
    @Roles("ADMIN", "RECEPTIONIST")
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createPatientDto: CreatePatientDto) {
        return this.patientsService.create(createPatientDto);
    }

    // Everyone can read patients
    @Roles("ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE")
    @Get()
    findAll(@Query() query: QueryPatientsDto) {
        return this.patientsService.findAll(query);
    }

    @Roles("ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE")
    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.patientsService.findOne(id);
    }

    @Roles("ADMIN", "RECEPTIONIST")
    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() updatePatientDto: UpdatePatientDto
    ) {
        return this.patientsService.update(id, updatePatientDto);
    }

    // Only Admins and potentially authorized Receptionists can soft-delete
    @Roles("ADMIN", "RECEPTIONIST")
    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    softDelete(@Param("id", ParseUUIDPipe) id: string) {
        return this.patientsService.softDelete(id);
    }

    // GET /patients/:id/admissions — full admission history for a patient
    @Roles("ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE")
    @Get(":id/admissions")
    getAdmissions(@Param("id", ParseUUIDPipe) id: string) {
        return this.admissionsService.findByPatient(id);
    }
}
