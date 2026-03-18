import { Module } from "@nestjs/common";
import { OPVisitsController } from "./op-visits.controller";
import { OPVisitsService } from "./op-visits.service";

@Module({
    controllers: [OPVisitsController],
    providers: [OPVisitsService],
    exports: [OPVisitsService],
})
export class OPVisitsModule { }
