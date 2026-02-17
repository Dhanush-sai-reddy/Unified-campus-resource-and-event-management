import { User, UserRole, Club, Resource, Event, EventStatus, Booking } from './types';
import { addDays, setHours, startOfHour } from 'date-fns';

export const CURRENT_USER_ID = 'user-1';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Alex Johnson',
    email: 'alex@uni.edu',
    role: UserRole.ADMIN,
    department: 'Computer Science',
    clubMemberships: ['club-1'],
    avatar: 'https://picsum.photos/200'
  },
  {
    id: 'user-2',
    name: 'Samantha Lee',
    email: 'sam@uni.edu',
    role: UserRole.ORGANIZER,
    department: 'Arts',
    clubMemberships: ['club-2'],
    avatar: 'https://picsum.photos/201'
  }
];

export const MOCK_CLUBS: Club[] = [
  {
    id: 'club-1',
    name: 'Tech Innovators',
    description: 'Exploring the bleeding edge of technology and software.',
    leadId: 'user-1',
    members: ['user-1', 'user-2'],
    bannerUrl: 'https://picsum.photos/800/300'
  },
  {
    id: 'club-2',
    name: 'Debate Society',
    description: 'Fostering critical thinking and public speaking.',
    leadId: 'user-2',
    members: ['user-2'],
    bannerUrl: 'https://picsum.photos/800/301'
  }
];

export const MOCK_RESOURCES: Resource[] = [
  { id: 'res-1', name: 'Main Auditorium', type: 'HALL', capacity: 500, features: ['Stage', 'Sound System', 'Projector'], isAutoApprove: false },
  { id: 'res-2', name: 'Lab 301 (AI Lab)', type: 'LAB', capacity: 40, features: ['Computers', 'GPU Cluster', 'Whiteboard'], isAutoApprove: true },
  { id: 'res-3', name: 'Seminar Room A', type: 'ROOM', capacity: 50, features: ['Projector', 'Video Conf'], isAutoApprove: true },
  { id: 'res-4', name: 'Open Grounds', type: 'HALL', capacity: 1000, features: ['Open Space'], isAutoApprove: false },
];

const today = new Date();

export const MOCK_EVENTS: Event[] = [
  {
    id: 'evt-1',
    title: 'Annual Hackathon',
    description: '24-hour coding marathon.',
    organizerId: 'club-1',
    startDate: addDays(today, 2).toISOString(),
    endDate: addDays(today, 3).toISOString(),
    locationResourceIds: ['res-1'],
    status: EventStatus.APPROVED,
    attendees: ['user-1', 'user-2'],
    budget: 5000
  },
  {
    id: 'evt-2',
    title: 'Debate Championship',
    description: 'Inter-university debate face-off.',
    organizerId: 'club-2',
    startDate: addDays(today, 5).toISOString(),
    endDate: addDays(today, 5).toISOString(),
    locationResourceIds: ['res-3'],
    status: EventStatus.PENDING,
    attendees: [],
    budget: 200
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    resourceId: 'res-1',
    eventId: 'evt-1',
    bookedBy: 'user-1',
    startTime: setHours(startOfHour(addDays(today, 2)), 9).toISOString(),
    endTime: setHours(startOfHour(addDays(today, 3)), 18).toISOString(),
    status: 'CONFIRMED'
  }
];
