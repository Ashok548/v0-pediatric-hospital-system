import {
    Controller, Get, Post, Delete,
    Param, Body,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, Request,
} from "@nestjs/common"
import { GrowthService } from "./growth.service"
import { CreateGrowthRecordDto } from "./dto/create-growth-record.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("growth")
export class GrowthController {
    constructor(private growthService: GrowthService) { }

    /** All growth records for a patient */
    @Get(":patientId")
    @Roles("ADMIN", "DOCTOR", "NURSE")
    findByPatient(@Param("patientId", ParseUUIDPipe) patientId: string) {
        return this.growthService.findByPatient(patientId)
    }

    /** Add a new growth measurement */
    @Post(":patientId")
    @Roles("ADMIN", "DOCTOR", "NURSE")
    @HttpCode(HttpStatus.CREATED)
    create(
        @Param("patientId", ParseUUIDPipe) patientId: string,
        @Body() dto: CreateGrowthRecordDto,
        @Request() req: any,
    ) {
        const userId = req.user?.id as string | undefined
        return this.growthService.create(patientId, dto, userId)
    }

    /** Delete a growth record */
    @Delete(":recordId")
    @Roles("ADMIN", "NURSE")
    @HttpCode(HttpStatus.OK)
    remove(@Param("recordId", ParseUUIDPipe) recordId: string) {
        return this.growthService.remove(recordId)
    }
}
