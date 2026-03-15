export interface Reminder {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  dueDate: Date;
  formattedDate: string;
  formattedTime: string;
  status: 'missed' | 'upcoming';
  pinned?: boolean;
  favorited?: boolean;
  isShared?: boolean;
  noteId?: string; // Link to original note if created from note
}

export type ReminderFilter = 'overdue' | 'upcoming';

