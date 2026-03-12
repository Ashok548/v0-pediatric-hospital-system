import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from "@nestjs/common";
import { BedsService } from "./beds.service";
import { CreateBedDto } from "./dto/create-bed.dto";
import { UpdateBedDto } from "./dto/update-bed.dto";
import { QueryBedsDto } from "./dto/query-beds.dto";
import { BatchCreateBedsDto } from "./dto/batch-create-beds.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("master/beds")
export class BedsController {
    constructor(private bedsService: BedsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateBedDto) {
        return this.bedsService.create(dto);
    }

    @Post("batch")
    @HttpCode(HttpStatus.CREATED)
    batchCreate(@Body() dto: BatchCreateBedsDto) {
        return this.bedsService.batchCreate(dto);
    }

    @Get()
    findAll(@Query() query: QueryBedsDto) {
        return this.bedsService.findAll(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.bedsService.findOne(id);
    }

    @Patch(":id")
    @Roles("ADMIN", "DOCTOR", "NURSE")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateBedDto,
    ) {
        return this.bedsService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    softDelete(@Param("id", ParseUUIDPipe) id: string) {
        return this.bedsService.softDelete(id);
    }
}
