"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let SettingsService = class SettingsService {
    prisma = database_1.prisma;
    async getSettings() {
        const settings = await this.prisma.hospitalSettings.findMany();
        const grouped = settings.reduce((acc, curr) => {
            const cat = curr.category.toLowerCase();
            if (!acc[cat])
                acc[cat] = {};
            let parsedValue = curr.value;
            if (parsedValue === "true")
                parsedValue = true;
            else if (parsedValue === "false")
                parsedValue = false;
            else if (!isNaN(Number(parsedValue)) && parsedValue.trim() !== '') {
                try {
                    parsedValue = JSON.parse(curr.value);
                }
                catch (e) { }
            }
            else {
                try {
                    parsedValue = JSON.parse(curr.value);
                }
                catch (e) { }
            }
            acc[cat][curr.key] = parsedValue;
            return acc;
        }, {});
        return grouped;
    }
    async getCategorySettings(category) {
        const settings = await this.prisma.hospitalSettings.findMany({
            where: { category: category.toUpperCase() },
        });
        const result = {};
        settings.forEach((s) => {
            let parsedValue = s.value;
            try {
                parsedValue = JSON.parse(s.value);
            }
            catch (e) { }
            result[s.key] = parsedValue;
        });
        return result;
    }
    async updateCategorySettings(category, data, changedBy = "system") {
        const cat = category.toUpperCase();
        const currentSettings = await this.prisma.hospitalSettings.findMany({
            where: { category: cat }
        });
        const currentMap = new Map(currentSettings.map((s) => [s.key, s.value]));
        const transactions = [];
        for (const [key, value] of Object.entries(data)) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const oldValue = currentMap.get(key) || null;
            if (oldValue !== stringValue) {
                transactions.push(this.prisma.hospitalSettings.upsert({
                    where: { category_key: { category: cat, key: key } },
                    update: { value: stringValue },
                    create: { category: cat, key: key, value: stringValue }
                }));
                transactions.push(this.prisma.settingsAuditLog.create({
                    data: {
                        category: cat,
                        key: key,
                        oldValue: oldValue,
                        newValue: stringValue,
                        changedBy: changedBy
                    }
                }));
            }
        }
        if (transactions.length > 0) {
            await this.prisma.$transaction(transactions);
        }
        return this.getCategorySettings(category);
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)()
], SettingsService);
//# sourceMappingURL=settings.service.js.map