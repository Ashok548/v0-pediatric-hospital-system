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
exports.FloorsController = exports.BedsHierarchyController = void 0;
const common_1 = require("@nestjs/common");
const floors_service_1 = require("./floors.service");
const create_floor_dto_1 = require("./dto/create-floor.dto");
const update_floor_dto_1 = require("./dto/update-floor.dto");
const query_floors_dto_1 = require("./dto/query-floors.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
let BedsHierarchyController = class BedsHierarchyController {
    floorsService;
    constructor(floorsService) {
        this.floorsService = floorsService;
    }
    getHierarchy() {
        return this.floorsService.findHierarchy();
    }
};
exports.BedsHierarchyController = BedsHierarchyController;
__decorate([
    (0, common_1.Get)("hierarchy"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BedsHierarchyController.prototype, "getHierarchy", null);
exports.BedsHierarchyController = BedsHierarchyController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("beds"),
    __metadata("design:paramtypes", [floors_service_1.FloorsService])
], BedsHierarchyController);
let FloorsController = class FloorsController {
    floorsService;
    constructor(floorsService) {
        this.floorsService = floorsService;
    }
    create(dto) {
        return this.floorsService.create(dto);
    }
    findAll(query) {
        return this.floorsService.findAll(query);
    }
    findOne(id) {
        return this.floorsService.findOne(id);
    }
    update(id, dto) {
        return this.floorsService.update(id, dto);
    }
    softDelete(id) {
        return this.floorsService.softDelete(id);
    }
};
exports.FloorsController = FloorsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_floor_dto_1.CreateFloorDto]),
    __metadata("design:returntype", void 0)
], FloorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_floors_dto_1.QueryFloorsDto]),
    __metadata("design:returntype", void 0)
], FloorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FloorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_floor_dto_1.UpdateFloorDto]),
    __metadata("design:returntype", void 0)
], FloorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FloorsController.prototype, "softDelete", null);
exports.FloorsController = FloorsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, common_1.Controller)("master/floors"),
    __metadata("design:paramtypes", [floors_service_1.FloorsService])
], FloorsController);
//# sourceMappingURL=floors.controller.js.map