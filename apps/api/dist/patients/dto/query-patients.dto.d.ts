import { UserStatus } from "@carenest/database";
export declare class QueryPatientsDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    sortBy?: string;
    order?: "asc" | "desc";
}
