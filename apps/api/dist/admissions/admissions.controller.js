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
exports.AdmissionsController = void 0;
const common_1 = require("@nestjs/common");
const admissions_service_1 = require("./admissions.service");
const admissions_dto_1 = require("./dto/admissions.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AdmissionsController = class AdmissionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        const userId = req.user?.sub;
        return this.service.create(dto, userId);
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    transferBed(id, dto, req) {
        const userId = req.user?.sub;
        return this.service.transferBed(id, dto, userId);
    }
    updateClearance(id, dto, req) {
        const userId = req.user?.sub;
        return this.service.updateDischargeClearance(id, dto, userId);
    }
    finalizeDischarge(id, dto, req) {
        const userId = req.user?.sub;
        return this.service.finalizeDischarge(id, dto, userId);
    }
    cancel(id) {
        return this.service.cancel(id);
    }
};
exports.AdmissionsController = AdmissionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admissions_dto_1.CreateAdmissionDto, Object]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admissions_dto_1.QueryAdmissionsDto]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(":id/transfer"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admissions_dto_1.BedTransferDto, Object]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "transferBed", null);
__decorate([
    (0, common_1.Patch)(":id/discharge/clearance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admissions_dto_1.DischargeClearanceDto, Object]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "updateClearance", null);
__decorate([
    (0, common_1.Post)(":id/discharge/finalize"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admissions_dto_1.FinalizeDischargeDto, Object]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "finalizeDischarge", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdmissionsController.prototype, "cancel", null);
exports.AdmissionsController = AdmissionsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("admissions"),
    __metadata("design:paramtypes", [admissions_service_1.AdmissionsService])
], AdmissionsController);
//# sourceMappingURL=admissions.controller.js.map