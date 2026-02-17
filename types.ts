export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  STUDENT = 'STUDENT'
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  clubMemberships: string[]; // Club IDs
}

export interface Club {
  id: string;
  name: string;
  description: string;
  leadId: string;
  members: string[];
  bannerUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string; // Club ID or User ID
  startDate: string; // ISO String
  endDate: string; // ISO String
  locationResourceIds: string[]; // Resource IDs
  status: EventStatus;
  attendees: string[];
  budget?: number;
  collaborators?: string[]; // Club IDs
}

export interface Resource {
  id: string;
  name: string;
  type: 'ROOM' | 'LAB' | 'EQUIPMENT' | 'HALL';
  capacity: number;
  features: string[];
  isAutoApprove: boolean;
}

export interface Booking {
  id: string;
  resourceId: string;
  eventId: string;
  bookedBy: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  channelId: string; // 'general', 'event-xyz', 'club-abc'
}
