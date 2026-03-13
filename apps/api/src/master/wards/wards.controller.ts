import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from "@nestjs/common";
import { WardsService } from "./wards.service";
import { CreateWardDto } from "./dto/create-ward.dto";
import { UpdateWardDto } from "./dto/update-ward.dto";
import { QueryWardsDto } from "./dto/query-wards.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("master/wards")
export class WardsController {
    constructor(private wardsService: WardsService) { }

    @Post()
    @Roles("ADMIN")
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateWardDto) {
        return this.wardsService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryWardsDto) {
        return this.wardsService.findAll(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.wardsService.findOne(id);
    }

    @Patch(":id")
    @Roles("ADMIN")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateWardDto,
    ) {
        return this.wardsService.update(id, dto);
    }

    @Delete(":id")
    @Roles("ADMIN")
    @HttpCode(HttpStatus.OK)
    softDelete(@Param("id", ParseUUIDPipe) id: string) {
        return this.wardsService.softDelete(id);
    }
}
