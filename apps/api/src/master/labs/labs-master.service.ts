import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@carenest/database';

@Injectable()
export class LabsMasterService {
    async findAll() {
        return prisma.labTestProfile.findMany({
            where: { isActive: true },
            include: {
                parameters: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' }
                }
            },
            orderBy: { category: 'asc' }
        });
    }

    async findOne(id: string) {
        const profile = await prisma.labTestProfile.findUnique({
            where: { id },
            include: {
                parameters: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' }
                }
            }
        });
        
        if (!profile) {
            throw new NotFoundException(`Lab test profile ${id} not found`);
        }
        
        return profile;
    }
}
