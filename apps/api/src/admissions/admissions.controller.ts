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
    Req,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import type { Request } from "express";
import { AdmissionsService } from "./admissions.service";
import {
    CreateAdmissionDto,
    BedTransferDto,
    DischargeClearanceDto,
    FinalizeDischargeDto,
    GenerateDischargeSummaryDto,
    QueryAdmissionsDto,
} from "./dto/admissions.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@UseGuards(JwtAuthGuard)
@Controller("admissions")
export class AdmissionsController {
    constructor(private readonly service: AdmissionsService) { }

    // POST /admissions
    @Post()
    create(@Body() dto: CreateAdmissionDto, @Req() req: Request) {
        const userId = (req.user as any)?.sub;
        return this.service.create(dto, userId);
    }

    // GET /admissions
    @Get()
    findAll(@Query() query: QueryAdmissionsDto) {
        return this.service.findAll(query);
    }

    // GET /admissions/:id
    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }

    // POST /admissions/:id/transfer
    @Post(":id/transfer")
    transferBed(@Param("id") id: string, @Body() dto: BedTransferDto, @Req() req: Request) {
        const userId = (req.user as any)?.sub;
        return this.service.transferBed(id, dto, userId);
    }

    // PATCH /admissions/:id/discharge/clearance
    @Patch(":id/discharge/clearance")
    @UseGuards(RolesGuard)
    @Roles("DOCTOR", "ADMIN")
    updateClearance(@Param("id") id: string, @Body() dto: DischargeClearanceDto, @Req() req: Request) {
        const userId = (req.user as any)?.sub;
        return this.service.updateDischargeClearance(id, dto, userId);
    }

    // POST /admissions/:id/discharge/finalize
    @Post(":id/discharge/finalize")
    @UseGuards(RolesGuard)
    @Roles("DOCTOR", "ADMIN")
    @HttpCode(HttpStatus.OK)
    finalizeDischarge(@Param("id") id: string, @Body() dto: FinalizeDischargeDto, @Req() req: Request) {
        const userId = (req.user as any)?.sub;
        return this.service.finalizeDischarge(id, dto, userId);
    }

    // POST /admissions/:id/discharge/generate-summary
    @Post(":id/discharge/generate-summary")
    @UseGuards(RolesGuard)
    @Roles("DOCTOR", "ADMIN")
    @HttpCode(HttpStatus.OK)
    generateDischargeSummary(@Param("id") id: string, @Body() dto: GenerateDischargeSummaryDto) {
        return this.service.generateDischargeSummary(id, dto.dischargeType);
    }

    // DELETE /admissions/:id — cancel
    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    cancel(@Param("id") id: string) {
        return this.service.cancel(id);
    }
}
