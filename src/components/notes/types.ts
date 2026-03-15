export interface SharedPerson {
  id: string;
  permission: 'view' | 'edit';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  formattedDate: string;
  formattedTime: string;
  pinned?: boolean;
  favorited?: boolean;
  shared?: boolean;
  isShared?: boolean;
  hasReminder?: boolean;
  reminderDate?: Date;
  sharedWith?: SharedPerson[];
}

export type NoteFilter = 'all' | 'my-notes' | 'shared-with-me' | 'favorites';

