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
exports.NursingController = void 0;
const common_1 = require("@nestjs/common");
const nursing_service_1 = require("./nursing.service");
const create_nursing_note_dto_1 = require("./dto/create-nursing-note.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let NursingController = class NursingController {
    nursingService;
    constructor(nursingService) {
        this.nursingService = nursingService;
    }
    async getDepartmentHandover(department, shift) {
        const dept = department || 'NICU';
        const shiftPeriod = shift || 'MORNING';
        return this.nursingService.getDepartmentHandover(dept, shiftPeriod);
    }
    async getNotes(admissionId) {
        return this.nursingService.getNotesByAdmission(admissionId);
    }
    async createNote(admissionId, dto, user) {
        const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : 'System User';
        return this.nursingService.createNote(admissionId, dto, userName);
    }
    async deleteNote(id) {
        await this.nursingService.deleteNote(id);
        return { success: true };
    }
    async updateNote(id, dto) {
        return this.nursingService.updateNote(id, dto);
    }
    async getIoRecords(admissionId) {
        return this.nursingService.getIoRecordsByAdmission(admissionId);
    }
    async createIoRecord(admissionId, dto, user) {
        const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : 'System User';
        return this.nursingService.createIoRecord(admissionId, dto, userName);
    }
    async deleteIoRecord(id) {
        await this.nursingService.deleteIoRecord(id);
        return { success: true };
    }
    async updateIoRecord(id, dto) {
        return this.nursingService.updateIoRecord(id, dto);
    }
    async deleteVitalRecord(id) {
        await this.nursingService.deleteVitalRecord(id);
        return { success: true };
    }
};
exports.NursingController = NursingController;
__decorate([
    (0, common_1.Get)('handover'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DOCTOR', 'NURSE'),
    __param(0, (0, common_1.Query)('department')),
    __param(1, (0, common_1.Query)('shift')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "getDepartmentHandover", null);
__decorate([
    (0, common_1.Get)('notes/:admissionId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DOCTOR', 'NURSE'),
    __param(0, (0, common_1.Param)('admissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "getNotes", null);
__decorate([
    (0, common_1.Post)('notes/:admissionId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DOCTOR', 'NURSE'),
    __param(0, (0, common_1.Param)('admissionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_nursing_note_dto_1.CreateNursingNoteDto, Object]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "createNote", null);
__decorate([
    (0, common_1.Delete)('notes/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'NURSE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "deleteNote", null);
__decorate([
    (0, common_1.Patch)('notes/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DOCTOR', 'NURSE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_nursing_note_dto_1.UpdateNursingNoteDto]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "updateNote", null);
__decorate([
    (0, common_1.Get)('io/:admissionId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DOCTOR', 'NURSE'),
    __param(0, (0, common_1.Param)('admissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "getIoRecords", null);
__decorate([
    (0, common_1.Post)('io/:admissionId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DOCTOR', 'NURSE'),
    __param(0, (0, common_1.Param)('admissionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_nursing_note_dto_1.CreateIoRecordDto, Object]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "createIoRecord", null);
__decorate([
    (0, common_1.Delete)('io/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'NURSE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "deleteIoRecord", null);
__decorate([
    (0, common_1.Patch)('io/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DOCTOR', 'NURSE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_nursing_note_dto_1.UpdateIoRecordDto]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "updateIoRecord", null);
__decorate([
    (0, common_1.Delete)('vitals/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DOCTOR', 'NURSE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NursingController.prototype, "deleteVitalRecord", null);
exports.NursingController = NursingController = __decorate([
    (0, common_1.Controller)('nursing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [nursing_service_1.NursingService])
], NursingController);
//# sourceMappingURL=nursing.controller.js.map