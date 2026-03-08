import { TariffsService } from "./tariffs.service";
import { CreateTariffPlanDto } from "./dto/create-tariff-plan.dto";
import { UpdateTariffPlanDto } from "./dto/update-tariff-plan.dto";
import { QueryTariffPlansDto } from "./dto/query-tariff-plans.dto";
import { UpsertTariffRateDto } from "./dto/upsert-tariff-rate.dto";
export declare class TariffsController {
    private tariffsService;
    constructor(tariffsService: TariffsService);
    createPlan(dto: CreateTariffPlanDto): Promise<any>;
    findAllPlans(query: QueryTariffPlansDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOnePlan(id: string): Promise<any>;
    updatePlan(id: string, dto: UpdateTariffPlanDto): Promise<any>;
    toggleStatus(id: string): Promise<any>;
    upsertRate(id: string, dto: UpsertTariffRateDto): Promise<any>;
    deleteRate(id: string, serviceId: string): Promise<any>;
}
