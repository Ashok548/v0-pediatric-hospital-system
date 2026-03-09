export declare class SettingsService {
    private readonly prisma;
    getSettings(): Promise<any>;
    getCategorySettings(category: string): Promise<Record<string, any>>;
    updateCategorySettings(category: string, data: Record<string, any>, changedBy?: string): Promise<Record<string, any>>;
}
