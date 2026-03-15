import type { Task, Meeting, Attendance, Proposal, MIS, ExtraContribution, User, Lecture } from './types';
import type { Holiday, Birthday } from '../calendar/types';
import hanilDasAvatar from '../../assets/images/avatars/hanil-das.png';
import isuruThilakarathneAvatar from '../../assets/images/avatars/isuru-thilakarathne.png';
import saharSalimAvatar from '../../assets/images/avatars/sahar-salim.png';
import yohaniJinadasaAvatar from '../../assets/images/avatars/yohani-jinadasa.png';
import avatar2 from '../../assets/images/avatars/avatar-2.png';
import avatar3 from '../../assets/images/avatars/avatar-3.png';
import avatar4 from '../../assets/images/avatars/avatar-4.png';
import avatar5 from '../../assets/images/avatars/avatar-5.png';
import bhaktiMulyeAvatar from '../../assets/images/avatars/bhakti-mulye.png';
import charlesMensahAvatar from '../../assets/images/avatars/charles-mensah.png';
import rhythuMenonAvatar from '../../assets/images/avatars/rhythu-menon.png';
import ryanGarciaAvatar from '../../assets/images/avatars/ryan-garcia.png';
import shaaistaMukaddamAvatar from '../../assets/images/avatars/shaaista-mukaddam.png';
import treenalAntonyAvatar from '../../assets/images/avatars/treenal-antony.png';

import projectGroupAvatar1 from '../../assets/images/my-work/project-groups/1.png';
import projectGroupAvatar2 from '../../assets/images/my-work/project-groups/2.png';
import projectGroupAvatar3 from '../../assets/images/my-work/project-groups/3.png';
import projectGroupAvatar4 from '../../assets/images/my-work/project-groups/4.png';
import projectGroupAvatar5 from '../../assets/images/my-work/project-groups/5.png';

export const mockUsers: User[] = [
    { id: 'user-1', name: 'You', position: 'CEO & Co-Founder', email: 'you@westford.edu', avatar: hanilDasAvatar },
    { id: 'user-2', name: 'Akshaya Nair', position: 'Officer - Student Services', email: 'akshaya.nair@westford.edu', avatar: avatar2 },
    { id: 'user-3', name: 'Anam Shahid', position: 'Faculty & Course leader', email: 'anam.shahid@westford.edu', avatar: avatar3 },
    { id: 'user-4', name: 'Anne Jacob', position: 'Officer- Admissions', email: 'anne.jacob@westford.edu', avatar: avatar4 },
    { id: 'user-5', name: 'April Balason', position: 'Executive- Operations', email: 'april.balason@westford.edu', avatar: avatar5 },
    { id: 'user-6', name: 'Bennett Varghese', position: 'Officer- Admissions', email: 'bennett.varghese@westford.edu', avatar: avatar2 },
    { id: 'user-7', name: 'Bethoven Filomeno', position: 'Senior Faculty', email: 'bethoven.filomeno@westford.edu', avatar: avatar3 },
    { id: 'user-8', name: 'Bhakti Mulye', position: 'Associate Faculty', email: 'bhakti.mulye@westford.edu', avatar: bhaktiMulyeAvatar },
    { id: 'user-9', name: 'Isuru Thilakarathne', position: 'Developer', email: 'isuru@westford.edu', avatar: isuruThilakarathneAvatar },
    { id: 'user-10', name: 'Hanil Das', position: 'Manager', email: 'hanil@westford.edu', avatar: hanilDasAvatar },
    { id: 'user-11', name: 'Sahar Salim', position: 'Designer', email: 'sahar@westford.edu', avatar: saharSalimAvatar },
    { id: 'user-12', name: 'Zawahir Siddique', position: 'QA Engineer', email: 'zawahir@westford.edu', avatar: yohaniJinadasaAvatar },
    { id: 'user-13', name: 'Avijit Guin', position: 'Officer-Student Services', email: 'avijit.guin@westford.edu', avatar: avatar4 },
    { id: 'user-14', name: 'Charles Mensah', position: 'Faculty', email: 'charles.mensah@westford.edu', avatar: charlesMensahAvatar },
    { id: 'user-15', name: 'Rhythu Menon', position: 'Staff', email: 'rhythu.menon@westford.edu', avatar: rhythuMenonAvatar },
    { id: 'user-16', name: 'Ryan Garcia', position: 'Staff', email: 'ryan.garcia@westford.edu', avatar: ryanGarciaAvatar },
    { id: 'user-17', name: 'Shaaista Mukaddam', position: 'Staff', email: 'shaaista.mukaddam@westford.edu', avatar: shaaistaMukaddamAvatar },
    { id: 'user-18', name: 'Treenal Antony', position: 'Staff', email: 'treenal.antony@westford.edu', avatar: treenalAntonyAvatar },
];

export interface ProjectGroup {
    id: string;
    name: string;
    avatar?: string;
    iconUrl?: string;
    members: Array<{
        id: string;
        name: string;
        position: string;
    }>;
    memberCount?: number;
}

export const mockProjectGroups: ProjectGroup[] = [
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
        ]
    }
];

export const mockTasks: Task[] = [
    {
        id: 'task-1',
        title: 'Board Strategy Review Meeting',
        description: 'Quarterly board meeting to review gro...',
        status: 'todo',
        priority: 'high',
        dueDate: new Date(2025, 11, 3, 11, 0),
        dueTime: '11:00 AM',
        assignedTo: [
            mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4],
            mockUsers[5], mockUsers[6], mockUsers[7], mockUsers[8], mockUsers[9]
        ], // 10 assignees
        createdBy: mockUsers[1],
        createdAt: new Date(2025, 11, 1),
        updatedAt: new Date(2025, 11, 1),
        attachments: [
            { id: 'att-1', name: 'Strategic-Review-Q1-2025.pdf', type: 'pdf' }
        ],
        comments: [
            {
                id: 'comment-1',
                text: 'Looking forward to the meeting.',
                author: mockUsers[1],
                createdAt: new Date(2025, 11, 3, 10, 0),
                likes: 0,
                dislikes: 0,
            },
            {
                id: 'comment-2',
                text: 'Agenda looks good.',
                author: mockUsers[2],
                createdAt: new Date(2025, 11, 3, 14, 0),
                likes: 0,
                dislikes: 0,
            }
        ],
        teamsLink: 'https://teams.microsoft.com',
    },
    {
        id: 'task-2',
        title: 'Approve April payroll summary',
        description: '',
        status: 'todo',
        priority: 'high',
        dueDate: new Date(2025, 11, 4),
        dueTime: 'EOD',
        assignedTo: mockUsers[0],
        createdBy: mockUsers[2],
        createdAt: new Date(2025, 11, 2),
        updatedAt: new Date(2025, 11, 2),
        attachments: [
            { id: 'att-2', name: 'Payroll-April2025.xlsx', type: 'xlsx' }
        ],
        comments: [],
    },
    {
        id: 'task-3',
        title: 'Review Final Workplace Portal Prototype',
        description: 'This is the updated Workplace Portal Figma prototype, refined based on your feedback from the initial demo. It includes enhancements to the UI, streamlined workflows, and improved visual hierarchy to better align with our intended user experience. Kindly review the prototype and share your inputs or suggestions so we can incorporate them before moving on to the next stage of development.',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(2025, 11, 4),
        dueTime: 'EOD',
        assignedTo: [mockUsers[9], mockUsers[2], mockUsers[1], mockUsers[3]], // 4 assignees
        createdBy: mockUsers[8], // Isuru Thilakarathne
        createdAt: new Date(2025, 11, 3),
        updatedAt: new Date(2025, 11, 3),
        venue: 'N/A',
        attachments: [
            { id: 'att-3', name: 'Workplace Portal – Figma Prototype', type: 'link' },
            { id: 'att-4', name: 'Flow_Chart.pdf', type: 'pdf' }
        ],
        comments: [
            {
                id: 'comment-3-1',
                text: 'Looks great overall!',
                author: mockUsers[10],
                createdAt: new Date(2025, 11, 4, 10, 27),
                likes: 0,
                dislikes: 0,
            },
            {
                id: 'comment-3-2',
                text: 'Tested all the flows.',
                author: mockUsers[11],
                createdAt: new Date(2025, 11, 3, 15, 0),
                likes: 0,
                dislikes: 0,
            },
            {
                id: 'comment-3-3',
                text: 'Minor UI tweaks needed.',
                author: mockUsers[9],
                createdAt: new Date(2025, 11, 4, 10, 48),
                likes: 0,
                dislikes: 0,
            }
        ],
        showComments: true,
        addToCalendar: false,
    },
    {
        id: 'task-4',
        title: 'Catch-up with Marketing Team',
        description: '[Workplace Portal - Figma Prototype]',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(2025, 11, 4, 14, 30),
        dueTime: '2:30 PM',
        assignedTo: [
            mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4],
            mockUsers[5], mockUsers[6], mockUsers[7], mockUsers[8], mockUsers[9],
            mockUsers[10], mockUsers[11]
        ], // 12 assignees
        createdBy: mockUsers[4],
        createdAt: new Date(2025, 11, 1),
        updatedAt: new Date(2025, 11, 1),
        comments: [],
        location: "in Mr. Hanil's office",
    },
    {
        id: 'task-5',
        title: 'Final Review – Westford Awards Pr...',
        description: 'Final design and content review for th...',
        status: 'todo',
        priority: 'high',
        dueDate: new Date(2025, 11, 4),
        dueTime: 'December 4',
        assignedTo: [
            mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4],
            mockUsers[5], mockUsers[6], mockUsers[7], mockUsers[8], mockUsers[9]
        ], // 10 assignees
        createdBy: mockUsers[5],
        createdAt: new Date(2025, 11, 1),
        updatedAt: new Date(2025, 11, 1),
        attachments: [
            { id: 'att-5', name: 'Finance Dashboard', type: 'link' }
        ],
        comments: Array.from({ length: 15 }, (_, i) => ({
            id: `comment-5-${i + 1}`,
            text: `Comment ${i + 1}`,
            author: mockUsers[i % mockUsers.length],
            createdAt: new Date(2025, 11, 1 + i),
            likes: 0,
            dislikes: 0,
        })),
        department: 'Finance Dashboard',
        teamsLink: 'https://teams.microsoft.com',
    },
    {
        id: 'task-6',
        title: 'Prepare presentation for Westford...',
        description: '',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(2025, 11, 4, 10, 30),
        dueTime: '10:30 AM',
        assignedTo: [mockUsers[0], mockUsers[1]], // 2 assignees
        createdBy: mockUsers[6],
        createdAt: new Date(2025, 11, 1),
        updatedAt: new Date(2025, 11, 3),
        attachments: [
            { id: 'att-6', name: 'Board-Meeting-Q2-Slides', type: 'google-slides' }
        ],
        comments: Array.from({ length: 5 }, (_, i) => ({
            id: `comment-6-${i + 1}`,
            text: `Comment ${i + 1}`,
            author: mockUsers[i % mockUsers.length],
            createdAt: new Date(2025, 11, 1 + i),
            likes: 0,
            dislikes: 0,
        })),
        teamsLink: 'https://teams.microsoft.com',
    },
    {
        id: 'task-7',
        title: 'Annual Budget Review & Approval',
        description: 'Review and finalize the proposed bud...',
        status: 'completed',
        priority: 'high',
        dueDate: new Date(2025, 11, 4),
        dueTime: 'December 4',
        assignedTo: [
            mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4],
            mockUsers[5], mockUsers[6], mockUsers[7], mockUsers[8], mockUsers[9]
        ], // 10 assignees
        createdBy: mockUsers[7],
        createdAt: new Date(2025, 10, 30),
        updatedAt: new Date(2025, 11, 4),
        attachments: [
            { id: 'att-7', name: 'FY2025-26-Budget-Proposal.xlsx', type: 'xlsx' }
        ],
        comments: Array.from({ length: 15 }, (_, i) => ({
            id: `comment-7-${i + 1}`,
            text: `Comment ${i + 1}`,
            author: mockUsers[i % mockUsers.length],
            createdAt: new Date(2025, 10, 30 + i),
            likes: 0,
            dislikes: 0,
        })),
        department: 'Finance Dashboard',
        teamsLink: 'https://teams.microsoft.com',
    },
    {
        id: 'task-8',
        title: 'Follow up with Admissions team.',
        description: '',
        status: 'overdue',
        priority: 'high',
        dueDate: new Date(2025, 11, 2),
        dueTime: 'December 2',
        assignedTo: [
            mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4],
            mockUsers[5], mockUsers[6], mockUsers[7], mockUsers[8], mockUsers[9]
        ], // 10 assignees
        createdBy: mockUsers[1],
        createdAt: new Date(2025, 10, 28),
        updatedAt: new Date(2025, 11, 1),
        attachments: [
            { id: 'att-8', name: 'MIS-Feb-2025-Doc', type: 'google-docs' }
        ],
        comments: Array.from({ length: 15 }, (_, i) => ({
            id: `comment-8-${i + 1}`,
            text: `Comment ${i + 1}`,
            author: mockUsers[i % mockUsers.length],
            createdAt: new Date(2025, 10, 28 + i),
            likes: 0,
            dislikes: 0,
        })),
        teamsLink: 'https://teams.microsoft.com',
    },
    {
        id: 'task-9',
        title: 'Review Proposal for WiFi Upgrade.',
        description: 'Propose infrastructure enhancements...',
        status: 'overdue',
        priority: 'low',
        dueDate: new Date(2025, 11, 3),
        dueTime: 'December 3',
        assignedTo: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4]], // 5 assignees
        createdBy: mockUsers[2],
        createdAt: new Date(2025, 11, 1),
        updatedAt: new Date(2025, 11, 2),
        comments: [],
        location: "in Mr. Hanil's office",
    },
];

export const mockMeetings: Meeting[] = [
    {
        id: 'meeting-1',
        title: 'Board Strategy Review Meeting',
        description: 'Quarterly board meeting to review gro...',
        status: 'todo',
        date: new Date(2025, 11, 4, 11, 0),
        time: '11:00 AM',
        attendees: [mockUsers[0], mockUsers[1], mockUsers[2]],
        createdBy: mockUsers[1],
        priority: 'high',
        teamsLink: 'https://teams.microsoft.com',
        attachments: [
            { id: 'att-m1', name: 'Strategic-Review-Q1-2025.pdf', type: 'pdf' }
        ],
        commentCount: 2,
    },
    {
        id: 'meeting-2',
        title: 'Catch-up with Marketing Team',
        description: '[Workplace Portal - Figma Prototype]',
        status: 'todo',
        date: new Date(2025, 11, 4, 14, 30),
        time: '2:30 PM',
        location: "in Mr. Hanil's office",
        attendees: [mockUsers[0], mockUsers[4]],
        createdBy: mockUsers[4],
        priority: 'low',
        commentCount: 0,
    },
    {
        id: 'meeting-3',
        title: 'Final Review – Westford Awards Pr...',
        description: 'Final design and content review for th...',
        status: 'todo',
        date: new Date(2025, 3, 7),
        time: 'April 7',
        department: 'Finance Dashboard',
        attendees: [mockUsers[0], mockUsers[5]],
        createdBy: mockUsers[5],
        priority: 'high',
        teamsLink: 'https://teams.microsoft.com',
        attachments: [
            { id: 'att-m3', name: 'Westford-Awards2025-Pres...tion.pptx', type: 'pptx' }
        ],
        commentCount: 15,
    },
    {
        id: 'meeting-4',
        title: 'Prepare presentation for Westford...',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        status: 'in-progress',
        date: new Date(2025, 11, 4, 10, 30),
        time: '10:30 AM',
        attendees: [mockUsers[0], mockUsers[6]],
        createdBy: mockUsers[6],
        priority: 'high',
        teamsLink: 'https://teams.microsoft.com',
        attachments: [
            { id: 'att-m4', name: 'Board-Meeting-Q2-Slides', type: 'google-slides' }
        ],
        commentCount: 5,
    },
    {
        id: 'meeting-5',
        title: 'Annual Budget Review & Approval',
        description: 'Review and finalize the proposed bud...',
        status: 'completed',
        date: new Date(2025, 3, 7),
        time: 'April 7',
        department: 'Finance Dashboard',
        attendees: [mockUsers[0], mockUsers[7]],
        createdBy: mockUsers[7],
        priority: 'high',
        teamsLink: 'https://teams.microsoft.com',
        attachments: [
            { id: 'att-m5', name: 'FY2025-26-Budget-Proposal.xlsx', type: 'xlsx' }
        ],
        commentCount: 15,
    },
    {
        id: 'meeting-6',
        title: 'Follow up with Admissions team.',
        status: 'overdue',
        date: new Date(2025, 11, 2),
        time: 'December 2',
        attendees: [mockUsers[0], mockUsers[1]],
        createdBy: mockUsers[1],
        priority: 'high',
        teamsLink: 'https://teams.microsoft.com',
        attachments: [
            { id: 'att-m6', name: 'MIS-Feb-2025-Doc', type: 'google-docs' }
        ],
        commentCount: 15,
    },
];

export const mockLectures: Lecture[] = [
    {
        id: 'lecture-1',
        level: 'Masters',
        program: 'Canterbury Christ Church University (CCCU)',
        module: 'Innovation, Entrepreneurship and the International Perspective (IEIP)',
        batchCode: 'IEIPRGRM2504A',
        scheduleDate: new Date(2025, 11, 4),
        scheduleTime: '10:00 AM - 01:30 PM',
        days: ['Tuesday', 'Thursday', 'Saturday'],
        venue: 'Al Taawun',
        mode: 'onsite',
        noOfSessions: 8,
        noOfStudents: 64,
        courseAdmin: 'Ahzan',
    },
    {
        id: 'lecture-2',
        level: 'Masters',
        program: 'Canterbury Christ Church University (CCCU)',
        module: 'Dissertation (AUI)',
        batchCode: 'DISAUI2504A',
        scheduleDate: new Date(2025, 11, 1),
        scheduleTime: '12:00 PM - 01:00 PM',
        days: ['Monday'],
        venue: 'DeMont',
        mode: 'onsite',
        noOfSessions: 6,
        noOfStudents: 40,
        courseAdmin: 'Liam Porter',
    },
    {
        id: 'lecture-3',
        level: 'Masters',
        program: 'Canterbury Christ Church University (CCCU)',
        module: 'Innovation, Entrepreneurship and the International Perspective (IEIP)',
        batchCode: 'IEIPRGRM2504A',
        scheduleDate: new Date(2025, 11, 6),
        scheduleTime: '09:00 AM - 11:00 AM',
        days: ['Wednesday'],
        venue: 'Online',
        mode: 'online',
        noOfSessions: 8,
        noOfStudents: 64,
        courseAdmin: 'Ahzan',
    },
    {
        id: 'lecture-4',
        level: 'Masters',
        program: 'Canterbury Christ Church University (CCCU)',
        module: 'Engineering Management (SGAAUEM)',
        batchCode: 'SGAAUEM2504A',
        scheduleDate: new Date(2025, 11, 1),
        scheduleTime: '04:00 PM - 06:00 PM',
        days: ['Monday'],
        venue: 'Sahara',
        mode: 'onsite',
        noOfSessions: 5,
        noOfStudents: 52,
        courseAdmin: 'Sarah Martin',
    },
    {
        id: 'lecture-5',
        level: 'Masters',
        program: 'Canterbury Christ Church University (CCCU)',
        module: 'Engineering Management (SGAAUEM)',
        batchCode: 'SGAAUEM2504A',
        scheduleDate: new Date(2025, 11, 5),
        scheduleTime: '09:00 AM - 12:00 PM',
        days: ['Friday'],
        venue: 'Al Taawun',
        mode: 'onsite',
        noOfSessions: 6,
        noOfStudents: 52,
        courseAdmin: 'Sarah Martin',
    },
];

export const mockAttendance: Attendance[] = [
    {
        id: 'attendance-1',
        date: new Date(2025, 11, 4),
        checkIn: new Date(2025, 11, 4, 9, 0),
        checkOut: new Date(2025, 11, 4, 17, 0),
        status: 'present',
    },
];

export const mockProposals: Proposal[] = [
    {
        id: 'proposal-1',
        title: 'WiFi Upgrade Proposal',
        status: 'under-review',
        submittedDate: new Date(2025, 11, 1),
        department: 'IT',
        createdBy: mockUsers[2],
    },
];

export const mockMIS: MIS[] = [
    {
        id: 'mis-1',
        title: 'MIS-Feb-2025-Doc',
        reportType: 'Monthly Report',
        period: 'February 2025',
        status: 'completed',
        dueDate: new Date(2025, 10, 30),
        createdBy: mockUsers[1],
    },
];

export const mockExtraContributions: ExtraContribution[] = [
    {
        id: 'contribution-1',
        title: 'Mentoring Session',
        type: 'Mentoring',
        date: new Date(2025, 11, 2),
        hours: 2,
        createdBy: mockUsers[0],
    },
];

export interface Department {
    id: string;
    name: string;
    count: number;
    isSelected?: boolean;
}

export const mockDepartments: Department[] = [
    { id: 'dept-1', name: 'WESTFORD', count: 147, isSelected: true },
    { id: 'dept-2', name: 'Operations', count: 22 },
    { id: 'dept-3', name: 'Student Services', count: 20 },
    { id: 'dept-4', name: 'Faculty', count: 60 },
    { id: 'dept-5', name: 'Admissions / BD', count: 18 },
    { id: 'dept-6', name: 'Marcom', count: 20 },
    { id: 'dept-7', name: 'Accounts', count: 2 },
    { id: 'dept-8', name: 'Student Experience', count: 5 },
];

// Calculate current week (Sunday to Saturday)
const getCurrentWeekDates = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Get Sunday of current week
    const sunday = new Date(today.setDate(diff));

    // Get Tuesday (day 2) and Wednesday (day 3) of current week
    const tuesday = new Date(sunday);
    tuesday.setDate(sunday.getDate() + 2);

    const wednesday = new Date(sunday);
    wednesday.setDate(sunday.getDate() + 3);

    return { tuesday, wednesday };
};

const { tuesday, wednesday } = getCurrentWeekDates();

export const mockHolidays: Holiday[] = [
    {
        id: 'holiday-1',
        title: 'Eid Al Fitr holidays',
        date: tuesday,
        description: 'Eid Al Fitr marks the end of Ramadan and is one of the most significant Islamic holidays, celebrated with prayers, feasts, and community gatherings.',
    },
];

export const mockBirthdays: Birthday[] = [
    {
        id: 'birthday-1',
        title: "Bethoven's Birthday!",
        date: wednesday,
        person: {
            name: 'Bethoven Filomeno',
            position: 'Senior Faculty',
            avatar: mockUsers.find((u) => u.id === 'user-7')?.avatar,
        },
    },
];

