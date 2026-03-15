import type { Task, Meeting, User } from '../my-work/types';
import type { Holiday, Birthday } from './types';
import hanilDasAvatar from '../../assets/images/avatars/hanil-das.png';
import isuruThilakarathneAvatar from '../../assets/images/avatars/isuru-thilakarathne.png';
import saharSalimAvatar from '../../assets/images/avatars/sahar-salim.png';
import avatar2 from '../../assets/images/avatars/avatar-2.png';
import avatar3 from '../../assets/images/avatars/avatar-3.png';
import avatar4 from '../../assets/images/avatars/avatar-4.png';
import bethovenFilomenoAvatar from '../../assets/images/avatars/avatar-3.png'; // Using placeholder for Beethoven

// Helper function to get current week dates (Sunday to Saturday)
const getCurrentWeekDates = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = today.getDate() - day; // Get Sunday of current week
    const sunday = new Date(today.getFullYear(), today.getMonth(), diff);
    sunday.setHours(0, 0, 0, 0);

    // Calculate each day of the week
    const monday = new Date(sunday);
    monday.setDate(sunday.getDate() + 1);
    monday.setHours(0, 0, 0, 0);

    const tuesday = new Date(sunday);
    tuesday.setDate(sunday.getDate() + 2);
    tuesday.setHours(0, 0, 0, 0);

    const wednesday = new Date(sunday);
    wednesday.setDate(sunday.getDate() + 3);
    wednesday.setHours(0, 0, 0, 0);

    const thursday = new Date(sunday);
    thursday.setDate(sunday.getDate() + 4);
    thursday.setHours(0, 0, 0, 0);

    const friday = new Date(sunday);
    friday.setDate(sunday.getDate() + 5);
    friday.setHours(0, 0, 0, 0);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(0, 0, 0, 0);

    return { monday, tuesday, wednesday, thursday, friday, saturday };
};

const thisWeek = getCurrentWeekDates();

// Calendar-specific users (subset needed for calendar events)
export const calendarUsers: User[] = [
    { id: 'user-1', name: 'You', position: 'CEO & Co-Founder', email: 'you@westford.edu', avatar: hanilDasAvatar },
    { id: 'user-2', name: 'Akshaya Nair', position: 'Officer - Student Services', email: 'akshaya.nair@westford.edu', avatar: avatar2 },
    { id: 'user-7', name: 'Bethoven Filomeno', position: 'Senior Faculty', email: 'bethoven.filomeno@westford.edu', avatar: bethovenFilomenoAvatar },
    { id: 'user-9', name: 'Isuru Thilakarathne', position: 'Developer', email: 'isuru@westford.edu', avatar: isuruThilakarathneAvatar },
    { id: 'user-10', name: 'Hanil Das', position: 'Manager', email: 'hanil@westford.edu', avatar: hanilDasAvatar },
    { id: 'user-11', name: 'Sahar Salim', position: 'Designer', email: 'sahar@westford.edu', avatar: saharSalimAvatar },
    { id: 'user-12', name: 'Zawahir Siddique', position: 'QA Engineer', email: 'zawahir@westford.edu', avatar: avatar3 },
    { id: 'user-13', name: 'Avijit Guin', position: 'Officer-Student Services', email: 'avijit.guin@westford.edu', avatar: avatar4 },
];

// Calendar-specific tasks based on Figma design (Current Week)
export const calendarTasks: Task[] = [
    {
        id: 'calendar-task-1',
        title: 'Review Final Workplace Portal Prototype',
        description: 'This is the updated Workplace Portal Figma prototype, refined based on your feedback from the initial demo. It includes enhancements to the UI, streamlined workflows, and improved visual hierarchy to better align with our intended user experience. Kindly review the prototype and share your inputs or suggestions so we can incorporate them before moving on to the next stage of development.',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(thisWeek.monday), // Monday of this week
        dueTime: 'EOD',
        assignedTo: [
            calendarUsers[4], // Hanil Das
            calendarUsers[1], // Akshaya Nair
            calendarUsers[6], // Zawahir Siddique
            calendarUsers[7], // Avijit Guin
        ],
        createdBy: calendarUsers[3], // Isuru Thilakarathne
        createdAt: new Date(thisWeek.monday.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before Monday
        updatedAt: new Date(thisWeek.monday.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day before Monday
        venue: 'N/A',
        attachments: [
            { id: 'att-cal-1', name: 'Workplace Portal – Figma Prototype', type: 'link' },
            { id: 'att-cal-2', name: 'Flow_Chart.pdf', type: 'pdf' },
        ],
        comments: [
            {
                id: 'comment-cal-1',
                text: 'Looks great overall!',
                author: calendarUsers[5],
                createdAt: new Date(thisWeek.monday.getTime() + 10 * 60 * 60 * 1000 + 27 * 60 * 1000), // Monday 10:27 AM
                likes: 0,
                dislikes: 0,
            },
            {
                id: 'comment-cal-2',
                text: 'Tested all the flows.',
                author: calendarUsers[6],
                createdAt: new Date(thisWeek.monday.getTime() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // Sunday 3:00 PM
                likes: 0,
                dislikes: 0,
            },
            {
                id: 'comment-cal-3',
                text: 'Minor UI tweaks needed.',
                author: calendarUsers[3],
                createdAt: new Date(thisWeek.monday.getTime() + 10 * 60 * 60 * 1000 + 48 * 60 * 1000), // Monday 10:48 AM
                likes: 0,
                dislikes: 0,
            },
        ],
        showComments: true,
        addToCalendar: false,
    },
];

// Calendar-specific meetings based on Figma design (Current Week)
export const calendarMeetings: Meeting[] = [
    {
        id: 'calendar-meeting-1',
        title: 'Board Strategy Review Meeting',
        description: 'Quarterly board meeting to review growth strategies and operational performance.',
        status: 'todo',
        date: new Date(thisWeek.monday), // Monday of this week
        time: '10:00 - 11:30 AM',
        attendees: [
            calendarUsers[0], // You
            calendarUsers[1], // Akshaya Nair
            calendarUsers[2], // Beethoven Filomeno
            calendarUsers[3], // Isuru Thilakarathne
            calendarUsers[4], // Hanil Das
            calendarUsers[5], // Sahar Salim
            calendarUsers[6], // Zawahir Siddique
            calendarUsers[7], // Avijit Guin
            // Add 2 more placeholder users to reach 10 participants
            { id: 'user-meeting-1', name: 'Participant 1', position: 'Staff', email: 'participant1@westford.edu', avatar: avatar2 },
            { id: 'user-meeting-2', name: 'Participant 2', position: 'Staff', email: 'participant2@westford.edu', avatar: avatar3 },
        ],
        createdBy: calendarUsers[4], // Hanil Das
        priority: 'high',
        teamsLink: 'https://teams.microsoft.com',
        attachments: [
            { id: 'att-meeting-1', name: 'Strategic-Review-Q1-2025.pdf', type: 'pdf' },
        ],
        commentCount: 2,
    },
    {
        id: 'calendar-meeting-2',
        title: 'Operational Management meeting - Westford University College & UoG BCSS',
        description: 'Monthly operational review meeting covering key metrics, challenges, and upcoming initiatives for both Westford University College and UoG BCSS programs.',
        status: 'todo',
        date: new Date(thisWeek.tuesday), // Tuesday of this week
        time: '12:00 - 1:00 PM',
        attendees: [
            calendarUsers[0], // You
            calendarUsers[1], // Akshaya Nair
            calendarUsers[2], // Beethoven Filomeno
            calendarUsers[3], // Isuru Thilakarathne
            calendarUsers[4], // Hanil Das
            calendarUsers[5], // Sahar Salim
            calendarUsers[6], // Zawahir Siddique
            calendarUsers[7], // Avijit Guin
            // Add 11 more placeholder users to reach 19 participants
            { id: 'user-meeting-3', name: 'Participant 3', position: 'Staff', email: 'participant3@westford.edu', avatar: avatar2 },
            { id: 'user-meeting-4', name: 'Participant 4', position: 'Staff', email: 'participant4@westford.edu', avatar: avatar3 },
            { id: 'user-meeting-5', name: 'Participant 5', position: 'Staff', email: 'participant5@westford.edu', avatar: avatar4 },
            { id: 'user-meeting-6', name: 'Participant 6', position: 'Staff', email: 'participant6@westford.edu', avatar: avatar2 },
            { id: 'user-meeting-7', name: 'Participant 7', position: 'Staff', email: 'participant7@westford.edu', avatar: avatar3 },
            { id: 'user-meeting-8', name: 'Participant 8', position: 'Staff', email: 'participant8@westford.edu', avatar: avatar4 },
            { id: 'user-meeting-9', name: 'Participant 9', position: 'Staff', email: 'participant9@westford.edu', avatar: avatar2 },
            { id: 'user-meeting-10', name: 'Participant 10', position: 'Staff', email: 'participant10@westford.edu', avatar: avatar3 },
            { id: 'user-meeting-11', name: 'Participant 11', position: 'Staff', email: 'participant11@westford.edu', avatar: avatar4 },
            { id: 'user-meeting-12', name: 'Participant 12', position: 'Staff', email: 'participant12@westford.edu', avatar: avatar2 },
            { id: 'user-meeting-13', name: 'Participant 13', position: 'Staff', email: 'participant13@westford.edu', avatar: avatar3 },
        ],
        createdBy: calendarUsers[4], // Hanil Das
        priority: 'high',
        teamsLink: 'https://teams.microsoft.com',
        attachments: [],
        commentCount: 0,
    },
];

// Calendar-specific holidays based on Figma design
// Eid Al Fitr spans from Tuesday to Friday of this week
export const calendarHolidays: Holiday[] = [
    {
        id: 'calendar-holiday-1',
        title: 'Eid Al Fitr',
        date: new Date(thisWeek.tuesday), // Tuesday of this week
        description: 'Eid Al Fitr marks the end of Ramadan and is one of the most significant Islamic holidays, celebrated with prayers, feasts, and community gatherings.',
    },
    {
        id: 'calendar-holiday-2',
        title: 'Eid Al Fitr',
        date: new Date(thisWeek.wednesday), // Wednesday of this week
        description: 'Eid Al Fitr marks the end of Ramadan and is one of the most significant Islamic holidays, celebrated with prayers, feasts, and community gatherings.',
    },
    {
        id: 'calendar-holiday-3',
        title: 'Eid Al Fitr',
        date: new Date(thisWeek.thursday), // Thursday of this week
        description: 'Eid Al Fitr marks the end of Ramadan and is one of the most significant Islamic holidays, celebrated with prayers, feasts, and community gatherings.',
    },
    {
        id: 'calendar-holiday-4',
        title: 'Eid Al Fitr',
        date: new Date(thisWeek.friday), // Friday of this week
        description: 'Eid Al Fitr marks the end of Ramadan and is one of the most significant Islamic holidays, celebrated with prayers, feasts, and community gatherings.',
    },
];

// Calendar-specific birthdays based on Figma design
export const calendarBirthdays: Birthday[] = [
    {
        id: 'calendar-birthday-1',
        title: "Bethoven's Birthday!",
        date: new Date(thisWeek.wednesday), // Wednesday of this week
        person: {
            name: 'Bethoven Filomeno',
            position: 'Senior Faculty',
            avatar: calendarUsers.find((u) => u.id === 'user-7')?.avatar,
        },
    },
];

