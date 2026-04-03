import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards, Req,
    HttpCode, HttpStatus, ParseUUIDPipe
} from "@nestjs/common";
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from "express";
import { BillingService } from "./billing.service";
import {
    CreateBillDto, AddBillItemDto,
    RecordPaymentDto, QueryBillsDto,
    BillingStatsQueryDto
} from "./dto/billing.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("billing")
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Post()
    @Roles('RECEPTIONIST', 'BILLING', 'ADMIN')
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateBillDto) {
        return this.billingService.create(dto);
    }

    @Get()
    @Roles('BILLING', 'RECEPTIONIST', 'ADMIN', 'DOCTOR')
    findAll(@Query() query: QueryBillsDto) {
        return this.billingService.findAll(query);
    }

    @Get("stats")
    @Roles('BILLING', 'ADMIN')
    getStats(@Query() query: BillingStatsQueryDto) {
        return this.billingService.getStats(query);
    }

    @Get(":id")
    @Roles('RECEPTIONIST', 'BILLING', 'ADMIN')
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.billingService.findOne(id);
    }

    @Post(":id/items")
    @Roles('RECEPTIONIST', 'BILLING', 'ADMIN')
    @HttpCode(HttpStatus.OK)
    addItem(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: AddBillItemDto
    ) {
        return this.billingService.addItem(id, dto);
    }

    @Delete(":id/items/:itemId")
    @Roles('RECEPTIONIST', 'BILLING', 'ADMIN')
    @HttpCode(HttpStatus.OK)
    removeItem(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("itemId", ParseUUIDPipe) itemId: string
    ) {
        return this.billingService.removeItem(id, itemId);
    }

    @Post(":id/finalize")
    @Roles('BILLING', 'ADMIN')
    @HttpCode(HttpStatus.OK)
    finalizeBill(
        @Param("id", ParseUUIDPipe) id: string,
        @Req() req: any
    ) {
        const userId = req.user?.id;
        return this.billingService.finalizeBill(id, userId);
    }

    @Post(":id/payments")
    @Roles('RECEPTIONIST', 'BILLING', 'ADMIN')
    @HttpCode(HttpStatus.OK)
    recordPayment(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: RecordPaymentDto,
        @Req() req: Request
    ) {
        const userId = (req.user as any)?.id;
        return this.billingService.recordPayment(id, dto, userId);
    }

    @Delete(":id")
    @Roles('ADMIN')
    @HttpCode(HttpStatus.OK)
    cancelBill(
        @Param("id", ParseUUIDPipe) id: string,
        @Req() req: any
    ) {
        const userId = req.user?.id;
        return this.billingService.cancelBill(id, userId);
    }
}
