import { Module } from "@nestjs/common";
import { FloorsController, BedsHierarchyController } from "./floors.controller";
import { FloorsService } from "./floors.service";

@Module({
    controllers: [FloorsController, BedsHierarchyController],
    providers: [FloorsService],
    exports: [FloorsService],
})
export class FloorsModule { }
