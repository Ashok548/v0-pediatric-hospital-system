import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from "@nestjs/common";
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { QueryDepartmentsDto } from "./dto/query-departments.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("master/departments")
export class DepartmentsController {
    constructor(private departmentsService: DepartmentsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateDepartmentDto) {
        return this.departmentsService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryDepartmentsDto) {
        return this.departmentsService.findAll(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.departmentsService.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateDepartmentDto,
    ) {
        return this.departmentsService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    softDelete(@Param("id", ParseUUIDPipe) id: string) {
        return this.departmentsService.softDelete(id);
    }
}
