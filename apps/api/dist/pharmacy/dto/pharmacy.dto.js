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
exports.GetPrescriptionsQueryDto = exports.DispensePrescriptionDto = exports.DispenseItemDto = exports.CreatePrescriptionDto = exports.CreatePrescriptionItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const database_1 = require("@carenest/database");
class CreatePrescriptionItemDto {
    medicationId;
    prescribedQty;
}
exports.CreatePrescriptionItemDto = CreatePrescriptionItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrescriptionItemDto.prototype, "medicationId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePrescriptionItemDto.prototype, "prescribedQty", void 0);
class CreatePrescriptionDto {
    patientId;
    admissionId;
    doctorId;
    notes;
    items;
}
exports.CreatePrescriptionDto = CreatePrescriptionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "admissionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "doctorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreatePrescriptionItemDto),
    __metadata("design:type", Array)
], CreatePrescriptionDto.prototype, "items", void 0);
class DispenseItemDto {
    prescriptionItemId;
    dispensedQty;
}
exports.DispenseItemDto = DispenseItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DispenseItemDto.prototype, "prescriptionItemId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DispenseItemDto.prototype, "dispensedQty", void 0);
class DispensePrescriptionDto {
    items;
}
exports.DispensePrescriptionDto = DispensePrescriptionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DispenseItemDto),
    __metadata("design:type", Array)
], DispensePrescriptionDto.prototype, "items", void 0);
class GetPrescriptionsQueryDto {
    status;
    search;
    admissionId;
}
exports.GetPrescriptionsQueryDto = GetPrescriptionsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(database_1.PrescriptionStatus),
    __metadata("design:type", String)
], GetPrescriptionsQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetPrescriptionsQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetPrescriptionsQueryDto.prototype, "admissionId", void 0);
//# sourceMappingURL=pharmacy.dto.js.map