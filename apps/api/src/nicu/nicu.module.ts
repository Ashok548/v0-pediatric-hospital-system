import { Module } from "@nestjs/common"
import { NicuController } from "./nicu.controller"
import { NicuService } from "./nicu.service"

@Module({
    controllers: [NicuController],
    providers: [NicuService],
})
export class NicuModule { }
