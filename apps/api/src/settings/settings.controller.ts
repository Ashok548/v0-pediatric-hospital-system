import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    async getAllSettings() {
        return this.settingsService.getSettings();
    }

    @Get(':category')
    async getCategorySettings(@Param('category') category: string) {
        return this.settingsService.getCategorySettings(category);
    }

    @Put(':category')
    async updateCategorySettings(
        @Param('category') category: string,
        @Body() data: Record<string, any>,
        @Body('changedBy') changedBy?: string,
    ) {
        // If the payload explicitly passes changedBy, extract it from data payload if it exists there, 
        // to avoid storing 'changedBy' literally in the settings.
        const { changedBy: extractedUser, ...actualData } = data;
        const user = changedBy || extractedUser || "system";

        return this.settingsService.updateCategorySettings(category, actualData, user);
    }
}
