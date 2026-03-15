import drRamanSubramanianAvatar from '../../assets/images/avatars/raman.png';
import shazinAbdullaAvatar from '../../assets/images/avatars/shazin.png';
import type { AvailabilityItem } from './AvailabilityWidget';
import type { PeopleMoment } from './PeopleMomentsWidget';
import type { TodayData } from './TodayWidget';
import type { UpcomingEvent } from './UpcomingEventsWidget';
// Import avatars for availability widget from Figma design
import anneJacobAvatar from '../../assets/images/avatars/availability/anne-jacob.png';
import aprilBalasonAvatar from '../../assets/images/avatars/availability/april-balason.png';
import avijitGuinAvatar from '../../assets/images/avatars/availability/avijit-guin.png';
import bethovenFilomenoAvatar from '../../assets/images/avatars/availability/bethoven-filomeno.png';
import drArpitaMehrotraAvatar from '../../assets/images/avatars/availability/dr-arpita-mehrotra.png';
import drCharlesMensahAvatar from '../../assets/images/avatars/availability/dr-charles-mensah.png';
import drRoshanJamelAvatar from '../../assets/images/avatars/availability/dr-roshan-jamel.png';
import hamzaAfreediAvatar from '../../assets/images/avatars/availability/hamza-afreedi.png';
import jollyDeepakAvatar from '../../assets/images/avatars/availability/jolly-deepak.png';
import marjorieBrionesAvatar from '../../assets/images/avatars/availability/marjorie-briones.png';
import mohammedAhzanAvatar from '../../assets/images/avatars/availability/mohammed-ahzan.png';
import pradeepAvatar from '../../assets/images/avatars/availability/pradeep.png';
import rakeshKrishnanAvatar from '../../assets/images/avatars/availability/rakesh-krishnan.png';
import renishaFernandesAvatar from '../../assets/images/avatars/availability/renisha-fernandes.png';
import rhythuMenonAvatar from '../../assets/images/avatars/availability/rhythu-menon.png';
import ryanGarciaAvatar from '../../assets/images/avatars/availability/ryan-garcia.png';
import saharSalimAvatar from '../../assets/images/avatars/availability/sahar-salim.png';
import salomeSagayanathanAvatar from '../../assets/images/avatars/availability/salome-sagayanathan.png';
import shaaistaMukaddamAvatar from '../../assets/images/avatars/availability/shaaista-mukaddam.png';
import treenalAntonyAvatar from '../../assets/images/avatars/availability/treenal-antony.png';
import upasnaNambiarAvatar from '../../assets/images/avatars/availability/upasna-nambiar.png';
import yohaniJinadasaAvatar from '../../assets/images/avatars/availability/yohani-jinadasa.png';
import youAvatar from '../../assets/images/avatars/availability/you-avatar.png';
import zawahirSiddiqueAvatar from '../../assets/images/avatars/availability/zawahir-siddique.png';

// Today Widget Data
export const mockTodayData: TodayData = {
  userName: 'Hanil',
  currentDate: new Date(),
  checkInTime: '09:35 AM',
  checkOutTime: null,
  daysAtWestford: 5948,
  currentTime: new Date(),
};

// Availability Widget Data - Based on Figma design (node-id: 342-10159)
// Reference: https://www.figma.com/design/ekD3vfFZkc41SAoKEmHIrN/Westford-Connect-_-HRMS---Dev?node-id=342-10159&m=dev
// Note: Status icons: img2 = online, img10 = away
// All avatars are from Figma design
export const mockAvailabilityItems: AvailabilityItem[] = [
  {
    id: 'avail-1',
    name: 'You',
    position: 'CEO & Co-Founder',
    avatar: youAvatar,
    status: 'offline',
  },
  {
    id: 'avail-2',
    name: 'Anne Jacob',
    position: 'Officer- Admissions',
    avatar: anneJacobAvatar,
    status: 'online',
  },
  {
    id: 'avail-3',
    name: 'April Balason',
    position: 'Executive- Operations',
    avatar: aprilBalasonAvatar,
    status: 'online',
  },
  {
    id: 'avail-4',
    name: 'Avijit Guin',
    position: 'Officer-Student Services',
    avatar: avijitGuinAvatar,
    status: 'online',
  },
  {
    id: 'avail-5',
    name: 'Bethoven Filomeno',
    position: 'Senior Faculty',
    avatar: bethovenFilomenoAvatar,
    status: 'online',
  },
  {
    id: 'avail-6',
    name: 'Dr. Arpita Mehrotra',
    position: 'Associate Dean- Westford Uni Online',
    avatar: drArpitaMehrotraAvatar,
    status: 'online',
  },
  {
    id: 'avail-7',
    name: 'Dr. Charles Mensah',
    position: 'Faculty',
    avatar: drCharlesMensahAvatar,
    status: 'offline',
  },
  {
    id: 'avail-8',
    name: 'Dr. Roshan Jamel',
    position: 'Associate Faculty',
    avatar: drRoshanJamelAvatar,
    status: 'online',
  },
  {
    id: 'avail-9',
    name: 'Hamza Afreedi',
    position: 'Data Entry Operator',
    avatar: hamzaAfreediAvatar,
    status: 'online',
  },
  {
    id: 'avail-10',
    name: 'Jolly Deepak',
    position: 'Assistant Manager- Admissions',
    avatar: jollyDeepakAvatar,
    status: 'online',
  },
  {
    id: 'avail-11',
    name: 'Marjorie Briones',
    position: 'Manager - Admissions, Westford Uni Online',
    avatar: marjorieBrionesAvatar,
    status: 'online',
  },
  {
    id: 'avail-12',
    name: 'Mohammed Ahzan',
    position: 'Officer-Student Services',
    avatar: mohammedAhzanAvatar,
    status: 'offline',
  },
  {
    id: 'avail-13',
    name: 'Pradeep',
    position: 'Officer - Accounts',
    avatar: pradeepAvatar,
    status: 'online',
  },
  {
    id: 'avail-14',
    name: 'Rakesh Krishnan',
    position: 'Officer - Creative Team',
    avatar: rakeshKrishnanAvatar,
    status: 'offline',
  },
  {
    id: 'avail-15',
    name: 'Renisha Fernandes',
    position: 'Officer- Admissions',
    avatar: renishaFernandesAvatar,
    status: 'offline',
  },
  {
    id: 'avail-16',
    name: 'Rhythu Menon',
    position: 'Officer- Admissions',
    avatar: rhythuMenonAvatar,
    status: 'online',
  },
  {
    id: 'avail-17',
    name: 'Ryan Garcia',
    position: 'Manager- Student Services',
    avatar: ryanGarciaAvatar,
    status: 'online',
  },
  {
    id: 'avail-18',
    name: 'Sahar Salim',
    position: 'Assistant Manager-MARCOM',
    avatar: saharSalimAvatar,
    status: 'online',
  },
  {
    id: 'avail-19',
    name: 'Salome Sagayanathan',
    position: 'Senior Officer - Admissions',
    avatar: salomeSagayanathanAvatar,
    status: 'online',
  },
  {
    id: 'avail-20',
    name: 'Shaaista Mukaddam',
    position: 'Faculty & Course leader',
    avatar: shaaistaMukaddamAvatar,
    status: 'online',
  },
  {
    id: 'avail-21',
    name: 'Treenal Antony',
    position: 'Senior Officer - HR & Recruitment',
    avatar: treenalAntonyAvatar,
    status: 'online',
  },
  {
    id: 'avail-22',
    name: 'Upasna Nambiar',
    position: 'Training Coordinator',
    avatar: upasnaNambiarAvatar,
    status: 'online',
  },
  {
    id: 'avail-23',
    name: 'Yohani Jinadasa',
    position: 'Officer - Student Experience',
    avatar: yohaniJinadasaAvatar,
    status: 'away',
  },
  {
    id: 'avail-24',
    name: 'Zawahir Siddique',
    position: 'Dean and Head of Blended Learning',
    avatar: zawahirSiddiqueAvatar,
    status: 'away',
  },
];

// People Moments Data
export const mockPeopleMoments: PeopleMoment[] = [
  {
    id: 'moment-1',
    employeeName: 'Shazin Abdulla',
    position: 'Officer- Admissions',
    avatar: shazinAbdullaAvatar,
    date: 'May 10',
    eventType: 'work-anniversary',
    years: 1,
  },
  {
    id: 'moment-2',
    employeeName: 'Dr. Raman Subramanian',
    position: 'Associate Dean & Head of Institutional Relations',
    avatar: drRamanSubramanianAvatar,
    date: 'May 10',
    eventType: 'birthday',
  },
];

// Upcoming Events Data - Based on Figma design (node-id: 329-7969)
// Reference: https://www.figma.com/design/ekD3vfFZkc41SAoKEmHIrN/Westford-Connect-_-HRMS---Dev?node-id=329-7969&m=dev
// Helper function to get dates relative to today
const getUpcomingEventDate = (daysFromToday: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const mockUpcomingEvents: UpcomingEvent[] = [
  {
    id: 'event-1',
    title: 'WeConnect Session',
    date: getUpcomingEventDate(0), // Today
    timeRange: '09:00 AM - 1:00 PM',
    location: 'Sahara Campus',
    type: 'meeting',
  },
  {
    id: 'event-2',
    title: 'Westford Inter-Uni Fest',
    date: getUpcomingEventDate(0), // Today
    timeRange: '10:00 AM - 8:00 PM',
    location: 'Ajman Youth X Hub',
    type: 'meeting',
  },
  {
    id: 'event-3',
    title: 'Art Dubai',
    date: getUpcomingEventDate(9), // 9 days from today
    timeRange: '2:00 AM - 3:00 PM',
    location: 'Madinat Jumeirah',
    type: 'meeting',
  },
  {
    id: 'event-4',
    title: 'Westford Business Consultancy expo',
    date: getUpcomingEventDate(8), // 8 days from today
    timeRange: '11:00 AM - 2:00 PM',
    location: 'Sahara Campus',
    type: 'meeting',
  },
  {
    id: 'event-5',
    title: 'We Connect Session - Marco Beffa',
    date: getUpcomingEventDate(12), // 12 days from today
    timeRange: '11:00 AM - 1:00 PM',
    location: 'DeMont',
    type: 'meeting',
  },
  {
    id: 'event-6',
    title: 'We Connect Session - Marco Beffa with Interview',
    date: getUpcomingEventDate(15), // 15 days from today
    timeRange: '11:00 AM - 2:00 PM',
    location: 'Sahara Campus',
    type: 'meeting',
  },
  {
    id: 'event-7',
    title: 'Dubai Global Youth Summit',
    date: getUpcomingEventDate(15), // 15 days from today
    timeRange: '11:00 AM - 2:00 PM',
    location: 'TBA',
    type: 'meeting',
  },
];




