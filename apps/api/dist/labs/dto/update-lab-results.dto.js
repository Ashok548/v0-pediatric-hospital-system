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
exports.UpdateLabPanelResultsDto = exports.UpdateLabItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdateLabItemDto {
    id;
    parameterName;
    value;
    unit;
    refDisplay;
    refMin;
    refMax;
    criticalMin;
    criticalMax;
}
exports.UpdateLabItemDto = UpdateLabItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLabItemDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateLabItemDto.prototype, "parameterName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLabItemDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateLabItemDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateLabItemDto.prototype, "refDisplay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateLabItemDto.prototype, "refMin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateLabItemDto.prototype, "refMax", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateLabItemDto.prototype, "criticalMin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateLabItemDto.prototype, "criticalMax", void 0);
class UpdateLabPanelResultsDto {
    items;
}
exports.UpdateLabPanelResultsDto = UpdateLabPanelResultsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateLabItemDto),
    __metadata("design:type", Array)
], UpdateLabPanelResultsDto.prototype, "items", void 0);
//# sourceMappingURL=update-lab-results.dto.js.map