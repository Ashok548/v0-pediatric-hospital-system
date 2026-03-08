import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards, Req,
    HttpCode, HttpStatus, ParseUUIDPipe
} from "@nestjs/common";
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
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateBillDto) {
        return this.billingService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryBillsDto) {
        return this.billingService.findAll(query);
    }

    @Get("stats")
    getStats(@Query() query: BillingStatsQueryDto) {
        return this.billingService.getStats(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.billingService.findOne(id);
    }

    @Post(":id/items")
    @HttpCode(HttpStatus.OK)
    addItem(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: AddBillItemDto
    ) {
        return this.billingService.addItem(id, dto);
    }

    @Delete(":id/items/:itemId")
    @HttpCode(HttpStatus.OK)
    removeItem(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("itemId", ParseUUIDPipe) itemId: string
    ) {
        return this.billingService.removeItem(id, itemId);
    }

    @Post(":id/finalize")
    @HttpCode(HttpStatus.OK)
    finalizeBill(@Param("id", ParseUUIDPipe) id: string) {
        return this.billingService.finalizeBill(id);
    }

    @Post(":id/payments")
    @HttpCode(HttpStatus.OK)
    recordPayment(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: RecordPaymentDto,
        @Req() req: Request
    ) {
        const userId = (req.user as any)?.sub;
        return this.billingService.recordPayment(id, dto, userId);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    cancelBill(@Param("id", ParseUUIDPipe) id: string) {
        return this.billingService.cancelBill(id);
    }
}
