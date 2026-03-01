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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryAdmissionsDto = exports.FinalizeDischargeDto = exports.DischargeClearanceDto = exports.BedTransferDto = exports.CreateAdmissionDto = void 0;
const class_validator_1 = require("class-validator");
const database_1 = require("@carenest/database");
class CreateAdmissionDto {
    patientId;
    admissionType;
    priority;
    department;
    admittingDoctorId;
    admissionDate;
    expectedDischarge;
    initialDiagnosis;
    bedId;
    gestationalAge;
    nicuRiskLevel;
}
exports.CreateAdmissionDto = CreateAdmissionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(database_1.AdmissionType),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "admissionType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(database_1.AdmissionPriority),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "admittingDoctorId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "admissionDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "expectedDischarge", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "initialDiagnosis", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "bedId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "gestationalAge", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateAdmissionDto.prototype, "nicuRiskLevel", void 0);
class BedTransferDto {
    toBedId;
    reason;
}
exports.BedTransferDto = BedTransferDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BedTransferDto.prototype, "toBedId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], BedTransferDto.prototype, "reason", void 0);
class DischargeClearanceDto {
    step;
    note;
}
exports.DischargeClearanceDto = DischargeClearanceDto;
__decorate([
    (0, class_validator_1.IsEnum)(["clinical", "pharmacy", "billing"]),
    __metadata("design:type", String)
], DischargeClearanceDto.prototype, "step", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DischargeClearanceDto.prototype, "note", void 0);
class FinalizeDischargeDto {
    dischargeType;
    dischargeSummary;
}
exports.FinalizeDischargeDto = FinalizeDischargeDto;
__decorate([
    (0, class_validator_1.IsEnum)(["NORMAL", "LAMA", "REFERRED", "EXPIRED"]),
    __metadata("design:type", String)
], FinalizeDischargeDto.prototype, "dischargeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FinalizeDischargeDto.prototype, "dischargeSummary", void 0);
class QueryAdmissionsDto {
    status;
    search;
    department;
    patientId;
    page;
    limit;
}
exports.QueryAdmissionsDto = QueryAdmissionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(database_1.AdmissionStatus),
    __metadata("design:type", String)
], QueryAdmissionsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdmissionsDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdmissionsDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryAdmissionsDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", Number)
], QueryAdmissionsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", Number)
], QueryAdmissionsDto.prototype, "limit", void 0);
//# sourceMappingURL=admissions.dto.js.map