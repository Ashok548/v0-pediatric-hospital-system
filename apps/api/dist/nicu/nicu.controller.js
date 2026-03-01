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
exports.NicuController = void 0;
const common_1 = require("@nestjs/common");
const nicu_service_1 = require("./nicu.service");
const create_vitals_dto_1 = require("./dto/create-vitals.dto");
const query_nicu_dto_1 = require("./dto/query-nicu.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let NicuController = class NicuController {
    nicuService;
    constructor(nicuService) {
        this.nicuService = nicuService;
    }
    findNicuAdmissions(query) {
        return this.nicuService.findNicuAdmissions(query);
    }
    findVitals(id) {
        return this.nicuService.findVitals(id);
    }
    recordVitals(id, dto, req) {
        const userId = req.user?.id;
        return this.nicuService.recordVitals(id, dto, userId);
    }
    deleteVitals(vid) {
        return this.nicuService.deleteVitals(vid);
    }
};
exports.NicuController = NicuController;
__decorate([
    (0, common_1.Get)("admissions"),
    (0, roles_decorator_1.Roles)("ADMIN", "DOCTOR", "NURSE"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_nicu_dto_1.QueryNicuDto]),
    __metadata("design:returntype", void 0)
], NicuController.prototype, "findNicuAdmissions", null);
__decorate([
    (0, common_1.Get)("admissions/:id/vitals"),
    (0, roles_decorator_1.Roles)("ADMIN", "DOCTOR", "NURSE"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NicuController.prototype, "findVitals", null);
__decorate([
    (0, common_1.Post)("admissions/:id/vitals"),
    (0, roles_decorator_1.Roles)("ADMIN", "DOCTOR", "NURSE"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_vitals_dto_1.CreateVitalsDto, Object]),
    __metadata("design:returntype", void 0)
], NicuController.prototype, "recordVitals", null);
__decorate([
    (0, common_1.Delete)("vitals/:vid"),
    (0, roles_decorator_1.Roles)("ADMIN", "NURSE"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("vid", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NicuController.prototype, "deleteVitals", null);
exports.NicuController = NicuController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("nicu"),
    __metadata("design:paramtypes", [nicu_service_1.NicuService])
], NicuController);
//# sourceMappingURL=nicu.controller.js.map