import {
    Controller, Get, Post, Patch, Body, Param, Query,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, Request
} from "@nestjs/common";
import { OPVisitsService } from "./op-visits.service";
import { CreateOPVisitDto, UpdateOPVisitStatusDto, QueryOPVisitsDto } from "./dto/op-visit.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("op-visits")
export class OPVisitsController {
    constructor(private readonly opVisitsService: OPVisitsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateOPVisitDto, @Request() req: any) {
        return this.opVisitsService.create(dto, req.user?.id);
    }

    @Get()
    findAll(@Query() query: QueryOPVisitsDto) {
        return this.opVisitsService.findAll(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.opVisitsService.findOne(id);
    }

    @Patch(":id/status")
    @HttpCode(HttpStatus.OK)
    updateStatus(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateOPVisitStatusDto,
        @Request() req: any,
    ) {
        return this.opVisitsService.updateStatus(id, dto, req.user?.id);
    }
}
