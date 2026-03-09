import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getAllSettings(): Promise<any>;
    getCategorySettings(category: string): Promise<Record<string, any>>;
    updateCategorySettings(category: string, data: Record<string, any>, changedBy?: string): Promise<Record<string, any>>;
}
