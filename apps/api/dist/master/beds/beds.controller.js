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
exports.BedsController = void 0;
const common_1 = require("@nestjs/common");
const beds_service_1 = require("./beds.service");
const create_bed_dto_1 = require("./dto/create-bed.dto");
const update_bed_dto_1 = require("./dto/update-bed.dto");
const query_beds_dto_1 = require("./dto/query-beds.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
let BedsController = class BedsController {
    bedsService;
    constructor(bedsService) {
        this.bedsService = bedsService;
    }
    create(dto) {
        return this.bedsService.create(dto);
    }
    findAll(query) {
        return this.bedsService.findAll(query);
    }
    findOne(id) {
        return this.bedsService.findOne(id);
    }
    update(id, dto) {
        return this.bedsService.update(id, dto);
    }
    softDelete(id) {
        return this.bedsService.softDelete(id);
    }
};
exports.BedsController = BedsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bed_dto_1.CreateBedDto]),
    __metadata("design:returntype", void 0)
], BedsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_beds_dto_1.QueryBedsDto]),
    __metadata("design:returntype", void 0)
], BedsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BedsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bed_dto_1.UpdateBedDto]),
    __metadata("design:returntype", void 0)
], BedsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BedsController.prototype, "softDelete", null);
exports.BedsController = BedsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, common_1.Controller)("master/beds"),
    __metadata("design:paramtypes", [beds_service_1.BedsService])
], BedsController);
//# sourceMappingURL=beds.controller.js.map