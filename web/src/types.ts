export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  PARTICIPANT = 'PARTICIPANT',
  STUDENT = 'PARTICIPANT',
}

export const Role = UserRole;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  clubName: string;
  date: string;
  location: string;
  status: EventStatus;
  participants: number;
  budget: number;
}

export enum ResourceType {
  ROOM = 'ROOM',
  HALL = 'HALL',
  LAB = 'LAB',
  EQUIPMENT = 'EQUIPMENT',
  VEHICLE = 'VEHICLE',
  OTHER = 'OTHER',
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  description?: string;
  location?: string;
  capacity?: number;
  image?: string;
  isAvailable: boolean;
  requiresApproval: boolean;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  eventId?: string;
  title: string;
  purpose?: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  adminNotes?: string;
  resource?: {
    name: string;
    type: ResourceType;
    location?: string;
  };
  user?: {
    name: string;
    avatar?: string;
  };
}

export interface AnalyticsData {
  name: string;
  value: number;
}