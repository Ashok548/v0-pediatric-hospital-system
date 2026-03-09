import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('kpis')
    getKpis(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.reportsService.getKpis(startDate, endDate);
    }

    @Get('admissions-trend')
    getAdmissionsTrend(@Query('months') months?: string) {
        return this.reportsService.getAdmissionsTrend(months ? parseInt(months, 10) : undefined);
    }

    @Get('revenue-trend')
    getRevenueTrend(@Query('weeks') weeks?: string) {
        return this.reportsService.getRevenueTrend(weeks ? parseInt(weeks, 10) : undefined);
    }

    @Get('department-census')
    getDepartmentCensus(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.reportsService.getDepartmentCensus(startDate, endDate);
    }

    @Get('top-diagnoses')
    getTopDiagnoses(
        @Query('limit') limit?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.reportsService.getTopDiagnoses(limit ? parseInt(limit, 10) : undefined, startDate, endDate);
    }

    @Get('vaccination-trend')
    getVaccinationTrend(@Query('days') days?: string) {
        return this.reportsService.getVaccinationTrend(days ? parseInt(days, 10) : undefined);
    }

    @Get('export')
    async exportCsv(
        @Res() res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        const csvString = await this.reportsService.generateExportCsv(startDate, endDate);

        let filename = 'carenest-report';
        if (startDate && endDate) {
            filename += `-${startDate.split('T')[0]}-to-${endDate.split('T')[0]}`;
        }
        filename += '.csv';

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvString);
    }
}
