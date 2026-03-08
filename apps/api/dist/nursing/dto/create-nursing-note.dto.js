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
exports.UpdateIoRecordDto = exports.CreateIoRecordDto = exports.UpdateNursingNoteDto = exports.CreateNursingNoteDto = void 0;
const class_validator_1 = require("class-validator");
const mapped_types_1 = require("@nestjs/mapped-types");
class CreateNursingNoteDto {
    noteType;
    content;
    priority = 'NORMAL';
    shiftPeriod;
}
exports.CreateNursingNoteDto = CreateNursingNoteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNursingNoteDto.prototype, "noteType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNursingNoteDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NORMAL', 'URGENT', 'CRITICAL']),
    __metadata("design:type", String)
], CreateNursingNoteDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['MORNING', 'AFTERNOON', 'NIGHT']),
    __metadata("design:type", String)
], CreateNursingNoteDto.prototype, "shiftPeriod", void 0);
class UpdateNursingNoteDto extends (0, mapped_types_1.PartialType)(CreateNursingNoteDto) {
}
exports.UpdateNursingNoteDto = UpdateNursingNoteDto;
class CreateIoRecordDto {
    ioType;
    route;
    volumeMl;
    notes;
}
exports.CreateIoRecordDto = CreateIoRecordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['INTAKE', 'OUTPUT']),
    __metadata("design:type", String)
], CreateIoRecordDto.prototype, "ioType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateIoRecordDto.prototype, "route", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateIoRecordDto.prototype, "volumeMl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateIoRecordDto.prototype, "notes", void 0);
class UpdateIoRecordDto {
    ioType;
    route;
    volumeMl;
    notes;
}
exports.UpdateIoRecordDto = UpdateIoRecordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['INTAKE', 'OUTPUT']),
    __metadata("design:type", String)
], UpdateIoRecordDto.prototype, "ioType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIoRecordDto.prototype, "route", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateIoRecordDto.prototype, "volumeMl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIoRecordDto.prototype, "notes", void 0);
//# sourceMappingURL=create-nursing-note.dto.js.map