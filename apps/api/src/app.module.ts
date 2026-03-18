import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RolesModule } from "./roles/roles.module";
import { MasterModule } from "./master/master.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";
import { ConfigModule } from '@nestjs/config';
import { PatientsModule } from './patients/patients.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { NicuModule } from './nicu/nicu.module';
import { GrowthModule } from './growth/growth.module';
import { NursingModule } from './nursing/nursing.module';
import { BillingModule } from './billing/billing.module';
import { ReportsModule } from './reports/reports.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { LabsModule } from './labs/labs.module';
import { VaccinationsModule } from './vaccinations/vaccinations.module';
import { SettingsModule } from './settings/settings.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { TranscriptionsModule } from './transcriptions/transcriptions.module';
import { MedicalFormatModule } from './medical-format/medical-format.module';
import { OPVisitsModule } from './op-visits/op-visits.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, RolesModule, MasterModule, PatientsModule, AdmissionsModule, NicuModule, GrowthModule, NursingModule, BillingModule, ReportsModule, AppointmentsModule, PharmacyModule, ConsultationsModule, LabsModule, VaccinationsModule, SettingsModule, ServiceOrdersModule, TranscriptionsModule, MedicalFormatModule, OPVisitsModule],

  controllers: [AppController],
  providers: [
    AppService,
    // Apply JwtAuthGuard globally — all routes require auth by default
    // Use @Public() decorator to opt-out specific endpoints
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
