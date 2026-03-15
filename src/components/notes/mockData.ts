import type { Note } from './types';
import hanilDasAvatar from '../../assets/images/avatars/hanil-das.png';
import treenalAntonyAvatar from '../../assets/images/avatars/treenal-antony.png';
import rhythuMenonAvatar from '../../assets/images/avatars/rhythu-menon.png';
import isuruThilakarathneAvatar from '../../assets/images/avatars/isuru-thilakarathne.png';
import ryanGarciaAvatar from '../../assets/images/avatars/ryan-garcia.png';
import saharSalimAvatar from '../../assets/images/avatars/sahar-salim.png';
import shaaistaMukaddamAvatar from '../../assets/images/avatars/shaaista-mukaddam.png';
import charlesMensahAvatar from '../../assets/images/avatars/charles-mensah.png';
import bhaktiMulyeAvatar from '../../assets/images/avatars/bhakti-mulye.png';
import yohaniJinadasaAvatar from '../../assets/images/avatars/yohani-jinadasa.png';

const formatDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: 'MyWestford Dev Progress Review',
    content: 'Review MyWestford dev progress by next Friday. UI handoff still pending for the student dashboard. Dev team fla...',
    author: {
      id: 'user-1',
      name: 'Hanil Das',
      avatar: hanilDasAvatar,
    },
    createdAt: new Date('2025-04-02T10:15:00'),
    formattedDate: formatDate(new Date('2025-04-02T10:15:00')),
    formattedTime: formatTime(new Date('2025-04-02T10:15:00')),
    pinned: true,
    favorited: false,
    isShared: false,
  },
  {
    id: 'note-2',
    title: 'Culture Survey Discussion - Q3 Planning',
    content: 'Follow-up from the recent HR roundtable. Discussed rolling out quarterly staff cult...',
    author: {
      id: 'user-2',
      name: 'Treenal Antony',
      avatar: treenalAntonyAvatar,
    },
    createdAt: new Date('2025-04-04T17:30:00'),
    formattedDate: formatDate(new Date('2025-04-04T17:30:00')),
    formattedTime: formatTime(new Date('2025-04-04T17:30:00')),
    pinned: true,
    favorited: false,
    isShared: true,
    hasReminder: true,
    reminderDate: new Date('2025-04-04T17:30:00'),
  },
  {
    id: 'note-3',
    title: 'Conversion Drop - May Intake',
    content: '- Sharp dip from inquiry to application (esp. UAE leads)\n- Follow-up rate low after first call – tea...',
    author: {
      id: 'user-3',
      name: 'Rhythu Menon',
      avatar: rhythuMenonAvatar,
    },
    createdAt: new Date('2025-04-06T21:45:00'),
    formattedDate: formatDate(new Date('2025-04-06T21:45:00')),
    formattedTime: formatTime(new Date('2025-04-06T21:45:00')),
    pinned: false,
    favorited: false,
    isShared: true,
  },
  {
    id: 'note-4',
    title: 'UI Feedback Log - MyWestford Revamp',
    content: 'Compiled major feedback points from the last 2 weeks. Login animation delay, spa...',
    author: {
      id: 'user-4',
      name: 'Isuru Thilakarathne',
      avatar: isuruThilakarathneAvatar,
    },
    createdAt: new Date('2025-04-06T14:52:00'),
    formattedDate: formatDate(new Date('2025-04-06T14:52:00')),
    formattedTime: formatTime(new Date('2025-04-06T14:52:00')),
    pinned: false,
    favorited: true,
    isShared: true,
  },
  {
    id: 'note-5',
    title: 'Quarterly Engagement Pulse - Draft Thoughts',
    content: 'Thinking of trimming the number of survey questions. Too many are skipped...',
    author: {
      id: 'user-1',
      name: 'Hanil Das',
      avatar: hanilDasAvatar,
    },
    createdAt: new Date('2025-04-06T17:30:00'),
    formattedDate: formatDate(new Date('2025-04-06T17:30:00')),
    formattedTime: formatTime(new Date('2025-04-06T17:30:00')),
    pinned: false,
    favorited: false,
    isShared: false,
  },
  {
    id: 'note-6',
    title: "What's Working / What's Not - Q2",
    content: "What's Working:\n- New buddy program, first years are opening up faster...",
    author: {
      id: 'user-5',
      name: 'Ryan Garcia',
      avatar: ryanGarciaAvatar,
    },
    createdAt: new Date('2025-04-05T11:15:00'),
    formattedDate: formatDate(new Date('2025-04-05T11:15:00')),
    formattedTime: formatTime(new Date('2025-04-05T11:15:00')),
    pinned: false,
    favorited: true,
    isShared: true,
  },
  {
    id: 'note-7',
    title: 'Need sign-off: Open Day posters',
    content: 'Sent final design options to print vendor, but they need your OK by tomorrow. Used the purple + gold scheme you preferred.',
    author: {
      id: 'user-6',
      name: 'Sahar Salim',
      avatar: saharSalimAvatar,
    },
    createdAt: new Date('2025-04-04T16:47:00'),
    formattedDate: formatDate(new Date('2025-04-04T16:47:00')),
    formattedTime: formatTime(new Date('2025-04-04T16:47:00')),
    pinned: false,
    favorited: false,
    isShared: true,
  },
  {
    id: 'note-8',
    title: 'Scraps from the MARCOM meeting',
    content: 'Sahar: Deadlines don\'t excite anyone anymore\nIsuru: UX should not be limited to a layer...',
    author: {
      id: 'user-1',
      name: 'Hanil Das',
      avatar: hanilDasAvatar,
    },
    createdAt: new Date('2025-04-04T10:31:00'),
    formattedDate: formatDate(new Date('2025-04-04T10:31:00')),
    formattedTime: formatTime(new Date('2025-04-04T10:31:00')),
    pinned: false,
    favorited: false,
    isShared: false,
  },
  {
    id: 'note-9',
    title: 'Faculty recognition',
    content: 'Maybe use HRMS to highlight top-performing faculty monthly? Could integrate with extra points system Isuru i...',
    author: {
      id: 'user-1',
      name: 'Hanil Das',
      avatar: hanilDasAvatar,
    },
    createdAt: new Date('2025-04-04T10:02:00'),
    formattedDate: formatDate(new Date('2025-04-04T10:02:00')),
    formattedTime: formatTime(new Date('2025-04-04T10:02:00')),
    pinned: false,
    favorited: true,
    isShared: false,
  },
  {
    id: 'note-10',
    title: 'Low turnout in Strategy class',
    content: 'Only 9 students showed up yesterday. Think it\'s because the assignment release clashed. Need to rethink the content flow.',
    author: {
      id: 'user-7',
      name: 'Shaaista Mukaddam',
      avatar: shaaistaMukaddamAvatar,
    },
    createdAt: new Date('2025-04-03T13:10:00'),
    formattedDate: formatDate(new Date('2025-04-03T13:10:00')),
    formattedTime: formatTime(new Date('2025-04-03T13:10:00')),
    pinned: false,
    favorited: false,
    isShared: true,
  },
  {
    id: 'note-11',
    title: 'Note to Self – Assessment Pattern',
    content: 'May need to shift from heavy quizzes to more reflective journals\n- Easier to spot real thinking vs surface...',
    author: {
      id: 'user-8',
      name: 'Dr. Charles Mensah',
      avatar: charlesMensahAvatar,
    },
    createdAt: new Date('2025-04-03T11:30:00'),
    formattedDate: formatDate(new Date('2025-04-03T11:30:00')),
    formattedTime: formatTime(new Date('2025-04-03T11:30:00')),
    pinned: false,
    favorited: false,
    isShared: true,
  },
  {
    id: 'note-12',
    title: 'New intern logins',
    content: 'Did IT create accounts for the three interns from MARCOM? - Check with Treenal',
    author: {
      id: 'user-1',
      name: 'Hanil Das',
      avatar: hanilDasAvatar,
    },
    createdAt: new Date('2025-04-01T11:54:00'),
    formattedDate: formatDate(new Date('2025-04-01T11:54:00')),
    formattedTime: formatTime(new Date('2025-04-01T11:54:00')),
    pinned: false,
    favorited: false,
    isShared: false,
  },
  {
    id: 'note-13',
    title: 'Small wins',
    content: "One of the shyest students volunteered to lead today's session. No push from us. J...",
    author: {
      id: 'user-9',
      name: 'Yohani Jinadasa',
      avatar: yohaniJinadasaAvatar,
    },
    createdAt: new Date('2025-03-28T17:30:00'),
    formattedDate: formatDate(new Date('2025-03-28T17:30:00')),
    formattedTime: formatTime(new Date('2025-03-28T17:30:00')),
    pinned: false,
    favorited: true,
    isShared: true,
  },
  {
    id: 'note-14',
    title: 'Post-event feedback not shared',
    content: 'La Réussite follow-up pending. Ask Yohani and Ryan to consolidate feedback for to...',
    author: {
      id: 'user-1',
      name: 'Hanil Das',
      avatar: hanilDasAvatar,
    },
    createdAt: new Date('2025-03-15T18:33:00'),
    formattedDate: formatDate(new Date('2025-03-15T18:33:00')),
    formattedTime: formatTime(new Date('2025-03-15T18:33:00')),
    pinned: false,
    favorited: false,
    isShared: false,
  },
  {
    id: 'note-15',
    title: "Still says 'Admissions Open 2024'",
    content: 'Still says \'Admissions Open 2024\'. Ask Isuru to replace with "Rolling Intakes Now Open". Should go live by tonight.',
    author: {
      id: 'user-1',
      name: 'Hanil Das',
      avatar: hanilDasAvatar,
    },
    createdAt: new Date('2025-03-14T10:30:00'),
    formattedDate: formatDate(new Date('2025-03-14T10:30:00')),
    formattedTime: formatTime(new Date('2025-03-14T10:30:00')),
    pinned: false,
    favorited: false,
    isShared: false,
  },
  {
    id: 'note-16',
    title: 'Module intro video',
    content: 'Planning to record a quick intro for OB module. Can MARCOM help with edits? Just a 1-minute thing. Shooting Saturday...',
    author: {
      id: 'user-10',
      name: 'Bhakti Mulye',
      avatar: bhaktiMulyeAvatar,
    },
    createdAt: new Date('2025-03-14T09:15:00'),
    formattedDate: formatDate(new Date('2025-03-14T09:15:00')),
    formattedTime: formatTime(new Date('2025-03-14T09:15:00')),
    pinned: false,
    favorited: true,
    isShared: true,
  },
];

