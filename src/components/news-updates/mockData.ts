import Avatar2 from '../../assets/images/avatars/avatar-2.png';
import Avatar3 from '../../assets/images/avatars/avatar-3.png';
import Avatar4 from '../../assets/images/avatars/avatar-4.png';
import Avatar5 from '../../assets/images/avatars/avatar-5.png';
import News1 from '../../assets/images/news/news-1.png';
import News2 from '../../assets/images/news/news-2.png';
import News3 from '../../assets/images/news/news-3.png';
import News4 from '../../assets/images/news/news-4.png';
import type { Post } from './types';

export const mockPosts: Post[] = [
    {
        id: 'post-1',
        author: {
            id: 'author-1',
            name: 'Treenal Antony',
            role: 'Senior Officer - HR & Recruitment',
            avatar: Avatar2,
            availability: 'online',
        },
        category: 'hr-update',
        title: 'New Joiner Welcome',
        content: "Say hello to Paridhi Tutlani, our new Faculty! She joins us with a creative spark and a love for storytelling. Drop a hello and help make her feel at home!",
        timestamp: '2025-04-07T11:15:00',
        formattedDate: '7 Apr, 11:15 AM',
        formattedDateLong: '7 April 2025',
        pinned: true,
        images: [
            {
                type: 'banner',
                url: News1,
                alt: 'New Joiner Welcome',
            },
        ],
        reactions: [
            { type: 'celebrate', count: 12, userReacted: false },
            { type: 'applaud', count: 8, userReacted: false },
            { type: 'support', count: 15, userReacted: false },
        ],
        commentCount: 5,
    },
    {
        id: 'post-2',
        author: {
            id: 'author-3',
            name: 'Meera Ravindran',
            role: 'Assistant Manager-Operations',
            avatar: Avatar3,
            availability: 'online',
        },
        category: 'events-activities',
        title: 'Annual Iftar Gathering Invitation',
        content: "You're warmly invited to our Annual Iftar Gathering on Thursday, 10th April at 6:00 PM in the Westford Courtyard.",
        timestamp: '2025-04-07T09:25:00',
        formattedDate: '7 Apr, 9:25 AM',
        formattedDateLong: '7 April 2025',
        pinned: false,
        images: [
            {
                type: 'banner',
                url: News2,
                alt: 'Iftar Gathering Invitation',
            },
        ],
        reactions: [
            { type: 'celebrate', count: 30, userReacted: false },
            { type: 'applaud', count: 15, userReacted: false },
            { type: 'support', count: 22, userReacted: false },
        ],
        commentCount: 8,
        allowReactions: false,
    },
    {
        id: 'post-4',
        author: {
            id: 'author-2',
            name: 'Upasna Nambiar',
            role: 'Training Coordinator',
            avatar: Avatar4,
            availability: 'online',
        },
        category: 'staff-recognition',
        title: "Dr. Febin Antony's 2 Year Work Anniversary",
        content: "Cheers for completing 2 years with the Westford Family today! Thank you for your dedication and incredible work ethic!",
        timestamp: '2025-04-07T09:00:00',
        formattedDate: '7 Apr, 9:00 AM',
        formattedDateLong: '7 April 2025',
        pinned: false,
        images: [
            {
                type: 'banner',
                url: News3,
                alt: 'Dr. Febin Antony',
            },
        ],
        reactions: [
            { type: 'celebrate', count: 20, userReacted: false },
            { type: 'applaud', count: 18, userReacted: false },
            { type: 'support', count: 25, userReacted: false },
        ],
        commentCount: 12,
    },
    {
        id: 'post-5',
        author: {
            id: 'author-4',
            name: 'Meera Ravindran',
            role: 'Assistant Manager-Operations',
            avatar: Avatar3,
            availability: 'online',
        },
        category: 'policy-updates',
        title: 'Remote Work Policy Update',
        content: "We've revised the Remote Work Policy to better align with team needs and scheduling expectations. Kindly ensure your updated WFH schedules are submitted by Friday, 11 April 2025.",
        timestamp: '2025-04-05T10:21:00',
        formattedDate: '5 Apr, 10:21 AM',
        formattedDateLong: '5 April 2025',
        pinned: true,
        attachments: [
            {
                id: 'att-2',
                type: 'link',
                title: 'View Updated Policy',
                url: '#',
            },
        ],
        reactions: [
            { type: 'celebrate', count: 2, userReacted: false },
            { type: 'applaud', count: 1, userReacted: false },
            { type: 'support', count: 4, userReacted: false },
        ],
        commentCount: 2,
        allowReactions: false,
    },
    {
        id: 'post-3',
        author: {
            id: 'author-3',
            name: 'Isuru Thilakarathne',
            role: 'Officer- UI/UX and Web developer',
            avatar: Avatar5,
            availability: 'online',
        },
        category: 'it-system-updates',
        title: 'Important LMS Update',
        content: "We're excited to announce a new enhancement to our Learning Management System (LMS)! The update introduces a personalized dashboard for students, along with improved performance tracking tools to help both students and faculty monitor academic progress more effectively. The interface has also been refined for a more seamless and intuitive experience. \n\nYou can access the updated LMS through your existing login. If you experience any issues or have feedback, please connect with the Academic Support Team.",
        timestamp: '2025-03-30T17:10:00',
        formattedDate: '30 Mar, 5:10 PM',
        formattedDateLong: '7 April 2025',
        pinned: true,
        attachments: [
            {
                id: 'att-1',
                type: 'pdf',
                title: 'PDF Guide – LMS Update Overview',
                url: '#',
            },
        ],
        images: [
            {
                type: 'banner',
                url: News4,
                alt: 'LMS Update Guide',
            },
        ],
        reactions: [
            { type: 'celebrate', count: 5, userReacted: false },
            { type: 'applaud', count: 3, userReacted: false },
            { type: 'support', count: 7, userReacted: false },
        ],
        commentCount: 3,
        allowReactions: false,
    },
];

export const categoryLabels: Record<string, string> = {
    'all': 'All Updates',
    'hr-update': 'HR Update',
    'staff-recognition': 'Staff Recognition',
    'it-system-updates': 'IT/System Updates',
    'events-activities': 'Events & Activities',
    'policy-updates': 'Policy Updates',
    'general': 'General',
    'ceo-messages': 'CEO Messages',
};

export const categoryColors: Record<string, string> = {
    // Slug-based keys (used by mock data and some API endpoints)
    'hr-update': '#92b974',
    'staff-recognition': '#1E88E5',
    'it-system-updates': '#DE4A2C',
    'events-activities': '#7C62C4',
    'policy-updates': '#232725',
    'general': '#6B7280',
    'ceo-messages': '#DE4A2C',
    // Human-readable label keys (returned by GetAll as categoryDesc)
    'HR Update': '#92b974',
    'Staff Recognition': '#1E88E5',
    'IT/System Updates': '#DE4A2C',
    'Events & Activities': '#7C62C4',
    'Policy Updates': '#232725',
    'General': '#6B7280',
    'CEO Messages': '#DE4A2C',
    'Announcement': '#008080',
};

