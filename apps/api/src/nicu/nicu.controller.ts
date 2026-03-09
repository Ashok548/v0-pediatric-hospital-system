import {
    Controller, Get, Post, Delete,
    Param, Body, Query,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, Request,
} from "@nestjs/common"
import { NicuService } from "./nicu.service"
import { CreateVitalsDto } from "./dto/create-vitals.dto"
import { QueryNicuDto } from "./dto/query-nicu.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("nicu")
export class NicuController {
    constructor(private nicuService: NicuService) { }

    /** List all NICU admissions with latest vitals snapshot */
    @Get("admissions")
    @Roles("ADMIN", "DOCTOR", "NURSE")
    findNicuAdmissions(@Query() query: QueryNicuDto) {
        return this.nicuService.findNicuAdmissions(query)
    }

    /** Get NICU patients with critical vital threshold breaches */
    @Get("alerts")
    @Roles("ADMIN", "DOCTOR", "NURSE")
    getCriticalAlerts() {
        return this.nicuService.getCriticalAlerts()
    }

    /** Get full vitals history for one admission */
    @Get("admissions/:id/vitals")
    @Roles("ADMIN", "DOCTOR", "NURSE")
    findVitals(@Param("id", ParseUUIDPipe) id: string) {
        return this.nicuService.findVitals(id)
    }

    /** Record new vitals for a NICU patient */
    @Post("admissions/:id/vitals")
    @Roles("ADMIN", "DOCTOR", "NURSE")
    @HttpCode(HttpStatus.CREATED)
    recordVitals(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: CreateVitalsDto,
        @Request() req: any,
    ) {
        const userId = req.user?.id as string | undefined
        return this.nicuService.recordVitals(id, dto, userId)
    }

    /** Delete a vitals entry (admin or nurse) */
    @Delete("vitals/:vid")
    @Roles("ADMIN", "NURSE")
    @HttpCode(HttpStatus.OK)
    deleteVitals(@Param("vid", ParseUUIDPipe) vid: string) {
        return this.nicuService.deleteVitals(vid)
    }

    /** Acknowledge a critical alert */
    @Post("vitals/:vid/acknowledge") // Use POST for wider compatibility, behaves like a PATCH action
    @Roles("ADMIN", "DOCTOR", "NURSE") // Or use PATCH if REST strictness matters, but POST is safer across clients without setup
    @HttpCode(HttpStatus.OK)
    acknowledgeAlert(
        @Param("vid", ParseUUIDPipe) vid: string,
        @Request() req: any,
    ) {
        const userId = req.user?.id as string | undefined
        return this.nicuService.acknowledgeAlert(vid, userId)
    }
}
