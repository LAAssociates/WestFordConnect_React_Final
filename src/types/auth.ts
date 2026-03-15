export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    picture?: string;
    accessToken?: string;
}

export interface AuthResult {
    user: User;
    accessToken?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    result: T;
    errors: string[] | null;
    requestId: string;
    timestamp: string;
}

export interface AuthResponse extends ApiResponse<AuthResult> { }

export interface GoogleAuthResponse extends ApiResponse<AuthResult> { }

export interface LoginCredentials {
    email: string;
    password: string;
}

// Profile Professional Records types
export interface ProfessionalReference {
    id: number;
    name: string;
    contact: string;
    email: string;
    designation: string;
    company: string;
}

export interface PersonalReference {
    id: number;
    name: string;
    contact: string;
    email: string;
    designation: string;
    company: string;
}

export interface Qualification {
    id: number;
    course: string;
    institution: string;
    university: string;
    yearOfPass: string;
    marksPercentage: string;
}

export interface Experience {
    id: number;
    organization: string;
    designation: string;
    workingFrom: string;
    workedTill: string;
    duration: string;
}

export interface BankAccount {
    id: number;
    bank: string;
    branch: string;
    accountNumber: string;
    ibanNumber: string;
    accountType: string;
    nameOnAccount: string;
    status: string;
}

export interface OtherDocument {
    id: number;
    documentName: string;
    downloadUrl: string;
    documentNumber: string;
    nameAsInDocument: string;
    issuedDate: string | null;
    validTill: string | null;
    status: string;
}

export interface ProfileProfessionalInfo {
    professionalReferences: ProfessionalReference[];
    personalReferences: PersonalReference[];
    qualifications: Qualification[];
    experience: Experience[];
    bankAccounts: BankAccount[];
    otherDocuments: OtherDocument[];
}

export type GetProfileProfessionalInfoResponse = ApiResponse<ProfileProfessionalInfo>;

// Official Documents types
export interface PassportDetail {
    id: number;
    forCode: string;
    forDesc: string;
    passportNumber: string;
    passportHolder: string;
    country: string;
    issuedDate: string | null;
    validTill: string | null;
    status: string;
    downloadUrl: string;
}

export interface VisaDetail {
    id: number;
    fileNumber: string;
    visaHolder: string;
    visaTypeCode: string | null;
    visaTypeDesc: string | null;
    country: string;
    issuedBy: string;
    issuedDate: string | null;
    validTill: string | null;
    statusCode: string;
    statusDesc: string;
    downloadUrl: string;
}

export interface ContractDetail {
    id: number;
    contract: string;
    startDate: string | null;
    endDate: string | null;
    statusCode: string;
    statusDesc: string;
    remarks: string;
}

export interface Asset {
    id: number;
    assetTypeCode: string;
    assetTypeDesc: string;
    detail: string;
    issuedOn: string | null;
    validTill: string | null;
    returnedOn: string | null;
    statusCode: string;
    statusDesc: string;
    value: string;
    remark: string;
}

export interface OfficialDocument {
    id: number;
    documentCode: string;
    documentDesc: string;
    documentNumber: string;
    nameAsInDocument: string;
    issuedDate: string | null;
    validTill: string | null;
    statusCode: string;
    statusDesc: string;
    downloadUrl: string;
}

export interface OfficialAuthorizedLetter {
    id: number;
    bank: string;
    branch: string;
    accountNumber: string;
    ibanNumber: string;
    accountTypeCode: string;
    accountTypeDesc: string;
    name: string;
    statusCode: string;
    statusDesc: string;
}

export interface ProfileOfficialDocInfo {
    passportDetails: PassportDetail[];
    visaDetails: VisaDetail[];
    contractDetails: ContractDetail[];
    assets: Asset[];
    otherDocuments: OfficialDocument[];
    officialAuthorizedLetters: OfficialAuthorizedLetter[];
}

export type GetProfileOfficialDocInfoResponse = ApiResponse<ProfileOfficialDocInfo>;

// Other Info types
export interface FamilyDetail {
    id: number;
    name: string;
    address: string;
    mobile: string;
    email: string;
    relation: string;
}

export interface NominationDetail {
    id: number;
    nominationFor: string;
    familyMember: string;
    nominationPercentage: string;
}

export interface ProfileOtherInfo {
    familyDetails: FamilyDetail[];
    nominationDetails: NominationDetail[];
}

export type GetProfileOtherInfoResponse = ApiResponse<ProfileOtherInfo>;
