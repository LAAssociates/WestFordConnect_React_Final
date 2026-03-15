import { axiosClient } from './apiClient';
import type {
    ProfileGeneralInfoResponse,
    GeneralInfoSaveRequest,
    ProfessionalReferenceSaveRequest,
    PersonalReferenceSaveRequest,
    QualificationSaveRequest,
    ExperienceSaveRequest,
    BankAccountSaveRequest,
    OtherDocumentSaveRequest
} from '../types/profile';
import type {
    ApiResponse,
    GetProfileProfessionalInfoResponse,
    GetProfileOfficialDocInfoResponse,
    GetProfileOtherInfoResponse
} from '../types/auth';

class ProfileService {
    /**
     * Get general profile information for the authenticated user
     */
    async getProfileGeneralInfo(): Promise<ProfileGeneralInfoResponse> {
        try {
            const response = await axiosClient.get<ProfileGeneralInfoResponse>('/api/Profile/GetProfileGeneralInfo');
            const data = response.data;

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch profile information');
            }

            return data;
        } catch (error) {
            console.error('Get profile info error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch profile information');
        }
    }

    /**
     * Get professional records/profile information for the authenticated user
     */
    async getProfileProfessionalInfo(): Promise<GetProfileProfessionalInfoResponse> {
        try {
            const response = await axiosClient.get<GetProfileProfessionalInfoResponse>('/api/Profile/GetProfileProfessionalInfo');
            const data = response.data;

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch professional records');
            }

            return data;
        } catch (error) {
            console.error('Get professional records error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch professional records');
        }
    }

    /**
     * Get official documents/profile information for the authenticated user
     */
    async getProfileOfficialDocInfo(): Promise<GetProfileOfficialDocInfoResponse> {
        try {
            const response = await axiosClient.get<GetProfileOfficialDocInfoResponse>('/api/Profile/GetProfileOfficialDocInfo');
            const data = response.data;

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch official documents');
            }

            return data;
        } catch (error) {
            console.error('Get official documents error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch official documents');
        }
    }

    /**
     * Get other info/profile information for the authenticated user
     */
    async getProfileOtherInfo(): Promise<GetProfileOtherInfoResponse> {
        try {
            const response = await axiosClient.get<GetProfileOtherInfoResponse>('/api/Profile/GetProfileOtherInfo');
            const data = response.data;

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch other info');
            }

            return data;
        } catch (error) {
            console.error('Get other info error:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch other info');
        }
    }


    /**
     * Save general profile information
     */
    async saveGeneralInfo(data: GeneralInfoSaveRequest): Promise<ProfileGeneralInfoResponse> {
        try {
            const response = await axiosClient.post<ProfileGeneralInfoResponse>('/api/Profile/SaveGeneralInfo', data);
            const responseData = response.data;

            if (!responseData.success) {
                throw new Error(responseData.message || 'Failed to save general information');
            }

            return responseData;
        } catch (error) {
            console.error('Save general info error:', error);
            throw error instanceof Error ? error : new Error('Failed to save general information');
        }
    }

    /**
     * Save professional reference
     */
    async saveProfessionalReference(data: ProfessionalReferenceSaveRequest): Promise<ApiResponse<null>> {
        try {
            const response = await axiosClient.post<ApiResponse<null>>('/api/Profile/SaveProfessionalReference', data);
            const responseData = response.data;

            if (!responseData.success) {
                throw new Error(responseData.message || 'Failed to save professional reference');
            }

            return responseData;
        } catch (error) {
            console.error('Save professional reference error:', error);
            throw error instanceof Error ? error : new Error('Failed to save professional reference');
        }
    }

    /**
     * Save personal reference
     */
    async savePersonalReference(data: PersonalReferenceSaveRequest): Promise<ApiResponse<null>> {
        try {
            const response = await axiosClient.post<ApiResponse<null>>('/api/Profile/SavePersonalReference', data);
            const responseData = response.data;

            if (!responseData.success) {
                throw new Error(responseData.message || 'Failed to save personal reference');
            }

            return responseData;
        } catch (error) {
            console.error('Save personal reference error:', error);
            throw error instanceof Error ? error : new Error('Failed to save personal reference');
        }
    }

    /**
     * Save qualification
     */
    async saveQualification(data: QualificationSaveRequest): Promise<ApiResponse<null>> {
        try {
            const response = await axiosClient.post<ApiResponse<null>>('/api/Profile/SaveQualification', data);
            const responseData = response.data;

            if (!responseData.success) {
                throw new Error(responseData.message || 'Failed to save qualification');
            }

            return responseData;
        } catch (error) {
            console.error('Save qualification error:', error);
            throw error instanceof Error ? error : new Error('Failed to save qualification');
        }
    }

    /**
     * Save experience
     */
    async saveExperience(data: ExperienceSaveRequest): Promise<ApiResponse<null>> {
        try {
            const response = await axiosClient.post<ApiResponse<null>>('/api/Profile/SaveExperience', data);
            const responseData = response.data;

            if (!responseData.success) {
                throw new Error(responseData.message || 'Failed to save experience');
            }

            return responseData;
        } catch (error) {
            console.error('Save experience error:', error);
            throw error instanceof Error ? error : new Error('Failed to save experience');
        }
    }

    /**
     * Save bank account
     */
    async saveBankAccount(data: BankAccountSaveRequest): Promise<ApiResponse<null>> {
        try {
            const response = await axiosClient.post<ApiResponse<null>>('/api/Profile/SaveBankAccount', data);
            const responseData = response.data;

            if (!responseData.success) {
                throw new Error(responseData.message || 'Failed to save bank account');
            }

            return responseData;
        } catch (error) {
            console.error('Save bank account error:', error);
            throw error instanceof Error ? error : new Error('Failed to save bank account');
        }
    }

    /**
     * Save other document
     */
    async saveOtherDocument(data: OtherDocumentSaveRequest): Promise<ApiResponse<null>> {
        try {
            const response = await axiosClient.post<ApiResponse<null>>('/api/Profile/SaveOtherDocument', data);
            const responseData = response.data;

            if (!responseData.success) {
                throw new Error(responseData.message || 'Failed to save other document');
            }

            return responseData;
        } catch (error) {
            console.error('Save other document error:', error);
            throw error instanceof Error ? error : new Error('Failed to save other document');
        }
    }
}

export const profileService = new ProfileService();
