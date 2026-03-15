import type { ApiResponse } from './auth';

export interface PersonalInfo {
    fullName: string;
    dateOfBirth?: string;
    designation?: string;
    gender?: string;
    maritalStatus?: string;
    personalNumber?: string;
    nationality?: string;
    bloodGroup?: string;
    personalEmail?: string;
    religion?: string;
    residentialStatus?: string;
    presentAddress?: string;
    profileImageUrl?: string;
}

export interface OfficialInformation {
    employeeID: string;
    designation?: string;
    businessUnit?: string;
    reportingManager?: string;
    employmentType?: string;
    officialEmail?: string;
    division?: string;
    dateOfJoining?: string;
    officialNumber?: string;
    location?: string;
}

export interface EmergencyContact {
    contactName?: string;
    contactNumber?: string;
}

export interface ProfileGeneralInfo {
    personalInfo: PersonalInfo;
    officialInformation: OfficialInformation;
    emergencyContact?: EmergencyContact;
    profileImageUrl?: string;
}

export type ProfileGeneralInfoResponse = ApiResponse<ProfileGeneralInfo>;

export interface GeneralInfoSaveRequest {
    personalInfo: PersonalInfo;
    officialInformation: OfficialInformation;
    emergencyContact?: EmergencyContact;
}

export interface ProfessionalReferenceSaveRequest {
    profileId: number;
    id?: number;
    name?: string;
    contact?: string;
    email?: string;
    designation?: string;
    company?: string;
}

export interface PersonalReferenceSaveRequest {
    profileId: number;
    id?: number;
    name?: string;
    contact?: string;
    email?: string;
    designation?: string;
    company?: string;
}

export interface QualificationSaveRequest {
    profileId: number;
    id?: number;
    course?: string;
    institution?: string;
    university?: string;
    yearOfPass?: string;
    marksPercentage?: string;
}

export interface ExperienceSaveRequest {
    profileId: number;
    id?: number;
    organization?: string;
    designation?: string;
    workingFrom?: string;
    workedTill?: string;
    duration?: string;
}

export interface BankAccountSaveRequest {
    profileId: number;
    id?: number;
    bank?: string;
    branch?: string;
    accountNumber?: string;
    ibanNumber?: string;
    accountType?: string;
    nameOnAccount?: string;
    status?: string;
}

export interface OtherDocumentSaveRequest {
    profileId: number;
    id?: number;
    documentName?: string;
    downloadUrl?: string;
    documentNumber?: string;
    nameAsInDocument?: string;
    issuedDate?: string;
    validTill?: string;
    status?: string;
}
