import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from "@nestjs/common";
import { InsuranceService } from "./insurance.service";
import { CreateInsuranceDto } from "./dto/create-insurance.dto";
import { UpdateInsuranceDto } from "./dto/update-insurance.dto";
import { QueryInsuranceDto } from "./dto/query-insurance.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("master/insurance")
export class InsuranceController {
    constructor(private insuranceService: InsuranceService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateInsuranceDto) {
        return this.insuranceService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryInsuranceDto) {
        return this.insuranceService.findAll(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.insuranceService.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateInsuranceDto,
    ) {
        return this.insuranceService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    toggleStatus(@Param("id", ParseUUIDPipe) id: string) {
        return this.insuranceService.toggleStatus(id);
    }
}
