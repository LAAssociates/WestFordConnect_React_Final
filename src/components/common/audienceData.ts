import type { IndividualUser, ProjectGroup } from './AudienceDropdown';
import hanilDasAvatar from '../../assets/images/avatars/hanil-das.png';
import isuruThilakarathneAvatar from '../../assets/images/avatars/isuru-thilakarathne.png';
import saharSalimAvatar from '../../assets/images/avatars/sahar-salim.png';
import yohaniJinadasaAvatar from '../../assets/images/avatars/yohani-jinadasa.png';
import avatar2 from '../../assets/images/avatars/avatar-2.png';
import avatar3 from '../../assets/images/avatars/avatar-3.png';
import avatar4 from '../../assets/images/avatars/avatar-4.png';
import avatar5 from '../../assets/images/avatars/avatar-5.png';
import bhaktiMulyeAvatar from '../../assets/images/avatars/bhakti-mulye.png';
import treenalAntonyAvatar from '../../assets/images/avatars/treenal-antony.png';
import projectGroupAvatar1 from '../../assets/images/my-work/project-groups/1.png';
import projectGroupAvatar2 from '../../assets/images/my-work/project-groups/2.png';
import projectGroupAvatar3 from '../../assets/images/my-work/project-groups/3.png';
import projectGroupAvatar4 from '../../assets/images/my-work/project-groups/4.png';
import projectGroupAvatar5 from '../../assets/images/my-work/project-groups/5.png';

// Individual Users Data
// Consolidated from all components that use audience selection
export const individualUsers: IndividualUser[] = [
    {
        id: 'user-ana',
        name: 'Ana Mendes',
        position: 'Senior Admissions Officer',
        email: 'ana.mendes@westford.edu',
    },
    {
        id: 'user-ravi',
        name: 'Ravi Patel',
        position: 'Programme Director, MBA',
        email: 'ravi.patel@westford.edu',
    },
    {
        id: 'user-lucy',
        name: 'Lucy Fernandez',
        position: 'Corporate Partnerships Lead',
        email: 'lucy.fernandez@westford.edu',
    },
    {
        id: 'user-omar',
        name: 'Omar Hussein',
        position: 'Student Success Manager',
        email: 'omar.hussein@westford.edu',
    },
    {
        id: 'user-joyce',
        name: 'Joyce Martin',
        position: 'Lead Academic Counsellor',
        email: 'joyce.martin@westford.edu',
    },
    {
        id: 'user-1',
        name: 'You',
        position: 'CEO & Co-Founder',
        email: 'you@westford.edu',
    },
    {
        id: 'user-2',
        name: 'Akshaya Nair',
        position: 'Officer - Student Services',
        email: 'akshaya.nair@westford.edu',
    },
    {
        id: 'user-3',
        name: 'Anam Shahid',
        position: 'Faculty & Course leader',
        email: 'anam.shahid@westford.edu',
    },
    {
        id: 'user-4',
        name: 'Anne Jacob',
        position: 'Officer- Admissions',
        email: 'anne.jacob@westford.edu',
    },
    {
        id: 'user-5',
        name: 'April Balason',
        position: 'Executive- Operations',
        email: 'april.balason@westford.edu',
    },
    {
        id: 'user-6',
        name: 'Bennett Varghese',
        position: 'Officer- Admissions',
        email: 'bennett.varghese@westford.edu',
    },
    {
        id: 'user-7',
        name: 'Bethoven Filomeno',
        position: 'Senior Faculty',
        email: 'bethoven.filomeno@westford.edu',
    },
    {
        id: 'user-8',
        name: 'Bhakti Mulye',
        position: 'Associate Faculty',
        email: 'bhakti.mulye@westford.edu',
    },
    {
        id: 'user-9',
        name: 'Isuru',
        position: 'Developer',
        email: 'isuru@westford.edu',
    },
    {
        id: 'user-10',
        name: 'Hanil',
        position: 'CEO & Co-Founder',
        email: 'hanil@westford.edu',
    },
    {
        id: 'user-11',
        name: 'Sahar',
        position: 'Designer',
        email: 'sahar@westford.edu',
    },
    {
        id: 'user-12',
        name: 'Zawahir',
        position: 'QA Engineer',
        email: 'zawahir@westford.edu',
    },
    {
        id: 'user-13',
        name: 'Sajith',
        position: 'Officer-Student Services',
        email: 'sajith@westford.edu',
    },
    {
        id: 'user-14',
        name: 'Porshiya',
        position: 'Faculty',
        email: 'porshiya@westford.edu',
    },
    {
        id: 'user-15',
        name: 'Ravinder',
        position: 'Staff',
        email: 'ravinder@westford.edu',
    },
    {
        id: 'user-16',
        name: 'Pradeep',
        position: 'Staff',
        email: 'pradeep@westford.edu',
    },
    {
        id: 'user-18',
        name: 'Treenal',
        position: 'Staff',
        email: 'treenal.antony@westford.edu',
    },
    // Project Group Members
    {
        id: 'mbr-elena',
        name: 'Elena Petrova',
        position: 'Director, Doctorate Programmes',
        email: 'elena.petrova@westford.edu',
    },
    {
        id: 'mbr-chris',
        name: 'Chris Walker',
        position: 'Programme Lead, MBA',
        email: 'chris.walker@westford.edu',
    },
    {
        id: 'mbr-fatima',
        name: 'Fatima Noor',
        position: 'Head of Executive Education',
        email: 'fatima.noor@westford.edu',
    },
    {
        id: 'mbr-samir',
        name: 'Samir Qureshi',
        position: 'MBA Student Ambassador',
        email: 'samir.qureshi@westford.edu',
    },
    {
        id: 'mbr-lina',
        name: 'Lina Al Said',
        position: 'Diploma Cohort Representative',
        email: 'lina.alsaid@westford.edu',
    },
    {
        id: 'mbr-ashley',
        name: 'Ashley Moore',
        position: 'Undergraduate Lead Ambassador',
        email: 'ashley.moore@westford.edu',
    },
    {
        id: 'mbr-ian',
        name: 'Ian Carter',
        position: 'HND Student Liaison',
        email: 'ian.carter@westford.edu',
    },
    {
        id: 'mbr-samira',
        name: 'Samira Khan',
        position: 'Partnerships Manager',
        email: 'samira.khan@westford.edu',
    },
    {
        id: 'mbr-nigel',
        name: 'Nigel Scott',
        position: 'Enterprise Relations Lead',
        email: 'nigel.scott@westford.edu',
    },
    {
        id: 'mbr-carmen',
        name: 'Carmen Silva',
        position: 'Alumni Relations Director',
        email: 'carmen.silva@westford.edu',
    },
    {
        id: 'mbr-james',
        name: 'James Patel',
        position: 'Community Engagement Officer',
        email: 'james.patel@westford.edu',
    },
    {
        id: 'mbr-dan',
        name: 'Danielle Brooks',
        position: 'Events Coordinator',
        email: 'danielle.brooks@westford.edu',
    },
    {
        id: 'mbr-kwame',
        name: 'Kwame Mensah',
        position: 'Regional Alumni Lead',
        email: 'kwame.mensah@westford.edu',
    },
];

// Avatar mapping for individual users
export const userAvatarMap: Record<string, string> = {
    'user-ana': avatar2,
    'user-ravi': avatar3,
    'user-lucy': avatar4,
    'user-omar': avatar5,
    'user-joyce': avatar2,
    'user-1': hanilDasAvatar,
    'user-2': avatar2,
    'user-3': avatar3,
    'user-4': avatar4,
    'user-5': avatar5,
    'user-6': avatar2,
    'user-7': avatar3,
    'user-8': bhaktiMulyeAvatar,
    'user-9': isuruThilakarathneAvatar,
    'user-10': hanilDasAvatar,
    'user-11': saharSalimAvatar,
    'user-12': yohaniJinadasaAvatar,
    'user-13': avatar4,
    'user-14': avatar3,
    'user-15': avatar4,
    'user-16': avatar2,
    'user-18': treenalAntonyAvatar,
    // Project Group Members
    'mbr-elena': avatar2,
    'mbr-chris': avatar3,
    'mbr-fatima': avatar4,
    'mbr-samir': avatar5,
    'mbr-lina': avatar2,
    'mbr-ashley': avatar3,
    'mbr-ian': avatar4,
    'mbr-samira': avatar5,
    'mbr-nigel': avatar2,
    'mbr-carmen': avatar3,
    'mbr-james': avatar4,
    'mbr-dan': avatar5,
    'mbr-kwame': avatar2,
};

// Helper function to get individual users with avatars
export const getIndividualUsersWithAvatars = (): IndividualUser[] => {
    return individualUsers.map((user) => ({
        ...user,
        avatar: userAvatarMap[user.id] || user.avatar,
    }));
};

// Project Groups Data
// Consolidated from all components - these are identical across all files
export const projectGroups: ProjectGroup[] = [
    {
        id: 'grp-program-board',
        name: 'La Réussite 2025 Team',
        avatar: projectGroupAvatar1,
        members: [
            { id: 'mbr-elena', name: 'Elena Petrova', position: 'Director, Doctorate Programmes' },
            { id: 'mbr-chris', name: 'Chris Walker', position: 'Programme Lead, MBA' },
            { id: 'mbr-fatima', name: 'Fatima Noor', position: 'Head of Executive Education' },
        ],
    },
    {
        id: 'grp-student-ambassadors',
        name: 'Marcom Team',
        avatar: projectGroupAvatar2,
        members: [
            { id: 'mbr-samir', name: 'Samir Qureshi', position: 'MBA Student Ambassador' },
            { id: 'mbr-lina', name: 'Lina Al Said', position: 'Diploma Cohort Representative' },
            { id: 'mbr-ashley', name: 'Ashley Moore', position: 'Undergraduate Lead Ambassador' },
            { id: 'mbr-ian', name: 'Ian Carter', position: 'HND Student Liaison' },
        ],
    },
    {
        id: 'grp-corporate',
        name: 'Self Study Platform - Project Group',
        avatar: projectGroupAvatar3,
        members: [
            { id: 'mbr-samira', name: 'Samira Khan', position: 'Partnerships Manager' },
            { id: 'mbr-nigel', name: 'Nigel Scott', position: 'Enterprise Relations Lead' },
        ],
    },
    {
        id: 'grp-alumni',
        name: 'Student Recruitment Drive - Core Team',
        avatar: projectGroupAvatar4,
        members: [
            { id: 'mbr-carmen', name: 'Carmen Silva', position: 'Alumni Relations Director' },
            { id: 'mbr-james', name: 'James Patel', position: 'Community Engagement Officer' },
            { id: 'mbr-dan', name: 'Danielle Brooks', position: 'Events Coordinator' },
            { id: 'mbr-kwame', name: 'Kwame Mensah', position: 'Regional Alumni Lead' },
        ],
    },
    {
        id: 'grp-partnerships',
        name: 'TEDx Internal Team',
        avatar: projectGroupAvatar5,
        members: [
            { id: 'mbr-carmen', name: 'Carmen Silva', position: 'Alumni Relations Director' },
            { id: 'mbr-james', name: 'James Patel', position: 'Community Engagement Officer' },
            { id: 'mbr-dan', name: 'Danielle Brooks', position: 'Events Coordinator' },
            { id: 'mbr-kwame', name: 'Kwame Mensah', position: 'Regional Alumni Lead' },
            { id: 'mbr-carmen', name: 'Carmen Silva', position: 'Alumni Relations Director' },
            { id: 'mbr-james', name: 'James Patel', position: 'Community Engagement Officer' },
            { id: 'mbr-dan', name: 'Danielle Brooks', position: 'Events Coordinator' },
            { id: 'mbr-kwame', name: 'Kwame Mensah', position: 'Regional Alumni Lead' },
            { id: 'mbr-carmen', name: 'Carmen Silva', position: 'Alumni Relations Director' },
            { id: 'mbr-james', name: 'James Patel', position: 'Community Engagement Officer' },
            { id: 'mbr-dan', name: 'Danielle Brooks', position: 'Events Coordinator' },
            { id: 'mbr-kwame', name: 'Kwame Mensah', position: 'Regional Alumni Lead' },
            { id: 'mbr-carmen', name: 'Carmen Silva', position: 'Alumni Relations Director' },
        ],
    },
];

