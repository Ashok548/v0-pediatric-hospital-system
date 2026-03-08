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
exports.TariffsController = void 0;
const common_1 = require("@nestjs/common");
const tariffs_service_1 = require("./tariffs.service");
const create_tariff_plan_dto_1 = require("./dto/create-tariff-plan.dto");
const update_tariff_plan_dto_1 = require("./dto/update-tariff-plan.dto");
const query_tariff_plans_dto_1 = require("./dto/query-tariff-plans.dto");
const upsert_tariff_rate_dto_1 = require("./dto/upsert-tariff-rate.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
let TariffsController = class TariffsController {
    tariffsService;
    constructor(tariffsService) {
        this.tariffsService = tariffsService;
    }
    createPlan(dto) {
        return this.tariffsService.createPlan(dto);
    }
    findAllPlans(query) {
        return this.tariffsService.findAllPlans(query);
    }
    findOnePlan(id) {
        return this.tariffsService.findOnePlan(id);
    }
    updatePlan(id, dto) {
        return this.tariffsService.updatePlan(id, dto);
    }
    toggleStatus(id) {
        return this.tariffsService.toggleStatus(id);
    }
    upsertRate(id, dto) {
        return this.tariffsService.upsertRate(id, dto);
    }
    deleteRate(id, serviceId) {
        return this.tariffsService.deleteRate(id, serviceId);
    }
};
exports.TariffsController = TariffsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tariff_plan_dto_1.CreateTariffPlanDto]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_tariff_plans_dto_1.QueryTariffPlansDto]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "findAllPlans", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "findOnePlan", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tariff_plan_dto_1.UpdateTariffPlanDto]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "toggleStatus", null);
__decorate([
    (0, common_1.Post)(":id/rates"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_tariff_rate_dto_1.UpsertTariffRateDto]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "upsertRate", null);
__decorate([
    (0, common_1.Delete)(":id/rates/:serviceId"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)("serviceId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "deleteRate", null);
exports.TariffsController = TariffsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, common_1.Controller)("master/tariffs"),
    __metadata("design:paramtypes", [tariffs_service_1.TariffsService])
], TariffsController);
//# sourceMappingURL=tariffs.controller.js.map