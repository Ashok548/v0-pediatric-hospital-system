import { Injectable } from "@nestjs/common";
import { prisma } from "@carenest/database";

@Injectable()
export class RolesService {
    findAll() {
        return prisma.role.findMany({
            orderBy: { id: "asc" },
            select: { id: true, name: true, description: true },
        });
    }
}
