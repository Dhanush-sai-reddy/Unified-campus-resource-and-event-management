import { User, UserRole, Event, EventStatus, Resource, ResourceType, Booking } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Dr. Sarah Admin',
    email: 'sarah.admin@campus.edu',
    role: UserRole.ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Admin&background=6366f1&color=fff',
    department: 'Administration',
  },
  {
    id: 'u2',
    name: 'John Organizer',
    email: 'john.organizer@campus.edu',
    role: UserRole.ORGANIZER,
    avatar: 'https://ui-avatars.com/api/?name=John+Organizer&background=10b981&color=fff',
    department: 'Computer Science',
  },
  {
    id: 'u3',
    name: 'Jane Student',
    email: 'jane.student@campus.edu',
    role: UserRole.PARTICIPANT,
    avatar: 'https://ui-avatars.com/api/?name=Jane+Student&background=f59e0b&color=fff',
    department: 'Electrical Engineering',
  },
];

export const MOCK_RESOURCES: Resource[] = [
  // Auditoriums
  { id: 'r1', name: 'Main Auditorium', type: ResourceType.ROOM, capacity: 500, status: 'AVAILABLE' },
  { id: 'r2', name: 'Mini Auditorium', type: ResourceType.ROOM, capacity: 200, status: 'AVAILABLE' },

  // Lecture Halls
  { id: 'r3', name: 'Lecture Hall 101', type: ResourceType.ROOM, capacity: 120, status: 'AVAILABLE' },
  { id: 'r4', name: 'Lecture Hall 102', type: ResourceType.ROOM, capacity: 120, status: 'AVAILABLE' },
  { id: 'r5', name: 'Lecture Hall 201', type: ResourceType.ROOM, capacity: 80, status: 'MAINTENANCE' },
  { id: 'r6', name: 'Lecture Hall 202', type: ResourceType.ROOM, capacity: 80, status: 'AVAILABLE' },

  // Conference Rooms
  { id: 'r7', name: 'Conference Room A', type: ResourceType.ROOM, capacity: 25, status: 'AVAILABLE' },
  { id: 'r8', name: 'Conference Room B', type: ResourceType.ROOM, capacity: 25, status: 'AVAILABLE' },
  { id: 'r9', name: 'Board Room', type: ResourceType.ROOM, capacity: 15, status: 'AVAILABLE' },

  // Labs
  { id: 'r10', name: 'Computer Lab 1', type: ResourceType.ROOM, capacity: 60, status: 'AVAILABLE' },
  { id: 'r11', name: 'Computer Lab 2', type: ResourceType.ROOM, capacity: 60, status: 'AVAILABLE' },
  { id: 'r12', name: 'Electronics Lab', type: ResourceType.ROOM, capacity: 40, status: 'MAINTENANCE' },
  { id: 'r13', name: 'Physics Lab', type: ResourceType.ROOM, capacity: 40, status: 'AVAILABLE' },
  { id: 'r14', name: 'Chemistry Lab', type: ResourceType.ROOM, capacity: 40, status: 'AVAILABLE' },

  // Seminar Halls
  { id: 'r15', name: 'Seminar Hall A', type: ResourceType.ROOM, capacity: 50, status: 'AVAILABLE' },
  { id: 'r16', name: 'Seminar Hall B', type: ResourceType.ROOM, capacity: 50, status: 'AVAILABLE' },

  // Open Spaces
  { id: 'r17', name: 'Open Air Theatre', type: ResourceType.ROOM, capacity: 300, status: 'AVAILABLE' },
  { id: 'r18', name: 'Central Lawn', type: ResourceType.ROOM, capacity: 500, status: 'AVAILABLE' },
  { id: 'r19', name: 'Sports Ground', type: ResourceType.ROOM, capacity: 1000, status: 'AVAILABLE' },

  // Equipment - Audio/Visual
  { id: 'e1', name: 'Projector (HD)', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e2', name: 'Projector (4K)', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e3', name: 'LED Screen 65"', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e4', name: 'LED Screen 85"', type: ResourceType.EQUIPMENT, status: 'MAINTENANCE' },
  { id: 'e5', name: 'Portable PA System', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e6', name: 'Professional PA System', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e7', name: 'Wireless Mic Set (4)', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e8', name: 'Lavalier Mic Set (2)', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },

  // Equipment - Recording
  { id: 'e9', name: 'DSLR Camera Kit', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e10', name: 'Video Camera (4K)', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e11', name: 'Tripod Stand', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e12', name: 'Ring Light Set', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e13', name: 'Green Screen', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },

  // Equipment - Computing
  { id: 'e14', name: 'Laptop Cart (20 units)', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e15', name: 'iPad Set (10 units)', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e16', name: 'VR Headset Set (5)', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },

  // Equipment - Event
  { id: 'e17', name: 'Portable Stage', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e18', name: 'Backdrop Stand', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e19', name: 'Registration Desk Set', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
  { id: 'e20', name: 'Banner Stand (5)', type: ResourceType.EQUIPMENT, status: 'AVAILABLE' },
];

export const INITIAL_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'HackOverflow 2026',
    description: 'A 7-day intensive online hackathon bringing together the brightest minds.',
    organizerId: 'u2',
    organizerName: 'Tech Committee',
    clubName: 'Coding Club',
    date: '2026-01-25T09:00:00.000Z',
    location: 'Main Auditorium',
    status: EventStatus.APPROVED,
    participants: 150,
    budget: 5000,
  },
  {
    id: 'e2',
    title: 'AI Workshop: GenAI Fundamentals',
    description: 'Introduction to Generative AI models, prompting, and applications.',
    organizerId: 'u2',
    organizerName: 'John Organizer',
    clubName: 'AI Society',
    date: '2026-02-10T14:00:00.000Z',
    location: 'Lecture Hall 101',
    status: EventStatus.PENDING,
    participants: 0,
    budget: 200,
  },
  {
    id: 'e3',
    title: 'Music Fest 2026',
    description: 'Annual cultural night featuring live performances and competitions.',
    organizerId: 'u4',
    organizerName: 'Alice Music',
    clubName: 'Cultural Club',
    date: '2026-03-05T18:00:00.000Z',
    location: 'Open Air Theatre',
    status: EventStatus.DRAFT,
    participants: 0,
    budget: 15000,
  },
  {
    id: 'e4',
    title: 'Tech Talk: Cloud Computing',
    description: 'Industry expert session on modern cloud architecture.',
    organizerId: 'u2',
    organizerName: 'John Organizer',
    clubName: 'Coding Club',
    date: '2026-02-15T10:00:00.000Z',
    location: 'Seminar Hall A',
    status: EventStatus.APPROVED,
    participants: 45,
    budget: 500,
  },
  {
    id: 'e5',
    title: 'Entrepreneurship Summit',
    description: 'Startup pitches, investor meets, and networking sessions.',
    organizerId: 'u5',
    organizerName: 'E-Cell',
    clubName: 'Entrepreneurship Cell',
    date: '2026-02-28T09:00:00.000Z',
    location: 'Main Auditorium',
    status: EventStatus.PENDING,
    participants: 0,
    budget: 8000,
  },
  {
    id: 'e6',
    title: 'Photography Workshop',
    description: 'Learn DSLR basics, composition, and post-processing.',
    organizerId: 'u6',
    organizerName: 'Photo Club',
    clubName: 'Photography Club',
    date: '2026-02-20T15:00:00.000Z',
    location: 'Conference Room A',
    status: EventStatus.APPROVED,
    participants: 20,
    budget: 300,
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    resourceId: 'r1',
    userId: 'u2',
    userName: 'John Organizer',
    eventName: 'HackOverflow 2026',
    startTime: '2026-01-25T08:00:00.000Z',
    endTime: '2026-01-25T20:00:00.000Z',
    status: 'APPROVED',
  },
  {
    id: 'b2',
    resourceId: 'r3',
    userId: 'u2',
    userName: 'John Organizer',
    eventName: 'AI Workshop: GenAI Fundamentals',
    startTime: '2026-02-10T14:00:00.000Z',
    endTime: '2026-02-10T17:00:00.000Z',
    status: 'PENDING',
  },
  {
    id: 'b3',
    resourceId: 'e1',
    userId: 'u2',
    userName: 'John Organizer',
    eventName: 'Tech Talk: Cloud Computing',
    startTime: '2026-02-15T10:00:00.000Z',
    endTime: '2026-02-15T12:00:00.000Z',
    status: 'APPROVED',
  },
];
