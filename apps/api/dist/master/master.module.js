"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterModule = void 0;
const common_1 = require("@nestjs/common");
const floors_module_1 = require("./floors/floors.module");
const wards_module_1 = require("./wards/wards.module");
const beds_module_1 = require("./beds/beds.module");
const departments_module_1 = require("./departments/departments.module");
const services_module_1 = require("./services/services.module");
const insurance_module_1 = require("./insurance/insurance.module");
const tariffs_module_1 = require("./tariffs/tariffs.module");
let MasterModule = class MasterModule {
};
exports.MasterModule = MasterModule;
exports.MasterModule = MasterModule = __decorate([
    (0, common_1.Module)({
        imports: [floors_module_1.FloorsModule, wards_module_1.WardsModule, beds_module_1.BedsModule, departments_module_1.DepartmentsModule, services_module_1.ServicesModule, insurance_module_1.InsuranceModule, tariffs_module_1.TariffsModule],
    })
], MasterModule);
//# sourceMappingURL=master.module.js.map