import type { Resource, ResourceCategory } from './types';
import treenalAntonyAvatar from '../../assets/images/avatars/treenal-antony.png';
import saharSalimAvatar from '../../assets/images/avatars/sahar-salim.png';
import aprilBalasonAvatar from '../../assets/images/avatars/avatar-5.png';
import sajithAvatar from '../../assets/images/avatars/avatar-2.png';
import porshiyaAvatar from '../../assets/images/avatars/avatar-3.png';
import ravinderAvatar from '../../assets/images/avatars/avatar-4.png';
import zawahirAvatar from '../../assets/images/avatars/yohani-jinadasa.png';
import pradeepAvatar from '../../assets/images/avatars/avatar-2.png';
import hanilDasAvatar from '../../assets/images/avatars/hanil-das.png';
import isuruAvatar from '../../assets/images/avatars/isuru-thilakarathne.png';

// Preview images for resources
import facultyHandbookPreview from '../../assets/images/resources/faculty-handbook-2025.png';
import brandGuidelinesPreview from '../../assets/images/resources/brand-guidelines.png';
import westfordAwardsPreview from '../../assets/images/resources/westford-awards-2025.png';
import westfordLogoPackPreview from '../../assets/images/resources/westford-logo-pack.png';
import performanceReviewPreview from '../../assets/images/resources/performance-review-template.png';
import hanilDasSignaturePreview from '../../assets/images/resources/hanil-das-signature.png';
import salesDeckPreview from '../../assets/images/resources/sales-deck-template.png';
import onboardingChecklistPreview from '../../assets/images/resources/onboarding-checklist.png';
import boardMeetingPreview from '../../assets/images/resources/board-meeting-q2.png';
import payrollPreview from '../../assets/images/resources/payroll-april-2025.png';
import laReussitePreview from '../../assets/images/resources/la-reussite-2025.png';
import workplacePortalPreview from '../../assets/images/resources/workplace-portal-figma.png';
import proposalNewProgramsPreview from '../../assets/images/resources/proposal-new-programs.png';
import annualReportPreview from '../../assets/images/resources/annual-report-2024.png';

export const resourceCategories: ResourceCategory[] = [
    { id: 'all', name: 'All Files', icon: 'all-files' },
    { id: 'my-files', name: 'My Files', icon: 'folder' },
    { id: 'it-tools', name: 'IT & Tools', icon: 'computer' },
    { id: 'forms-templates', name: 'Forms & Templates', icon: 'document' },
    { id: 'branding-assets', name: 'Branding Assets', icon: 'paintbrush' },
    { id: 'academic-resources', name: 'Academic Resources', icon: 'graduation-cap' },
    { id: 'operations-facilities', name: 'Operations & Facilities', icon: 'gear' },
    { id: 'marcom', name: 'MARCOM', icon: 'speaker' },
    { id: 'reports', name: 'Reports', icon: 'bar-chart' },
    { id: 'hr-policies', name: 'HR Policies', icon: 'hr' },
];

export const mockResources: Resource[] = [
    {
        id: 'res-1',
        title: 'Faculty Handbook 2025',
        category: 'Academic Resources',
        type: 'PDF',
        size: '26.1 MB',
        uploadedOn: new Date(2025, 3, 10, 10, 15),
        uploadedBy: { id: 'user-18', name: 'Treenal', avatar: treenalAntonyAvatar },
        lastModifiedOn: new Date(2025, 3, 10, 10, 15),
        previewImage: facultyHandbookPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-2',
        title: 'Brand Guidelines',
        category: 'Branding Assets',
        type: 'PDF',
        size: '12 MB',
        uploadedOn: new Date(2025, 1, 4, 8, 15),
        uploadedBy: { id: 'user-11', name: 'Sahar', avatar: saharSalimAvatar },
        lastModifiedOn: new Date(2025, 1, 4, 8, 15),
        previewImage: brandGuidelinesPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-3',
        title: 'Westford-Awards2025-Presentation.pptx',
        category: 'MARCOM',
        type: 'PPTX',
        size: '78 MB',
        uploadedOn: new Date(2025, 1, 3, 21, 25),
        uploadedBy: { id: 'user-5', name: 'April', avatar: aprilBalasonAvatar },
        lastModifiedOn: new Date(2025, 1, 3, 21, 25),
        previewImage: westfordAwardsPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-4',
        title: 'Westford Logo Pack',
        category: 'Branding Assets',
        type: 'ZIP',
        size: '225 MB',
        uploadedOn: new Date(2025, 0, 2, 21, 20),
        uploadedBy: { id: 'user-13', name: 'Sajith', avatar: sajithAvatar },
        lastModifiedOn: new Date(2025, 0, 2, 21, 20),
        previewImage: westfordLogoPackPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-5',
        title: 'Performance Review Template',
        category: 'Forms & Templates',
        type: 'Word',
        size: '1.2 MB',
        uploadedOn: new Date(2025, 0, 1, 7, 45),
        uploadedBy: { id: 'user-14', name: 'Porshiya', avatar: porshiyaAvatar },
        lastModifiedOn: new Date(2025, 0, 1, 7, 45),
        previewImage: performanceReviewPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-6',
        title: 'Hanil Das - Digital Signature',
        category: 'My Files',
        type: 'PNG',
        size: '340 KB',
        uploadedOn: new Date(2025, 1, 3, 7, 5),
        uploadedBy: { id: 'user-18', name: 'Treenal', avatar: treenalAntonyAvatar },
        lastModifiedOn: new Date(2025, 1, 3, 7, 5),
        previewImage: hanilDasSignaturePreview,
        audience: [
            { id: 'user-10', name: 'Hanil', avatar: hanilDasAvatar },
            { id: 'user-18', name: 'Treenal', avatar: treenalAntonyAvatar },
        ],
        description: 'Updated Email Signature as of 3rd Feb, 2025.',
    },
    {
        id: 'res-7',
        title: 'Sales Deck Template',
        category: 'MARCOM',
        type: 'PPT',
        size: '15.1 MB',
        uploadedOn: new Date(2024, 11, 26, 15, 10),
        uploadedBy: { id: 'user-15', name: 'Ravinder', avatar: ravinderAvatar },
        lastModifiedOn: new Date(2024, 11, 26, 15, 10),
        previewImage: salesDeckPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-8',
        title: 'Onboarding Checklist',
        category: 'HR Policies',
        type: 'Excel',
        size: '62 MB',
        uploadedOn: new Date(2024, 11, 25, 10, 30),
        uploadedBy: { id: 'user-12', name: 'Zawahir', avatar: zawahirAvatar },
        lastModifiedOn: new Date(2024, 11, 25, 10, 30),
        previewImage: onboardingChecklistPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-9',
        title: 'Board-Meeting-Q2-Slides',
        category: 'Reports',
        type: 'Slides',
        size: '2 MB',
        uploadedOn: new Date(2024, 11, 24, 14, 20),
        uploadedBy: { id: 'user-16', name: 'Pradeep', avatar: pradeepAvatar },
        lastModifiedOn: new Date(2024, 11, 24, 14, 20),
        previewImage: boardMeetingPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-10',
        title: 'Payroll-April2025.xlsx',
        category: 'HR Policies',
        type: 'Excel',
        size: '78 MB',
        uploadedOn: new Date(2024, 11, 23, 9, 15),
        uploadedBy: { id: 'user-10', name: 'Hanil', avatar: hanilDasAvatar },
        lastModifiedOn: new Date(2024, 11, 23, 9, 15),
        previewImage: payrollPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-11',
        title: 'La Reussite 2025',
        category: 'Academic Resources',
        type: 'Fldr',
        size: '26.1 MB',
        uploadedOn: new Date(2024, 11, 22, 11, 30),
        uploadedBy: { id: 'user-11', name: 'Sahar', avatar: saharSalimAvatar },
        lastModifiedOn: new Date(2024, 11, 22, 11, 30),
        previewImage: laReussitePreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-12',
        title: 'Workplace Portal - Figma Prototype',
        category: 'IT & Tools',
        type: 'URL',
        size: '12 MB',
        uploadedOn: new Date(2024, 11, 21, 16, 45),
        uploadedBy: { id: 'user-9', name: 'Isuru', avatar: isuruAvatar },
        lastModifiedOn: new Date(2024, 11, 21, 16, 45),
        previewImage: workplacePortalPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-13',
        title: 'Proposal-New Programs.pdf',
        category: 'Academic Resources',
        type: 'PDF',
        size: '8 MB',
        uploadedOn: new Date(2024, 11, 20, 10, 0),
        uploadedBy: { id: 'user-18', name: 'Treenal', avatar: treenalAntonyAvatar },
        lastModifiedOn: new Date(2024, 11, 20, 10, 0),
        previewImage: proposalNewProgramsPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
    {
        id: 'res-14',
        title: 'Annual Report 2024',
        category: 'Reports',
        type: 'PDF',
        size: '26.1 MB',
        uploadedOn: new Date(2024, 11, 19, 14, 30),
        uploadedBy: { id: 'user-11', name: 'Sahar', avatar: saharSalimAvatar },
        lastModifiedOn: new Date(2024, 11, 19, 14, 30),
        previewImage: annualReportPreview,
        audience: [{ id: 'all-staff', name: 'All Staff' }],
    },
];

