"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getKpis(startDate, endDate) {
        return this.reportsService.getKpis(startDate, endDate);
    }
    getAdmissionsTrend(months) {
        return this.reportsService.getAdmissionsTrend(months ? parseInt(months, 10) : undefined);
    }
    getRevenueTrend(weeks) {
        return this.reportsService.getRevenueTrend(weeks ? parseInt(weeks, 10) : undefined);
    }
    getDepartmentCensus(startDate, endDate) {
        return this.reportsService.getDepartmentCensus(startDate, endDate);
    }
    getTopDiagnoses(limit, startDate, endDate) {
        return this.reportsService.getTopDiagnoses(limit ? parseInt(limit, 10) : undefined, startDate, endDate);
    }
    getVaccinationTrend(days) {
        return this.reportsService.getVaccinationTrend(days ? parseInt(days, 10) : undefined);
    }
    async exportCsv(res, startDate, endDate) {
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
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('kpis'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getKpis", null);
__decorate([
    (0, common_1.Get)('admissions-trend'),
    __param(0, (0, common_1.Query)('months')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getAdmissionsTrend", null);
__decorate([
    (0, common_1.Get)('revenue-trend'),
    __param(0, (0, common_1.Query)('weeks')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getRevenueTrend", null);
__decorate([
    (0, common_1.Get)('department-census'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDepartmentCensus", null);
__decorate([
    (0, common_1.Get)('top-diagnoses'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getTopDiagnoses", null);
__decorate([
    (0, common_1.Get)('vaccination-trend'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getVaccinationTrend", null);
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportCsv", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map