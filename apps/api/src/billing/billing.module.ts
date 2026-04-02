import { Module, forwardRef } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { OPVisitsModule } from "../op-visits/op-visits.module";

@Module({
    imports: [forwardRef(() => OPVisitsModule)],
    controllers: [BillingController],
    providers: [BillingService],
    exports: [BillingService],
})
export class BillingModule { }
