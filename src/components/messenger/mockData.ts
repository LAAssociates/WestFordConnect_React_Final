import type { User, Conversation, Message, ProjectGroup } from './types';
import akshayaNairAvatar from '../../assets/images/org-avatars/akshaya-nair.png';
import amrithaKrishnanAvatar from '../../assets/images/org-avatars/amritha-krishnan.png';
import anamShahidAvatar from '../../assets/images/org-avatars/anam-shahid.png';
import aprilBalasonAvatar from '../../assets/images/org-avatars/april-balason.png';
import avijitGuinAvatar from '../../assets/images/org-avatars/avijit-guin.png';
import treenalAntonyAvatar from '../../assets/images/org-avatars/treenal-antony.png';
import bennettVargheseAvatar from '../../assets/images/avatars/avatar-2.png';
import bhaktiMulyeAvatar from '../../assets/images/avatars/bhakti-mulye.png';
import zahirSiddiqueAvatar from '../../assets/images/avatars/yohani-jinadasa.png';
import saharSalimAvatar from '../../assets/images/avatars/sahar-salim.png';
import rakeshKrishnanAvatar from '../../assets/images/avatars/avatar-3.png';
import vinitaManeAvatar from '../../assets/images/avatars/avatar-4.png';
import marjorieBrionesAvatar from '../../assets/images/avatars/avatar-5.png';
import kadarshahAvatar from '../../assets/images/avatars/avatar-2.png';
import praveenAvatar from '../../assets/images/avatars/avatar-3.png';
import selfStudyPlatformIcon from '../../assets/images/messenger-client-group/self-study-platform.svg';
import westfordAdmissionIcon from '../../assets/images/messenger-client-group/westford-admission.svg';
import marcomTeamIcon from '../../assets/images/messenger-client-group/marcom-team.svg';

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Current timestamp used as reference for all relative dates
 */
const now = new Date();

/**
 * Creates a date that is N hours ago from now
 */
const hoursAgo = (hours: number): Date => new Date(now.getTime() - hours * 60 * 60 * 1000);

/**
 * Creates a date that is N days ago from now
 */
const daysAgo = (days: number): Date => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

// ============================================================================
// User Data
// ============================================================================

/**
 * Mock user data for the messenger application
 */
export const mockUsers: User[] = [
  { id: 'user-1', name: 'You', position: 'CEO & Co-Founder', email: 'you@westford.edu', avatar: akshayaNairAvatar, status: 'online' },
  { id: 'user-2', name: 'Akshaya Nair', position: 'Officer - Student Services', email: 'akshaya.nair@westford.edu', avatar: akshayaNairAvatar, status: 'online' },
  { id: 'user-3', name: 'Anam Shahid', position: 'Faculty & Course leader', email: 'anam.shahid@westford.edu', avatar: anamShahidAvatar, status: 'online' },
  { id: 'user-4', name: 'Anne Jacob', position: 'Officer- Admissions', email: 'anne.jacob@westford.edu', avatar: amrithaKrishnanAvatar, status: 'online' },
  { id: 'user-5', name: 'April Balason', position: 'Executive- Operations', email: 'april.balason@westford.edu', avatar: aprilBalasonAvatar, status: 'online' },
  { id: 'user-6', name: 'Bennett Varghese', position: 'Officer- Admissions', email: 'bennett.varghese@westford.edu', avatar: bennettVargheseAvatar, status: 'away' },
  { id: 'user-7', name: 'Bethoven Filomeno', position: 'Senior Faculty', email: 'bethoven.filomeno@westford.edu', avatar: bhaktiMulyeAvatar, status: 'offline' },
  { id: 'user-8', name: 'Bhakti Mulye', position: 'Associate Faculty', email: 'bhakti.mulye@westford.edu', avatar: bhaktiMulyeAvatar, status: 'online' },
  { id: 'user-9', name: 'Zawahir Siddique', position: 'Dean and Head of Blended Learning', email: 'zawahir.siddique@westford.edu', avatar: zahirSiddiqueAvatar, status: 'online' },
  { id: 'user-10', name: 'Marjorie Briones', position: 'Manager - Admissions, Westford Uni...', email: 'marjorie.briones@westford.edu', avatar: marjorieBrionesAvatar, status: 'online' },
  { id: 'user-11', name: 'Treenal Antony', position: 'Staff', email: 'treenal.antony@westford.edu', avatar: treenalAntonyAvatar, status: 'online' },
  { id: 'user-12', name: 'Sahar Salim', position: 'Designer', email: 'sahar.salim@westford.edu', avatar: saharSalimAvatar, status: 'online' },
  { id: 'user-13', name: 'Rakesh Krishnan', position: 'Staff', email: 'rakesh.krishnan@westford.edu', avatar: rakeshKrishnanAvatar, status: 'offline' },
  { id: 'user-14', name: 'Vinita Mane', position: 'Staff', email: 'vinita.mane@westford.edu', avatar: vinitaManeAvatar, status: 'online' },
  { id: 'user-15', name: 'Avijit Guin', position: 'Officer- Student Services', email: 'avijit.guin@westford.edu', avatar: avijitGuinAvatar, status: 'online' },
  { id: 'user-16', name: 'Amritha Krishnan', position: 'Faculty', email: 'amritha.krishnan@westford.edu', avatar: amrithaKrishnanAvatar, status: 'online' },
  { id: 'user-17', name: 'Kadarshah', position: 'Staff', email: 'kadarshah@westford.edu', avatar: kadarshahAvatar, status: 'online' },
  { id: 'user-18', name: 'Praveen', position: 'Staff', email: 'praveen@westford.edu', avatar: praveenAvatar, status: 'online' },
];

// ============================================================================
// User Lookup Optimization
// ============================================================================

/**
 * Map for O(1) user lookups by ID
 */
const usersById = new Map<string, User>(mockUsers.map(user => [user.id, user]));

/**
 * Gets a user by their ID with O(1) lookup performance
 * @param id - The user ID to lookup
 * @returns The user object if found, throws error if not found
 */
const getUser = (id: string): User => {
  const user = usersById.get(id);
  if (!user) {
    throw new Error(`User with id "${id}" not found`);
  }
  return user;
};

// ============================================================================
// Message Creation Helpers
// ============================================================================

/**
 * Creates a message object with the specified properties
 * @param id - Unique message identifier
 * @param senderId - ID of the user who sent the message
 * @param senderName - Display name of the sender
 * @param content - Message text content
 * @param hoursAgo - Hours ago from now when the message was sent
 * @param status - Message delivery status
 * @returns A Message object
 */
const createMessage = (
  id: string,
  senderId: string,
  senderName: string,
  content: string,
  hoursAgo: number,
  status: 'sent' | 'delivered' | 'read' = 'read'
): Message => ({
  id,
  senderId,
  senderName,
  content,
  timestamp: hoursAgo > 0 ? new Date(now.getTime() - hoursAgo * 60 * 60 * 1000) : now,
  status,
});

/**
 * Gets the last (most recent) message from a message array
 * @param messages - Array of messages
 * @returns The last message in the array
 */
const getLastMessage = (messages: Message[]): Message => {
  if (messages.length === 0) {
    throw new Error('Cannot get last message from empty array');
  }
  return messages[messages.length - 1];
};

// ============================================================================
// Message Data (Pre-computed)
// ============================================================================

/**
 * Creates all messages for a conversation
 * Messages are ordered chronologically (oldest first, newest last)
 */
const createConversationMessages = (conversationId: string): Message[] => {
  switch (conversationId) {
    case 'conv-1':
      // Self Study Platform - Project Group: 6 unread, 6 mentions
      return [
        createMessage('msg-1-7', 'user-16', 'Amritha Krishnan', '@You Could you please review the assignment structure? We need your input on the grading rubric.', 48, 'read'),
        createMessage('msg-1-6', 'user-17', 'Kadarshah', '@You The course materials are ready for upload. Should we proceed with the beta version?', 36, 'read'),
        createMessage('msg-1-5', 'user-16', 'Amritha Krishnan', '@You I have some questions about the module sequencing. Can we discuss this?', 24, 'read'),
        createMessage('msg-1-4', 'user-17', 'Kadarshah', '@You The technical team needs approval for the platform updates. Please check when convenient.', 12, 'read'),
        createMessage('msg-1-3', 'user-16', 'Amritha Krishnan', '@You Student feedback has been collected. We need your decision on the implementation timeline.', 6, 'read'),
        createMessage('msg-1-2', 'user-17', 'Kadarshah', '@You In the Assignment brief for MPO the course name should be mentioned clearly in the header section.', 3, 'read'),
        createMessage('msg-1-1', 'user-17', 'Kadarshah', 'In the Assignment brief for MPO the course name should be mentioned clearly in the header section.', 1.5, 'read'),
      ];
    case 'conv-2':
      // Treenal Antony: 0 unread
      return [
        createMessage('msg-2-3', 'user-11', 'Treenal Antony', 'Thank you for the guidance, Sir. I will proceed accordingly.', 2, 'read'),
        createMessage('msg-2-2', 'user-1', 'You', 'Please ensure all documentation is complete before submission.', 1, 'read'),
        createMessage('msg-2-1', 'user-11', 'Treenal Antony', 'Good morning, Sir. The recruitment update for the academic year has been finalized and submitted.', 0.5, 'read'),
      ];
    case 'conv-3':
      // Westford Admissions: 0 unread
      return [
        createMessage('msg-3-3', 'user-18', 'Praveen', 'All team members have been notified about the new process.', 2, 'read'),
        createMessage('msg-3-2', 'user-6', 'Bennett Varghese', 'Thanks for sharing the updates.', 1.5, 'read'),
        createMessage('msg-3-1', 'user-18', 'Praveen', '@All Sent the updated lead conversion report. Please review and provide feedback by end of day.', 1.2, 'read'),
      ];
    case 'conv-4':
      // Bennett Varghese: 3 unread
      return [
        createMessage('msg-4-4', 'user-6', 'Bennett Varghese', 'The admission portal has been updated with the new intake data.', 8, 'read'),
        createMessage('msg-4-3', 'user-6', 'Bennett Varghese', 'We are seeing a significant increase in applications this quarter.', 5, 'read'),
        createMessage('msg-4-2', 'user-6', 'Bennett Varghese', 'The UGC compliance documents have been submitted successfully.', 3, 'read'),
        createMessage('msg-4-1', 'user-6', 'Bennett Varghese', 'UGC intake figures have crossed 200, Sir.', 1.75, 'read'),
      ];
    case 'conv-5':
      // Marjorie Briones: 6 unread
      return [
        createMessage('msg-5-7', 'user-10', 'Marjorie Briones', 'The CRM system integration is progressing well. We should have it live by next week.', 36, 'read'),
        createMessage('msg-5-6', 'user-10', 'Marjorie Briones', 'I have prepared a detailed report on the lead quality metrics for your review.', 24, 'read'),
        createMessage('msg-5-5', 'user-10', 'Marjorie Briones', 'The follow-up process for pending applications needs your approval.', 18, 'read'),
        createMessage('msg-5-4', 'user-10', 'Marjorie Briones', 'We have identified several high-priority leads that require immediate attention.', 12, 'read'),
        createMessage('msg-5-3', 'user-10', 'Marjorie Briones', 'The team has completed the initial screening of all new applications.', 6, 'read'),
        createMessage('msg-5-2', 'user-10', 'Marjorie Briones', 'I need your input on the new lead qualification criteria before we proceed.', 4, 'read'),
        createMessage('msg-5-1', 'user-10', 'Marjorie Briones', "Let's ensure the new leads are tagged properly in the system with the correct priority levels.", 2.25, 'read'),
      ];
    case 'conv-6':
      // Sahar Salim: 0 unread
      return [
        createMessage('msg-6-3', 'user-12', 'Sahar Salim', 'Perfect! I will make those changes and send you the updated version.', 3, 'read'),
        createMessage('msg-6-2', 'user-1', 'You', 'The color scheme looks good, just adjust the spacing a bit.', 2.75, 'read'),
        createMessage('msg-6-1', 'user-1', 'You', "Yea that's fine.", 2.5, 'read'),
      ];
    case 'conv-7':
      // Zawahir Siddique: 0 unread
      return [
        createMessage('msg-7-3', 'user-9', 'Zawahir Siddique', 'Thank you, I will prepare the documents accordingly.', 26, 'read'),
        createMessage('msg-7-2', 'user-1', 'You', 'Please include the course outline and learning objectives.', 25, 'read'),
        createMessage('msg-7-1', 'user-1', 'You', 'May I share them for your review?', 24, 'delivered'),
      ];
    case 'conv-8':
      // Rakesh Krishnan: 2 unread
      return [
        createMessage('msg-8-3', 'user-13', 'Rakesh Krishnan', 'The design team has approved the concept. We can proceed with production.', 30, 'read'),
        createMessage('msg-8-2', 'user-13', 'Rakesh Krishnan', 'I have made the requested changes to the poster layout.', 26, 'read'),
        createMessage('msg-8-1', 'user-13', 'Rakesh Krishnan', 'Dubai Run Poster.jpg', 24, 'read'),
      ];
    case 'conv-9':
      // Vinita Mane: 2 unread
      return [
        createMessage('msg-9-3', 'user-14', 'Vinita Mane', 'I will send you the revised version by end of day today.', 30, 'read'),
        createMessage('msg-9-2', 'user-14', 'Vinita Mane', 'The spacing issues have been noted. Working on the adjustments now.', 26, 'read'),
        createMessage('msg-9-1', 'user-14', 'Vinita Mane', 'The final banner needs a cleaner layout at the bottom section. Can we reduce the text density?', 24, 'read'),
      ];
    case 'conv-10':
      // Marcom Team: 1 unread
      return [
        createMessage('msg-10-2', 'user-12', 'Rakesh Krishnan', 'The quote has been finalized and approved by the client.', 80, 'read'),
        createMessage('msg-10-1', 'user-18', 'Praveen', 'Rakesh: April- wednesday Quote-03.jpg', 72, 'read'),
      ];
    default:
      return [];
  }
};

/**
 * Pre-computed messages for all conversations
 * This eliminates duplicate function calls and ensures consistency
 */
const allMessages: Record<string, Message[]> = {
  'conv-1': createConversationMessages('conv-1'),
  'conv-2': createConversationMessages('conv-2'),
  'conv-3': createConversationMessages('conv-3'),
  'conv-4': createConversationMessages('conv-4'),
  'conv-5': createConversationMessages('conv-5'),
  'conv-6': createConversationMessages('conv-6'),
  'conv-7': createConversationMessages('conv-7'),
  'conv-8': createConversationMessages('conv-8'),
  'conv-9': createConversationMessages('conv-9'),
  'conv-10': createConversationMessages('conv-10'),
};

// ============================================================================
// Conversation Data
// ============================================================================

/**
 * Mock conversations data
 * Uses pre-computed messages to avoid duplicate function calls
 */
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    type: 'group',
    name: 'Self Study Platform - Project Group',
    avatar: selfStudyPlatformIcon,
    lastMessage: getLastMessage(allMessages['conv-1']),
    lastMessageTime: hoursAgo(1.5),
    unreadCount: 6,
    isPinned: true,
    mentions: 6,
    participants: [getUser('user-1'), getUser('user-16'), getUser('user-17')],
  },
  {
    id: 'conv-2',
    type: 'individual',
    name: 'Treenal Antony',
    avatar: treenalAntonyAvatar,
    lastMessage: getLastMessage(allMessages['conv-2']),
    lastMessageTime: hoursAgo(0.5),
    unreadCount: 0,
    participants: [getUser('user-1'), getUser('user-11')],
  },
  {
    id: 'conv-3',
    type: 'group',
    name: 'Westford Admissions',
    avatar: westfordAdmissionIcon,
    lastMessage: getLastMessage(allMessages['conv-3']),
    lastMessageTime: hoursAgo(1.2),
    unreadCount: 0,
    participants: [getUser('user-1'), getUser('user-18'), getUser('user-6')],
  },
  {
    id: 'conv-4',
    type: 'individual',
    name: 'Bennett Varghese',
    avatar: bennettVargheseAvatar,
    lastMessage: getLastMessage(allMessages['conv-4']),
    lastMessageTime: hoursAgo(1.75),
    unreadCount: 3,
    participants: [getUser('user-1'), getUser('user-6')],
  },
  {
    id: 'conv-5',
    type: 'individual',
    name: 'Marjorie Briones',
    avatar: marjorieBrionesAvatar,
    lastMessage: getLastMessage(allMessages['conv-5']),
    lastMessageTime: hoursAgo(2.25),
    unreadCount: 6,
    participants: [getUser('user-1'), getUser('user-10')],
  },
  {
    id: 'conv-6',
    type: 'individual',
    name: 'Sahar Salim',
    avatar: saharSalimAvatar,
    lastMessage: getLastMessage(allMessages['conv-6']),
    lastMessageTime: hoursAgo(2.5),
    unreadCount: 0,
    participants: [getUser('user-1'), getUser('user-12')],
  },
  {
    id: 'conv-7',
    type: 'individual',
    name: 'Zawahir Siddique',
    avatar: zahirSiddiqueAvatar,
    lastMessage: getLastMessage(allMessages['conv-7']),
    lastMessageTime: daysAgo(1),
    unreadCount: 0,
    participants: [getUser('user-1'), getUser('user-9')],
  },
  {
    id: 'conv-8',
    type: 'individual',
    name: 'Rakesh Krishnan',
    avatar: rakeshKrishnanAvatar,
    lastMessage: getLastMessage(allMessages['conv-8']),
    lastMessageTime: daysAgo(1),
    unreadCount: 2,
    participants: [getUser('user-1'), getUser('user-13')],
  },
  {
    id: 'conv-9',
    type: 'individual',
    name: 'Vinita Mane',
    avatar: vinitaManeAvatar,
    lastMessage: getLastMessage(allMessages['conv-9']),
    lastMessageTime: daysAgo(1),
    unreadCount: 2,
    participants: [getUser('user-1'), getUser('user-14')],
  },
  {
    id: 'conv-10',
    type: 'group',
    name: 'Marcom Team',
    avatar: marcomTeamIcon,
    lastMessage: getLastMessage(allMessages['conv-10']),
    lastMessageTime: daysAgo(3),
    unreadCount: 1,
    participants: [getUser('user-1'), getUser('user-18'), getUser('user-12')],
  },
];

/**
 * Exported messages by conversation ID
 * Uses pre-computed messages for optimal performance
 */
export const mockMessages: Record<string, Message[]> = allMessages;

// ============================================================================
// Project Groups Data
// ============================================================================

/**
 * Mock project groups data
 */
export const mockProjectGroups: ProjectGroup[] = [
  {
    id: 'grp-1',
    name: 'Self Study Platform - Project Group',
    icon: selfStudyPlatformIcon,
    members: [getUser('user-16'), getUser('user-17'), getUser('user-1')],
    createdAt: daysAgo(30),
  },
  {
    id: 'grp-2',
    name: 'Westford Admissions',
    icon: westfordAdmissionIcon,
    members: [getUser('user-18'), getUser('user-6'), getUser('user-1')],
    createdAt: daysAgo(45),
  },
  {
    id: 'grp-3',
    name: 'Marcom Team',
    icon: marcomTeamIcon,
    members: [getUser('user-18'), getUser('user-12'), getUser('user-1')],
    createdAt: daysAgo(60),
  },
];
