import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from "@nestjs/common";
import { FloorsService } from "./floors.service";
import { CreateFloorDto } from "./dto/create-floor.dto";
import { UpdateFloorDto } from "./dto/update-floor.dto";
import { QueryFloorsDto } from "./dto/query-floors.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

// ─── Public hierarchy endpoint (any logged-in user) ──────────────────────────
@UseGuards(JwtAuthGuard)
@Controller("beds")
export class BedsHierarchyController {
    constructor(private floorsService: FloorsService) { }

    @Get("hierarchy")
    getHierarchy() {
        return this.floorsService.findHierarchy();
    }
}

// ─── Admin-only master CRUD ───────────────────────────────────────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("master/floors")
export class FloorsController {
    constructor(private floorsService: FloorsService) { }

    @Post()
    @Roles("ADMIN")
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateFloorDto) {
        return this.floorsService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryFloorsDto) {
        return this.floorsService.findAll(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.floorsService.findOne(id);
    }

    @Patch(":id")
    @Roles("ADMIN")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateFloorDto,
    ) {
        return this.floorsService.update(id, dto);
    }

    @Delete(":id")
    @Roles("ADMIN")
    @HttpCode(HttpStatus.OK)
    softDelete(@Param("id", ParseUUIDPipe) id: string) {
        return this.floorsService.softDelete(id);
    }
}
