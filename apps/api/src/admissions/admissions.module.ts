import { Module } from "@nestjs/common";
import { AdmissionsController } from "./admissions.controller";
import { AdmissionsService } from "./admissions.service";
import { MedicalFormatModule } from "../medical-format/medical-format.module";

@Module({
    imports: [MedicalFormatModule],
    controllers: [AdmissionsController],
    providers: [AdmissionsService],
    exports: [AdmissionsService],
})
export class AdmissionsModule { }
