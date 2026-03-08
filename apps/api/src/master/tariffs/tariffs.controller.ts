import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from "@nestjs/common";
import { TariffsService } from "./tariffs.service";
import { CreateTariffPlanDto } from "./dto/create-tariff-plan.dto";
import { UpdateTariffPlanDto } from "./dto/update-tariff-plan.dto";
import { QueryTariffPlansDto } from "./dto/query-tariff-plans.dto";
import { UpsertTariffRateDto } from "./dto/upsert-tariff-rate.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("master/tariffs")
export class TariffsController {
    constructor(private tariffsService: TariffsService) { }

    // ─── Plans ──────────────────────────────────────────────────────────────────
    @Post()
    @HttpCode(HttpStatus.CREATED)
    createPlan(@Body() dto: CreateTariffPlanDto) {
        return this.tariffsService.createPlan(dto);
    }

    @Get()
    findAllPlans(@Query() query: QueryTariffPlansDto) {
        return this.tariffsService.findAllPlans(query);
    }

    @Get(":id")
    findOnePlan(@Param("id", ParseUUIDPipe) id: string) {
        return this.tariffsService.findOnePlan(id);
    }

    @Patch(":id")
    updatePlan(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateTariffPlanDto,
    ) {
        return this.tariffsService.updatePlan(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    toggleStatus(@Param("id", ParseUUIDPipe) id: string) {
        return this.tariffsService.toggleStatus(id);
    }

    // ─── Rates (within a plan) ─────────────────────────────────────────────────
    @Post(":id/rates")
    @HttpCode(HttpStatus.OK)
    upsertRate(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpsertTariffRateDto,
    ) {
        return this.tariffsService.upsertRate(id, dto);
    }

    @Delete(":id/rates/:serviceId")
    @HttpCode(HttpStatus.OK)
    deleteRate(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("serviceId") serviceId: string,
    ) {
        return this.tariffsService.deleteRate(id, serviceId);
    }
}
