
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Users
    const password = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@campus.edu' },
        update: {},
        create: {
            email: 'admin@campus.edu',
            name: 'Dr. Sarah Admin',
            password,
            role: 'ADMIN',
            department: 'Administration',
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Admin&background=6366f1&color=fff',
        },
    });

    const organizer = await prisma.user.upsert({
        where: { email: 'organizer@campus.edu' },
        update: {},
        create: {
            email: 'organizer@campus.edu',
            name: 'John Organizer',
            password,
            role: 'ORGANIZER',
            department: 'Computer Science',
            avatar: 'https://ui-avatars.com/api/?name=John+Organizer&background=10b981&color=fff',
        },
    });

    const student = await prisma.user.upsert({
        where: { email: 'student@campus.edu' },
        update: {},
        create: {
            email: 'student@campus.edu',
            name: 'Jane Student',
            password,
            role: 'PARTICIPANT',
            department: 'Electrical Engineering',
            avatar: 'https://ui-avatars.com/api/?name=Jane+Student&background=f59e0b&color=fff',
        },
    });

    console.log(`✅ Created ${admin.name}, ${organizer.name}, ${student.name}`);

    // 2. Create Clubs
    const codingClub = await prisma.club.upsert({
        where: { name: 'Coding Club' },
        update: {},
        create: {
            name: 'Coding Club',
            description: 'A community of developers building cool things.',
            category: 'Technical',
        },
    });

    const aiSociety = await prisma.club.upsert({
        where: { name: 'AI Society' },
        update: {},
        create: {
            name: 'AI Society',
            description: 'Exploring the frontiers of Artificial Intelligence.',
            category: 'Technical',
        },
    });

    console.log('✅ Created clubs');

    // 3. Clear Events (Empty state for admin manual entry)
    await prisma.event.deleteMany({});
    console.log('✅ Cleared all events (Ready for manual entry)');

    // 4. Create Resources
    // Delete existing resources and recreate (for dev seeding)
    await prisma.resourceBooking.deleteMany({});
    await prisma.resource.deleteMany({});

    const resources = [
        {
            name: 'Main Auditorium',
            type: 'HALL',
            description: 'Large auditorium for events and conferences.',
            capacity: 500,
            requiresApproval: true,
            isAvailable: true,
        },
        {
            name: 'Computer Lab 1',
            type: 'LAB',
            description: 'High-performance computer lab.',
            capacity: 30,
            requiresApproval: false,
            isAvailable: true,
        },
        {
            name: 'Conference Room A',
            type: 'ROOM',
            description: 'Meeting room with projector.',
            capacity: 15,
            requiresApproval: false,
            isAvailable: true,
        }
    ];

    for (const resource of resources) {
        await prisma.resource.create({
            data: resource,
        });
    }

    console.log('✅ Created resources');

    // Clear bookings to ensure no conflicts
    await prisma.resourceBooking.deleteMany({});
    console.log('✅ Cleared all bookings');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
