import { Check, Edit, Upload, X } from 'lucide-react';
import { Skeleton } from '../components/common/Skeleton';
import React from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import AvatarPlaceholder from '../assets/images/avatar-placeholder-2.png';
import EmployeeRegistrationIcon from '../assets/icons/profile-tabs/employee-registration.svg';
import GeneralInfoIcon from '../assets/icons/profile-tabs/general-info.svg';
import OfficialDocumentsIcon from '../assets/icons/profile-tabs/official-documents.svg';
import OtherInfoIcon from '../assets/icons/profile-tabs/other-info.svg';
import ProfessionalRecordsIcon from '../assets/icons/profile-tabs/professional-records.svg';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import ProfessionalRecords from '../components/profile/ProfessionalRecords';
import OfficialDocuments from '../components/profile/OfficialDocuments';
import OtherInfo from '../components/profile/OtherInfo';
import CustomToast from '../components/common/CustomToast';
import Tooltip from '../components/ui/Tooltip';
import { profileService } from '../services/profileService';
import { authService } from '../services/authService';
import type {
    // GeneralInfoSaveRequest
} from '../types/profile';

type InfoItem = {
    label: string;
    value: string;
    inputType?: 'text' | 'gender' | 'file';
    span?: number;
};

type InfoSectionProps = {
    title: string;
    accentColor?: string;
    items: InfoItem[];
    isEditing: boolean;
    onChange: (label: string, value: string) => void;
    fullName?: string;
    designation?: string;
};

const InfoSection: React.FC<InfoSectionProps> = ({ title, items, accentColor, isEditing, onChange, fullName, designation }) => (
    <section className={`rounded-2xl border-2 border-[#E6E6E6] bg-white p-4 shadow-[0px_2px_4px_0px_#0000001A] sm:p-6`}>
        <div className='mb-6 flex flex-wrap items-center gap-2.5'>
            <div className={`w-1 h-5 rounded-full`} style={{ backgroundColor: accentColor }}></div>
            <h2 className="text-lg font-normal">{title}</h2>
        </div>

        <dl className="grid gap-x-[94px] gap-y-9 md:grid-cols-3">
            {items.map((item) => (
                <div key={item.label} className={`space-y-2 ${item.span === 2 ? 'md:col-span-2' : ''}`}>
                    {item.inputType === 'text' ? (
                        <>
                            <label className="mb-3 block text-sm font-medium sm:text-[15px]">{item.label}</label>
                            <input
                                type="text"
                                value={item.value}
                                readOnly={!isEditing}
                                onChange={(e) => onChange(item.label, e.target.value)}
                                className={`w-full rounded-[5px] border border-[#E6E6E6] p-2.5 text-[14px] leading-0 text-[#1C2745] outline-none bg-white`}
                            />
                        </>
                    ) : item.inputType === 'file' ? (
                        <>
                            {isEditing ? (
                                <div className='relative inline-block'>
                                    <span className="mb-2 inline-block text-sm font-medium sm:text-[15px]">{item.label}</span>
                                    <label htmlFor={item.label}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            id={item.label}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) onChange(item.label, URL.createObjectURL(file));
                                            }}
                                        />
                                        <div className="cursor-pointer flex w-full items-center gap-2.5 rounded-[5px] border border-[#E6E6E6] p-2 sm:w-fit">
                                            <div className="text-[#535352]">Upload</div>
                                            <Upload className='bg-[#1E88E5] rounded-full text-white p-1 w-6 h-6 mx-auto' />
                                        </div>
                                    </label>
                                    {item.value && (
                                        <img
                                            src={item.value}
                                            alt={item.label}
                                            className="mt-4 h-20 w-20 -translate-y-0 rounded-full object-cover sm:absolute sm:left-[calc(100%+30px)] sm:top-1/2 sm:mt-0 sm:h-[89px] sm:w-[89px] sm:-translate-y-1/2"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 lg:-mt-10 lg:flex-row lg:items-center lg:gap-[30px]">
                                    {item.value && (
                                        <img
                                            src={item.value}
                                            alt={item.label}
                                            className="h-24 w-24 rounded-full object-cover sm:h-[125px] sm:w-[125px]"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = AvatarPlaceholder;
                                            }}
                                        />
                                    )}
                                    <div className="text-center lg:text-left">
                                        <div className="text-xl font-semibold">{fullName || 'User Name'}</div>
                                        <div className="text-sm text-[#535352] sm:text-[15px]">{designation || 'Designation'}</div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : item.inputType === 'gender' ? (
                        <>
                            <label className="mb-2 block text-sm font-medium sm:text-[15px]">{item.label}</label>
                            {isEditing ? (
                                <div className="flex items-center gap-6">
                                    {['Male', 'Female'].map((genderOption) => {
                                        const isSelected = item.value === genderOption;
                                        return (
                                            <label
                                                key={genderOption}
                                                className="flex items-center gap-2 cursor-pointer select-none"
                                                onClick={() => onChange(item.label, genderOption)}
                                            >
                                                <div
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[#1E88E5] bg-[#1E88E5]' : 'border-[#E6E6E6] bg-white'
                                                        }`}
                                                >
                                                    {isSelected && <Check className="text-white w-6 h-6" strokeWidth={3} />}
                                                </div>
                                                <span className="text-sm">{genderOption}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5">
                                    <Check className="text-white bg-[#0198F1] rounded-full stroke-3" />
                                    <span className="text-sm font-medium">{item.value}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <dd className="text-sm font-medium text-[#1C2745] sm:text-base">{item.value}</dd>
                    )}
                </div>
            ))}
        </dl>
    </section>
);

type TabId = 'general' | 'records' | 'official' | 'info' | 'registration';

const InfoSectionSkeleton: React.FC = () => (
    <section className={`rounded-2xl border-2 border-[#E6E6E6] bg-white p-4 shadow-[0px_2px_4px_0px_#0000001A] sm:p-6`}>
        <div className='mb-6 flex flex-wrap items-center gap-2.5'>
            <Skeleton className="w-1 h-5 rounded-full" />
            <Skeleton className="h-6 w-32" />
        </div>

        <div className="grid gap-x-[94px] gap-y-9 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="mb-3 h-4 w-24" />
                    <Skeleton className="h-[42px] w-full rounded-[5px]" />
                </div>
            ))}
        </div>
    </section>
);

const Profile: React.FC = () => {
    const { setPageTitle } = useOutletContext<AppLayoutContext>();
    const location = useLocation();
    const [activeTab, setActiveTab] = React.useState<TabId>('general');
    const [isEditing, setIsEditing] = React.useState(false);
    const [toast, setToast] = React.useState<{ show: boolean; title: string; message: string; type?: 'success' | 'error' }>({
        show: false,
        title: '',
        message: '',
        type: 'success'
    });

    const [personalInfo, setPersonalInfo] = React.useState<InfoItem[]>([]);
    const [officialInfo, setOfficialInfo] = React.useState<InfoItem[]>([]);
    const [emergencyContact, setEmergencyContact] = React.useState<InfoItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [userFullName, setUserFullName] = React.useState<string>('');
    const [userDesignation, setUserDesignation] = React.useState<string>('');

    // Handle User ID retrieval
    const [profileId, setProfileId] = React.useState<number>(0);

    React.useEffect(() => {
        const userDataStr = authService.getUser();
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                const id = userData?.id || userData?.user?.id || 0;
                setProfileId(id);
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }
    }, []);

    const hasFetchedProfile = React.useRef(false);

    // Fetch profile data
    React.useEffect(() => {
        if (hasFetchedProfile.current) return;

        const fetchProfileData = async () => {
            try {
                hasFetchedProfile.current = true;
                setIsLoading(true);
                const response = await profileService.getProfileGeneralInfo();

                if (response.success && response.result) {
                    const data = response.result;

                    // Set user info for display
                    setUserFullName(data.personalInfo.fullName || '');
                    setUserDesignation(data.officialInformation.designation || '');

                    // Map Personal Info from nested structure
                    setPersonalInfo([
                        { label: 'Full Name', value: data.personalInfo.fullName || '', inputType: 'text' },
                        { label: 'Date of Birth', value: data.personalInfo.dateOfBirth ? new Date(data.personalInfo.dateOfBirth).toLocaleDateString() : '', inputType: 'text' },
                        { label: 'Profile Picture', value: data.personalInfo.profileImageUrl || AvatarPlaceholder, inputType: 'file' },
                        { label: 'Gender', value: data.personalInfo.gender || '', inputType: 'gender' },
                        { label: 'Nationality', value: data.personalInfo.nationality || '', inputType: 'text' },
                        { label: 'Religion', value: data.personalInfo.religion || '', inputType: 'text' },
                        { label: 'Marital Status', value: data.personalInfo.maritalStatus || '', inputType: 'text' },
                        { label: 'Blood Group', value: data.personalInfo.bloodGroup || '', inputType: 'text' },
                        { label: 'Residential Status', value: data.personalInfo.residentialStatus || '', inputType: 'text' },
                        { label: 'Personal Number', value: data.personalInfo.personalNumber || '', inputType: 'text' },
                        { label: 'Personal Email', value: data.personalInfo.personalEmail || '', inputType: 'text' },
                        { label: 'Present Address', value: data.personalInfo.presentAddress || '', inputType: 'text' },
                    ]);

                    // Map Official Info from nested structure
                    setOfficialInfo([
                        { label: 'Employee ID', value: data.officialInformation.employeeID || '', inputType: 'text' },
                        { label: 'Employment Type', value: data.officialInformation.employmentType || '', inputType: 'text' },
                        { label: 'Date of Joining', value: data.officialInformation.dateOfJoining ? new Date(data.officialInformation.dateOfJoining).toLocaleDateString() : '', inputType: 'text' },
                        { label: 'Designation', value: data.officialInformation.designation || '', inputType: 'text' },
                        { label: 'Official Email', value: data.officialInformation.officialEmail || '', inputType: 'text' },
                        { label: 'Official Number', value: data.officialInformation.officialNumber || '', inputType: 'text' },
                        { label: 'Business Unit', value: data.officialInformation.businessUnit || '', inputType: 'text' },
                        { label: 'Division', value: data.officialInformation.division || '', inputType: 'text' },
                        { label: 'Location', value: data.officialInformation.location || '', inputType: 'text' },
                        { label: 'Reporting Manager', value: data.officialInformation.reportingManager || '', inputType: 'text' },
                    ]);

                    // Map Emergency Contact from nested structure
                    setEmergencyContact([
                        { label: 'Contact Name', value: data.emergencyContact?.contactName || '', inputType: 'text' },
                        { label: 'Contact Number', value: data.emergencyContact?.contactNumber || '', inputType: 'text' },
                    ]);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setToast({
                    show: true,
                    title: 'Error',
                    message: error instanceof Error ? error.message : 'Failed to load profile information',
                    type: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const [backup, setBackup] = React.useState<{
        personalInfo: InfoItem[];
        officialInfo: InfoItem[];
        emergencyContact: InfoItem[];
    }>({ personalInfo: [], officialInfo: [], emergencyContact: [] });

    React.useEffect(() => {
        setPageTitle('My Profile');
    }, [setPageTitle, location.pathname]);

    const handleEdit = () => {
        setBackup({ personalInfo, officialInfo, emergencyContact });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setPersonalInfo(backup.personalInfo);
        setOfficialInfo(backup.officialInfo);
        setEmergencyContact(backup.emergencyContact);
        setIsEditing(false);
    };

    // const getFieldValue = (items: InfoItem[], label: string) => items.find(i => i.label === label)?.value || '';

    const handleChange = (
        sectionSetter: React.Dispatch<React.SetStateAction<InfoItem[]>>,
        section: InfoItem[],
        label: string,
        value: string
    ) => {
        sectionSetter(section.map((item) => (item.label === label ? { ...item, value } : item)));
    };

    const handleShowToast = (title: string, message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, title, message, type });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 3000);
    };

    const handleSave = async () => {
        try {
            console.log('Original Personl Info:', personalInfo);

            // Helper to parse date from DD/MM/YYYY to ISO or YYYY-MM-DD for API
            // Current input type is text and initialized with locale string.
            // If user didn't change it, it's locale string.
            // API expects ISO "date-time".
            // Let's attempt to parse. 
            // Note: The API actually returns "2000-11-20T00:00:00" format in GET.
            // We should try to send back standard ISO format.
            // const parseDate = (dateStr: string) => {
            //     if (!dateStr) return undefined;
            //     const d = new Date(dateStr);
            //     return isNaN(d.getTime()) ? undefined : d.toISOString();
            // };

            // const payload: GeneralInfoSaveRequest = {
            //     personalInfo: {
            //         fullName: getFieldValue(personalInfo, 'Full Name'),
            //         dateOfBirth: parseDate(getFieldValue(personalInfo, 'Date of Birth')),
            //         designation: userDesignation, // Kept separate or from state?
            //         gender: getFieldValue(personalInfo, 'Gender'),
            //         maritalStatus: getFieldValue(personalInfo, 'Marital Status'),
            //         personalNumber: getFieldValue(personalInfo, 'Personal Number'),
            //         nationality: getFieldValue(personalInfo, 'Nationality'),
            //         bloodGroup: getFieldValue(personalInfo, 'Blood Group'),
            //         personalEmail: getFieldValue(personalInfo, 'Personal Email'),
            //         religion: getFieldValue(personalInfo, 'Religion'),
            //         residentialStatus: getFieldValue(personalInfo, 'Residential Status'),
            //         presentAddress: getFieldValue(personalInfo, 'Present Address'),
            //         profileImageUrl: getFieldValue(personalInfo, 'Profile Picture'), // Note: this sends the URL string only
            //     },
            //     officialInformation: {
            //         employeeID: getFieldValue(officialInfo, 'Employee ID'),
            //         designation: getFieldValue(officialInfo, 'Designation'),
            //         businessUnit: getFieldValue(officialInfo, 'Business Unit'),
            //         reportingManager: getFieldValue(officialInfo, 'Reporting Manager'),
            //         employmentType: getFieldValue(officialInfo, 'Employment Type'),
            //         officialEmail: getFieldValue(officialInfo, 'Official Email'),
            //         division: getFieldValue(officialInfo, 'Division'),
            //         dateOfJoining: parseDate(getFieldValue(officialInfo, 'Date of Joining')),
            //         officialNumber: getFieldValue(officialInfo, 'Official Number'),
            //         location: getFieldValue(officialInfo, 'Location'),
            //     },
            //     emergencyContact: {
            //         contactName: getFieldValue(emergencyContact, 'Contact Name'),
            //         contactNumber: getFieldValue(emergencyContact, 'Contact Number'),
            //     }
            // };

            setIsLoading(true);
            // const response = await profileService.saveGeneralInfo(payload);

            // if (response.success) {
            //     handleShowToast('Success', 'Profile updated successfully');
            //     setIsEditing(false);
            //     // Optionally refetch or update state with response
            // } else {
            //     handleShowToast('Error', response.message || 'Failed to save profile');
            // }
            // handleShowToast('Info', 'Saving is currently disabled.');
            setIsEditing(false);

        } catch (error) {
            console.error('Save error:', error);
            handleShowToast('Error', 'Failed to save profile information');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRecord = async (_section: string, _data: Record<string, unknown>) => {
        try {
            if (!profileId) {
                handleShowToast('Error', 'User ID not found. Cannot save record.');
                return;
            }

            let response;
            /*
            switch (section) {
                case 'professionalReferences':
                    response = await profileService.saveProfessionalReference({
                        profileId,
                        name: data.name as string,
                        contact: data.contact as string,
                        email: data.email as string,
                        designation: data.designation as string,
                        company: data.company as string
                    });
                    break;
                case 'personalReferences':
                    response = await profileService.savePersonalReference({
                        profileId,
                        name: data.name as string,
                        contact: data.contact as string,
                        email: data.email as string,
                        designation: data.designation as string,
                        company: data.company as string
                    });
                    break;
                case 'qualifications':
                    response = await profileService.saveQualification({
                        profileId,
                        course: data.course as string,
                        institution: data.institution as string,
                        university: data.university as string,
                        yearOfPass: data.yearOfPass as string,
                        marksPercentage: data.marks as string
                    });
                    break;
                case 'experience':
                    response = await profileService.saveExperience({
                        profileId,
                        organization: data.organization as string,
                        designation: data.designation as string,
                        workingFrom: data.workingFrom as string, // API expects string, format dependent
                        workedTill: data.workedTill as string,
                        duration: data.duration as string
                    });
                    break;
                case 'bankAccounts':
                    response = await profileService.saveBankAccount({
                        profileId,
                        bank: data.bank as string,
                        branch: data.branch as string,
                        accountNumber: data.accountNo as string,
                        ibanNumber: data.ibanNo as string,
                        accountType: data.accountType as string,
                        nameOnAccount: data.name as string,
                        status: data.status as string
                    });
                    break;
                case 'otherDocuments':
                    // This likely requires file upload logic not fully covered by simple JSON
                    // mapped from existing services
                    response = await profileService.saveOtherDocument({
                        profileId,
                        documentName: data.document as string,
                        documentNumber: data.documentNo as string,
                        nameAsInDocument: data.nameAsInDocument as string,
                        issuedDate: data.issuedDate as string,
                        validTill: data.validTill as string,
                        status: data.status as string,
                        // File upload not handled in this JSON payload
                    });
                    break;
                default:
                    handleShowToast('Info', 'This section cannot be updated yet.');
                    return;
            }
            */
            // handleShowToast('Info', 'Adding records is currently disabled.');
            return;

            if (response && response.success) {
                handleShowToast('Success', 'Record added successfully');
                // Refresh data 
                // We could reload the window or refetch. 
                // Ideally refetch specific section. 
                // For now, let's just show toast.
            } else if (response) {
                handleShowToast('Error', response.message || 'Failed to add record');
            }
        } catch (error) {
            console.error('Add record error:', error);
            handleShowToast('Error', 'Failed to add record');
        }
    };

    const handleEditRecord = async (_section: string, _id: string, _data: Record<string, unknown>) => {
        try {
            if (!profileId) {
                handleShowToast('Error', 'User ID not found. Cannot update record.');
                return;
            }

            // const recordId = parseInt(id);
            let response;
            /*
            switch (section) {
                case 'professionalReferences':
                    response = await profileService.saveProfessionalReference({
                        profileId,
                        id: recordId,
                        name: data.name as string,
                        contact: data.contact as string,
                        email: data.email as string,
                        designation: data.designation as string,
                        company: data.company as string
                    });
                    break;
                case 'personalReferences':
                    response = await profileService.savePersonalReference({
                        profileId,
                        id: recordId,
                        name: data.name as string,
                        contact: data.contact as string,
                        email: data.email as string,
                        designation: data.designation as string,
                        company: data.company as string
                    });
                    break;
                case 'qualifications':
                    response = await profileService.saveQualification({
                        profileId,
                        id: recordId,
                        course: data.course as string,
                        institution: data.institution as string,
                        university: data.university as string,
                        yearOfPass: data.yearOfPass as string,
                        marksPercentage: data.marks as string
                    });
                    break;
                case 'experience':
                    response = await profileService.saveExperience({
                        profileId,
                        id: recordId,
                        organization: data.organization as string,
                        designation: data.designation as string,
                        workingFrom: data.workingFrom as string,
                        workedTill: data.workedTill as string,
                        duration: data.duration as string
                    });
                    break;
                case 'bankAccounts':
                    response = await profileService.saveBankAccount({
                        profileId,
                        id: recordId,
                        bank: data.bank as string,
                        branch: data.branch as string,
                        accountNumber: data.accountNo as string,
                        ibanNumber: data.ibanNo as string,
                        accountType: data.accountType as string,
                        nameOnAccount: data.name as string,
                        status: data.status as string
                    });
                    break;
                case 'otherDocuments':
                    response = await profileService.saveOtherDocument({
                        profileId,
                        id: recordId,
                        documentName: data.document as string,
                        documentNumber: data.documentNo as string,
                        nameAsInDocument: data.nameAsInDocument as string,
                        issuedDate: data.issuedDate as string,
                        validTill: data.validTill as string,
                        status: data.status as string,
                    });
                    break;
                default:
                    handleShowToast('Info', 'This section cannot be updated yet.');
                    return;
            }
            */
            // handleShowToast('Info', 'Updating records is currently disabled.');
            return;

            if (response && response.success) {
                handleShowToast('Success', 'Record updated successfully');
            } else if (response) {
                handleShowToast('Error', response.message || 'Failed to update record');
            }
        } catch (error) {
            console.error('Update record error:', error);
            handleShowToast('Error', 'Failed to update record');
        }
    };

    const handleDeleteRecord = (_section: string, _id: string) => {
        // API does not expose explicit delete endpoints for these resources in available JSON.
        // Usually Save with specific status or separate endpoint.
        // Without endpoint, we can't implement delete safely.
        handleShowToast('Info', 'Delete not supported for this section.');
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Tabs */}
            <div className="flex flex-wrap gap-3 px-2.5 py-[25px] sm:gap-5">
                {[
                    { id: 'general', label: 'General Info', icon: GeneralInfoIcon },
                    { id: 'records', label: 'Professional Records', icon: ProfessionalRecordsIcon },
                    { id: 'official', label: 'Official Documents', icon: OfficialDocumentsIcon },
                    { id: 'info', label: 'Other Info', icon: OtherInfoIcon },
                    { id: 'registration', label: 'Employee Registration', icon: EmployeeRegistrationIcon },
                ].map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as TabId)}
                            className={`cursor-pointer flex items-center gap-[5px] rounded-full px-[15px] py-1.5 text-xs font-medium text-white transition-all sm:text-sm ${isActive ? 'bg-[#1E88E5]' : 'bg-[#232725]'
                                }`}
                        >
                            <img src={tab.icon} className='w-5 h-5' alt={tab.label} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="overflow-y-auto rounded-[10px] ">
                {/* General Tab Content */}
                {activeTab === 'general' && (
                    <div className="relative grid gap-4 rounded-[10px] bg-white p-4 sm:gap-[15px] sm:p-[15px]">
                        {isLoading ? (
                            <>
                                {/* Edit Button Skeleton */}
                                <div className="absolute right-6 top-6">
                                    <Skeleton className="h-7 w-7 rounded-full" />
                                </div>

                                <InfoSectionSkeleton />
                                <InfoSectionSkeleton />
                                <InfoSectionSkeleton />
                            </>
                        ) : (
                            <>
                                {!isEditing ? (
                                    <div className="absolute right-6 top-6">
                                        <Tooltip content="Edit Profile" side="bottom" delay={300}>
                                            <button
                                                type="button"
                                                onClick={handleEdit}
                                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#1E88E5] transition-colors hover:bg-[#1669BB]"
                                            >
                                                <Edit className='mx-auto h-4 w-4 text-white' strokeWidth={2} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#D93025] transition-colors hover:bg-[#C62828] sm:right-6 sm:top-6 sm:h-10 sm:w-10 lg:right-[35px] lg:top-[35px]"
                                    >
                                        <X className='mx-auto h-4 w-4 text-white' strokeWidth={3} />
                                    </button>
                                )}


                                <InfoSection
                                    title="Personal Info"
                                    items={personalInfo}
                                    accentColor="#DE4A2C"
                                    isEditing={isEditing}
                                    onChange={(label, value) => handleChange(setPersonalInfo, personalInfo, label, value)}
                                    fullName={userFullName}
                                    designation={userDesignation}
                                />
                                <InfoSection
                                    title="Official Information"
                                    items={officialInfo}
                                    accentColor="#1E88E5"
                                    isEditing={isEditing}
                                    onChange={(label, value) => handleChange(setOfficialInfo, officialInfo, label, value)}
                                />
                                <InfoSection
                                    title="Emergency Contact"
                                    items={emergencyContact}
                                    accentColor="#FFB74D"
                                    isEditing={isEditing}
                                    onChange={(label, value) => handleChange(setEmergencyContact, emergencyContact, label, value)}
                                />

                                {isEditing && (
                                    <div className="flex flex-wrap items-center gap-3 justify-end sm:gap-5 lg:absolute lg:bottom-[35px] lg:right-[35px]">
                                        <button type="button" onClick={handleCancel} className="w-full cursor-pointer rounded-full border border-[#CACACA] px-6 py-2.5 font-semibold transition-colors hover:bg-[#F5F5F5] sm:w-auto">
                                            Cancel
                                        </button>
                                        <button type="button" onClick={handleSave} className="w-full cursor-pointer rounded-full bg-[#DE4A2C] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-[#B7321F] sm:w-auto">
                                            Save
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Professional Records Tab Content */}
                {activeTab === 'records' && (
                    <div className="space-y-4">
                        <ProfessionalRecords
                            onAddRecord={handleAddRecord}
                            onEditRecord={handleEditRecord}
                            onDeleteRecord={handleDeleteRecord}
                            onShowToast={handleShowToast}
                        />
                    </div>
                )}

                {/* Official Documents Tab Content */}
                {activeTab === 'official' && (
                    <div className="space-y-4">
                        <OfficialDocuments
                            onAddRecord={handleAddRecord}
                            onEditRecord={handleEditRecord}
                            onDeleteRecord={handleDeleteRecord}
                            onShowToast={handleShowToast}
                        />
                    </div>
                )}

                {/* Other Info Tab Content */}
                {activeTab === 'info' && (
                    <div className="space-y-4">
                        <OtherInfo
                            onAddRecord={handleAddRecord}
                            onEditRecord={handleEditRecord}
                            onDeleteRecord={handleDeleteRecord}
                            onShowToast={handleShowToast}
                        />
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            <CustomToast
                title={toast.title}
                message={toast.message}
                show={toast.show}
                type={toast.type}
                onClose={() => setToast((prev) => ({ ...prev, show: false }))}
            />
        </div>
    );
};

export default Profile;
