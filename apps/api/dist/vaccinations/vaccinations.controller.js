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
exports.VaccinationsController = void 0;
const common_1 = require("@nestjs/common");
const vaccinations_service_1 = require("./vaccinations.service");
const administer_vaccine_dto_1 = require("./dto/administer-vaccine.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let VaccinationsController = class VaccinationsController {
    vaccinationsService;
    constructor(vaccinationsService) {
        this.vaccinationsService = vaccinationsService;
    }
    getDashboardSummary() {
        return this.vaccinationsService.getDashboardSummary();
    }
    findByPatient(patientId) {
        return this.vaccinationsService.findByPatient(patientId);
    }
    generateSchedule(patientId) {
        return this.vaccinationsService.generateSchedule(patientId);
    }
    administerVaccine(id, dto, req) {
        return this.vaccinationsService.administerVaccine(id, dto, req.user.id);
    }
};
exports.VaccinationsController = VaccinationsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VaccinationsController.prototype, "getDashboardSummary", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VaccinationsController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Post)('generate-schedule/:patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VaccinationsController.prototype, "generateSchedule", null);
__decorate([
    (0, common_1.Put)(':id/administer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, administer_vaccine_dto_1.AdministerVaccineDto, Object]),
    __metadata("design:returntype", void 0)
], VaccinationsController.prototype, "administerVaccine", null);
exports.VaccinationsController = VaccinationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('vaccinations'),
    __metadata("design:paramtypes", [vaccinations_service_1.VaccinationsService])
], VaccinationsController);
//# sourceMappingURL=vaccinations.controller.js.map