import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('kpis')
    getKpis() {
        return this.reportsService.getKpis();
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
    getDepartmentCensus() {
        return this.reportsService.getDepartmentCensus();
    }

    @Get('top-diagnoses')
    getTopDiagnoses(@Query('limit') limit?: string) {
        return this.reportsService.getTopDiagnoses(limit ? parseInt(limit, 10) : undefined);
    }
}
