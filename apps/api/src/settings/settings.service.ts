import { Injectable } from '@nestjs/common';
import { prisma } from '@carenest/database';

@Injectable()
export class SettingsService {
    private readonly prisma = prisma;

    async getSettings() {
        const settings = await this.prisma.hospitalSettings.findMany();

        // Group by category
        const grouped = settings.reduce((acc: Record<string, any>, curr: any) => {
            const cat = curr.category.toLowerCase();
            if (!acc[cat]) acc[cat] = {};

            // Parse boolean or numbers if needed, but we keep it simple for now as strings
            let parsedValue: any = curr.value;
            if (parsedValue === "true") parsedValue = true;
            else if (parsedValue === "false") parsedValue = false;
            else if (!isNaN(Number(parsedValue)) && parsedValue.trim() !== '') {
                // Option to parse numbers, but maybe let's leave strings as strings if they are formatted, or parse if not. 
                // We'll trust the client side interpretation or just send parsed JSON
                try {
                    parsedValue = JSON.parse(curr.value);
                } catch (e) { }
            } else {
                try {
                    parsedValue = JSON.parse(curr.value);
                } catch (e) { }
            }

            acc[cat][curr.key] = parsedValue;
            return acc;
        }, {} as Record<string, any>);

        return grouped;
    }

    async getCategorySettings(category: string) {
        const settings = await this.prisma.hospitalSettings.findMany({
            where: { category: category.toUpperCase() },
        });

        const result: Record<string, any> = {};
        settings.forEach((s: any) => {
            let parsedValue: any = s.value;
            try {
                parsedValue = JSON.parse(s.value);
            } catch (e) { }
            result[s.key] = parsedValue;
        });

        return result;
    }

    async updateCategorySettings(category: string, data: Record<string, any>, changedBy: string = "system") {
        const cat = category.toUpperCase();

        // Fetch current settings to compare for audit log
        const currentSettings = await this.prisma.hospitalSettings.findMany({
            where: { category: cat }
        });
        const currentMap = new Map(currentSettings.map((s: any) => [s.key, s.value]));

        const transactions: any[] = [];
        for (const [key, value] of Object.entries(data)) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const oldValue = currentMap.get(key) || null;

            // Only log and update if the value actually changed
            if (oldValue !== stringValue) {
                // Upsert Setting
                transactions.push(
                    this.prisma.hospitalSettings.upsert({
                        where: { category_key: { category: cat, key: key } },
                        update: { value: stringValue },
                        create: { category: cat, key: key, value: stringValue }
                    })
                );

                // Create Audit Log Entry
                transactions.push(
                    this.prisma.settingsAuditLog.create({
                        data: {
                            category: cat,
                            key: key,
                            oldValue: oldValue,
                            newValue: stringValue,
                            changedBy: changedBy
                        }
                    })
                );
            }
        }

        if (transactions.length > 0) {
            await this.prisma.$transaction(transactions);
        }

        return this.getCategorySettings(category);
    }
}
