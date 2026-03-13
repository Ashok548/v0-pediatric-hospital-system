import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query,
    UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from "@nestjs/common";
import { ServicesService } from "./services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { QueryServicesDto } from "./dto/query-services.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("master/services")
export class ServicesController {
    constructor(private servicesService: ServicesService) { }

    @Post()
    @Roles("ADMIN")
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateServiceDto) {
        return this.servicesService.create(dto);
    }

    @Post("seed-template")
    @Roles("ADMIN")
    @HttpCode(HttpStatus.CREATED)
    seedTemplate() {
        return this.servicesService.seedTemplate();
    }

    @Get()
    findAll(@Query() query: QueryServicesDto) {
        return this.servicesService.findAll(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.servicesService.findOne(id);
    }

    @Patch(":id")
    @Roles("ADMIN")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateServiceDto,
    ) {
        return this.servicesService.update(id, dto);
    }

    @Delete(":id")
    @Roles("ADMIN")
    @HttpCode(HttpStatus.OK)
    softDelete(@Param("id", ParseUUIDPipe) id: string) {
        return this.servicesService.softDelete(id);
    }
}
