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
exports.UpdatePatientDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const database_1 = require("@carenest/database");
class UpdatePatientDto {
    firstName;
    lastName;
    gender;
    dateOfBirth;
    bloodGroup;
    abhaId;
    phone;
    email;
    guardianName;
    guardianPhone;
    guardianRelationship;
    birthWeight;
    address;
    city;
    state;
    allergies;
}
exports.UpdatePatientDto = UpdatePatientDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(database_1.Gender),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "bloodGroup", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9]{2}-[0-9]{4}-[0-9]{4}-[0-9]{4}$/, { message: "ABHA ID must be in format XX-XXXX-XXXX-XXXX" }),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "abhaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\+?\d{10,15}$/, { message: "Phone must be 10-15 digits, optionally starting with +" }),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "guardianName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\+?\d{10,15}$/, { message: "Guardian phone must be 10-15 digits, optionally starting with +" }),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "guardianPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "guardianRelationship", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.1, { message: "Birth weight must be at least 0.1 kg" }),
    (0, class_validator_1.Max)(20, { message: "Birth weight cannot exceed 20 kg" }),
    __metadata("design:type", Number)
], UpdatePatientDto.prototype, "birthWeight", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdatePatientDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: "Pincode must be exactly 6 digits" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePatientDto.prototype, "allergies", void 0);
//# sourceMappingURL=update-patient.dto.js.map