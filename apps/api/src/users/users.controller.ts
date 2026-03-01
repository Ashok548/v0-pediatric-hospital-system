import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { QueryUsersDto } from "./dto/query-users.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("users")
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryUsersDto) {
        return this.usersService.findAll(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserDto
    ) {
        return this.usersService.update(id, dto);
    }

    @Patch(":id/reset-password")
    @HttpCode(HttpStatus.OK)
    resetPassword(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: ResetPasswordDto
    ) {
        return this.usersService.resetPassword(id, dto);
    }

    @Patch(":id/deactivate")
    @HttpCode(HttpStatus.OK)
    deactivate(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: { id: string }
    ) {
        return this.usersService.deactivate(id, currentUser.id);
    }
}
