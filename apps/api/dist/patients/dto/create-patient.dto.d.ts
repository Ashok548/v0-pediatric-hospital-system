import { Gender } from "@carenest/database";
export declare class CreatePatientDto {
    firstName: string;
    lastName: string;
    gender: Gender;
    dateOfBirth: string;
    bloodGroup?: string;
    abhaId?: string;
    phone: string;
    email?: string;
    guardianName: string;
    guardianPhone?: string;
    guardianRelationship?: string;
    birthWeight?: number;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
}
