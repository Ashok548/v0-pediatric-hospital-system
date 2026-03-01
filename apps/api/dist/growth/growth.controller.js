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
exports.GrowthController = void 0;
const common_1 = require("@nestjs/common");
const growth_service_1 = require("./growth.service");
const create_growth_record_dto_1 = require("./dto/create-growth-record.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let GrowthController = class GrowthController {
    growthService;
    constructor(growthService) {
        this.growthService = growthService;
    }
    findByPatient(patientId) {
        return this.growthService.findByPatient(patientId);
    }
    create(patientId, dto, req) {
        const userId = req.user?.id;
        return this.growthService.create(patientId, dto, userId);
    }
    remove(recordId) {
        return this.growthService.remove(recordId);
    }
};
exports.GrowthController = GrowthController;
__decorate([
    (0, common_1.Get)(":patientId"),
    (0, roles_decorator_1.Roles)("ADMIN", "DOCTOR", "NURSE"),
    __param(0, (0, common_1.Param)("patientId", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GrowthController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Post)(":patientId"),
    (0, roles_decorator_1.Roles)("ADMIN", "DOCTOR", "NURSE"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)("patientId", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_growth_record_dto_1.CreateGrowthRecordDto, Object]),
    __metadata("design:returntype", void 0)
], GrowthController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(":recordId"),
    (0, roles_decorator_1.Roles)("ADMIN", "NURSE"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("recordId", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GrowthController.prototype, "remove", null);
exports.GrowthController = GrowthController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("growth"),
    __metadata("design:paramtypes", [growth_service_1.GrowthService])
], GrowthController);
//# sourceMappingURL=growth.controller.js.map