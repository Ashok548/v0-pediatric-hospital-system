import { Module } from "@nestjs/common";
import { FloorsModule } from "./floors/floors.module";
import { WardsModule } from "./wards/wards.module";
import { BedsModule } from "./beds/beds.module";
import { DepartmentsModule } from "./departments/departments.module";
import { ServicesModule } from "./services/services.module";
import { InsuranceModule } from "./insurance/insurance.module";
import { TariffsModule } from "./tariffs/tariffs.module";
import { LabsMasterModule } from "./labs/labs-master.module";

@Module({
    imports: [FloorsModule, WardsModule, BedsModule, DepartmentsModule, ServicesModule, InsuranceModule, TariffsModule, LabsMasterModule],
})
export class MasterModule { }
