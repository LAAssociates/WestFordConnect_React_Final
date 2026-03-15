import type { Reminder } from './reminderTypes';
import hanilDasAvatar from '../../assets/images/avatars/hanil-das.png';
import ryanGarciaAvatar from '../../assets/images/avatars/ryan-garcia.png';
import yohaniJinadasaAvatar from '../../assets/images/avatars/yohani-jinadasa.png';
import bhaktiMulyeAvatar from '../../assets/images/avatars/bhakti-mulye.png';

const formatDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  return `${day} ${month}`;
};

const formatTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const mockReminders: Reminder[] = [
  {
    id: 'reminder-1',
    title: 'Culture Survey Discussion - Q3 Planning',
    content: 'Follow-up from the recent HR roundtable. Discussed rolling out quarterly staff cult...',
    author: {
      id: 'user-1',
      name: 'Hanil Das',
      avatar: hanilDasAvatar,
    },
    dueDate: new Date('2025-12-22T17:30:00'),
    formattedDate: formatDate(new Date('2025-12-22T17:30:00')),
    formattedTime: formatTime(new Date('2025-12-22T17:30:00')),
    status: 'upcoming',
    pinned: false,
    favorited: true,
  },
  {
    id: 'reminder-2',
    title: "What's Working / What's Not - Q2",
    content: "What's Working:\n- New buddy program, first years are opening up faster...",
    author: {
      id: 'user-5',
      name: 'Ryan Garcia',
      avatar: ryanGarciaAvatar,
    },
    dueDate: new Date('2025-12-28T12:15:00'),
    formattedDate: formatDate(new Date('2025-12-28T12:15:00')),
    formattedTime: formatTime(new Date('2025-12-28T12:15:00')),
    status: 'upcoming',
    pinned: false,
    favorited: true,
  },
  {
    id: 'reminder-3',
    title: 'Faculty recognition',
    content: 'Maybe use HRMS to highlight top-performing faculty monthly? Could integrate with extra points system Isuru i...',
    author: {
      id: 'user-1',
      name: 'Hanil Das',
      avatar: hanilDasAvatar,
    },
    dueDate: new Date('2025-04-04T10:02:00'),
    formattedDate: formatDate(new Date('2025-04-04T10:02:00')),
    formattedTime: formatTime(new Date('2025-04-04T10:02:00')),
    status: 'missed',
    pinned: false,
    favorited: false,
  },
  {
    id: 'reminder-4',
    title: 'Small wins',
    content: "One of the shyest students volunteered to lead today's session. No push from us. J...",
    author: {
      id: 'user-9',
      name: 'Yohani Jinadasa',
      avatar: yohaniJinadasaAvatar,
    },
    dueDate: new Date('2025-03-28T17:30:00'),
    formattedDate: formatDate(new Date('2025-03-28T17:30:00')),
    formattedTime: formatTime(new Date('2025-03-28T17:30:00')),
    status: 'missed',
    pinned: false,
    favorited: false,
  },
  {
    id: 'reminder-5',
    title: 'Module intro video',
    content: 'Planning to record a quick intro for OB module. Can MARCOM help with edits? Just a 1-minute thing. Shooting Saturday...',
    author: {
      id: 'user-10',
      name: 'Bhakti Mulye',
      avatar: bhaktiMulyeAvatar,
    },
    dueDate: new Date('2025-03-14T09:15:00'),
    formattedDate: formatDate(new Date('2025-03-14T09:15:00')),
    formattedTime: formatTime(new Date('2025-03-14T09:15:00')),
    status: 'missed',
    pinned: false,
    favorited: false,
  },
];

