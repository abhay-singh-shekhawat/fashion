export type NotificationType = 'achievement' | 'suggestion' | 'scan_complete' | 'chat' | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  data?: any;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}