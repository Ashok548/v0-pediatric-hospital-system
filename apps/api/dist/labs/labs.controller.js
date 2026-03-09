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
exports.LabsController = void 0;
const common_1 = require("@nestjs/common");
const labs_service_1 = require("./labs.service");
const create_lab_order_dto_1 = require("./dto/create-lab-order.dto");
const update_lab_results_dto_1 = require("./dto/update-lab-results.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let LabsController = class LabsController {
    labsService;
    constructor(labsService) {
        this.labsService = labsService;
    }
    createOrder(createLabOrderDto, req) {
        return this.labsService.createOrder(createLabOrderDto, req.user.id);
    }
    findAll() {
        return this.labsService.findAll();
    }
    findByPatient(patientId) {
        return this.labsService.findByPatient(patientId);
    }
    findOne(id) {
        return this.labsService.findOne(id);
    }
    updateResults(panelId, updateDto) {
        return this.labsService.updatePanelResults(panelId, updateDto);
    }
    finalizeOrder(id, req) {
        return this.labsService.finalizeOrder(id, req.user.id);
    }
    collectSample(panelId) {
        return this.labsService.collectSample(panelId);
    }
    receiveSample(panelId) {
        return this.labsService.receiveSample(panelId);
    }
};
exports.LabsController = LabsController;
__decorate([
    (0, common_1.Post)('orders'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lab_order_dto_1.CreateLabOrderDto, Object]),
    __metadata("design:returntype", void 0)
], LabsController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('orders'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LabsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('orders/patient/:patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LabsController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LabsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)('panels/:panelId/results'),
    __param(0, (0, common_1.Param)('panelId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lab_results_dto_1.UpdateLabPanelResultsDto]),
    __metadata("design:returntype", void 0)
], LabsController.prototype, "updateResults", null);
__decorate([
    (0, common_1.Post)('orders/:id/finalize'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LabsController.prototype, "finalizeOrder", null);
__decorate([
    (0, common_1.Put)('panels/:panelId/collect'),
    __param(0, (0, common_1.Param)('panelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LabsController.prototype, "collectSample", null);
__decorate([
    (0, common_1.Put)('panels/:panelId/receive'),
    __param(0, (0, common_1.Param)('panelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LabsController.prototype, "receiveSample", null);
exports.LabsController = LabsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('labs'),
    __metadata("design:paramtypes", [labs_service_1.LabsService])
], LabsController);
//# sourceMappingURL=labs.controller.js.map