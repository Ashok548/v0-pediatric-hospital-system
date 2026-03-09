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
exports.PharmacyController = void 0;
const common_1 = require("@nestjs/common");
const pharmacy_service_1 = require("./pharmacy.service");
const pharmacy_dto_1 = require("./dto/pharmacy.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let PharmacyController = class PharmacyController {
    pharmacyService;
    constructor(pharmacyService) {
        this.pharmacyService = pharmacyService;
    }
    async getInventory() {
        const result = await this.pharmacyService.getInventory();
        return { data: result };
    }
    async getLowStockInventory() {
        const result = await this.pharmacyService.getLowStockInventory();
        return { data: result };
    }
    async adjustStock(medicationId, dto, req) {
        const result = await this.pharmacyService.adjustStock(medicationId, { ...dto, performedBy: req.user?.id || 'SYSTEM' });
        return { success: true, data: result };
    }
    async getPrescriptions(query) {
        const result = await this.pharmacyService.getPrescriptions(query);
        return { data: result };
    }
    async getPrescription(id) {
        const result = await this.pharmacyService.getPrescription(id);
        return { data: result };
    }
    async createPrescription(dto) {
        const result = await this.pharmacyService.createPrescription(dto);
        return { data: result };
    }
    async dispensePrescription(id, dto, req) {
        const dispensedBy = req.user.name || req.user.id;
        const result = await this.pharmacyService.dispensePrescription(id, dto, dispensedBy);
        return { data: result };
    }
    async returnPrescription(id, req) {
        const returnedBy = req.user.name || req.user.id;
        const result = await this.pharmacyService.returnPrescription(id, returnedBy);
        return { data: result };
    }
    async getStats() {
        const result = await this.pharmacyService.getStats();
        return { data: result };
    }
    async checkClearance(admissionId) {
        const result = await this.pharmacyService.checkClearance(admissionId);
        return { data: result };
    }
};
exports.PharmacyController = PharmacyController;
__decorate([
    (0, common_1.Get)('inventory'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Get)('inventory/low-stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getLowStockInventory", null);
__decorate([
    (0, common_1.Post)('inventory/:medicationId/adjust'),
    __param(0, (0, common_1.Param)('medicationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pharmacy_dto_1.AdjustStockDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Get)('prescriptions'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pharmacy_dto_1.GetPrescriptionsQueryDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getPrescriptions", null);
__decorate([
    (0, common_1.Get)('prescriptions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getPrescription", null);
__decorate([
    (0, common_1.Post)('prescriptions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pharmacy_dto_1.CreatePrescriptionDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "createPrescription", null);
__decorate([
    (0, common_1.Post)('prescriptions/:id/dispense'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pharmacy_dto_1.DispensePrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "dispensePrescription", null);
__decorate([
    (0, common_1.Post)('prescriptions/:id/return'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "returnPrescription", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('admission/:admissionId/clearance'),
    __param(0, (0, common_1.Param)('admissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "checkClearance", null);
exports.PharmacyController = PharmacyController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('pharmacy'),
    __metadata("design:paramtypes", [pharmacy_service_1.PharmacyService])
], PharmacyController);
//# sourceMappingURL=pharmacy.controller.js.map