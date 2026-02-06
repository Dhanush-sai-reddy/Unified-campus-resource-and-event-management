
import { Notification, UserRole } from '../types';

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        title: 'Event Approved',
        message: 'Your event "HackOverflow 2026" has been approved.',
        type: 'success',
        createdAt: '2026-01-20T10:00:00Z',
        userId: 'u2',
        isRead: false,
    },
    {
        id: 'n2',
        title: 'New Booking Request',
        message: 'New booking request for "Lecture Hall 101" needs review.',
        type: 'info',
        createdAt: '2026-01-21T14:30:00Z',
        userId: 'u2',
        isRead: true,
    },
    {
        id: 'n3',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Saturday 10 PM.',
        type: 'warning',
        createdAt: '2026-01-22T09:00:00Z',
        userId: 'u2',
        isRead: false,
    }
];

export const MOCK_CHAT_HISTORY = [
    {
        id: 'm1',
        senderId: 'u2',
        senderName: 'John Organizer',
        content: 'Hi everyone, just checking in on the venue setup.',
        timestamp: '2026-01-24T09:00:00Z'
    },
    {
        id: 'm2',
        senderId: 'u3',
        senderName: 'Jane Student',
        content: 'Everything is on track. AV team is setting up now.',
        timestamp: '2026-01-24T09:05:00Z'
    },
    {
        id: 'm3',
        senderId: 'u1',
        senderName: 'Dr. Sarah Admin',
        content: 'Great, let me know if you need any approvals.',
        timestamp: '2026-01-24T09:10:00Z'
    }
];

export const MOCK_DASHBOARD_STATS = {
    totalEvents: 45,
    activeClubs: 12,
    totalBookings: 128,
    resourceUtilization: 76
};

export const MOCK_EVENT_TRENDS = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        {
            label: 'Events Created',
            data: [12, 19, 3, 5, 2, 3],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        },
        {
            label: 'Events Completed',
            data: [10, 15, 2, 4, 2, 2],
            borderColor: 'rgb(153, 102, 255)',
            tension: 0.1
        }
    ]
};

export const MOCK_RESOURCE_UTILIZATION = {
    labels: ['Auditorium', 'Labs', 'Seminar Halls', 'Sports Ground', 'Classrooms'],
    datasets: [{
        label: 'Utilization (%)',
        data: [85, 65, 45, 90, 60],
        backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
        ],
    }]
};

export const MOCK_CLUB_ACTIVITY = {
    labels: ['Coding Club', 'Robotics', 'Music', 'Drama', 'E-Cell'],
    datasets: [{
        label: 'Active Members',
        data: [150, 80, 120, 60, 90],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
    }]
};

export const MOCK_CLUBS = [
    {
        id: 'c1',
        name: 'Coding Club',
        description: 'For all things code and tech.',
        members: 154,
        category: 'Technology',
        joined: true
    },
    {
        id: 'c2',
        name: 'Music Club',
        description: 'Jam, practice, and perform.',
        members: 89,
        category: 'Arts',
        joined: false
    },
    {
        id: 'c3',
        name: 'Robotics Society',
        description: 'Building the future, one bot at a time.',
        members: 76,
        category: 'Technology',
        joined: false
    },
    {
        id: 'c4',
        name: 'Entrepreneurship Cell',
        description: 'Fostering innovation and startups.',
        members: 112,
        category: 'Business',
        joined: true
    }
];

export const MOCK_BUDGET_SUMMARY = {
    totalAllocated: 50000,
    totalSpent: 32450,
    remaining: 17550,
    departmentWise: [
        { department: 'Computer Science', spent: 12000 },
        { department: 'Electrical', spent: 8500 },
        { department: 'Mechanical', spent: 6000 },
        { department: 'Civil', spent: 4000 },
    ]
};

export const MOCK_CURRENT_USER = {
    id: 'u2',
    name: 'John Organizer',
    email: 'john.organizer@campus.edu',
    role: UserRole.ORGANIZER,
    avatar: 'https://ui-avatars.com/api/?name=John+Organizer&background=10b981&color=fff',
    department: 'Computer Science',
};
