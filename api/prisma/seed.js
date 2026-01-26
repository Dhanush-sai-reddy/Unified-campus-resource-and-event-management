
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

    // 3. Create Events
    await prisma.event.create({
        data: {
            title: 'HackOverflow 2026',
            description: 'A 7-day intensive online hackathon.',
            date: new Date('2026-01-25T09:00:00Z'),
            location: 'Main Auditorium',
            budget: 5000,
            status: 'APPROVED',
            isMultiDay: true,
            organizerId: organizer.id,
            clubId: codingClub.id,
        },
    });

    await prisma.event.create({
        data: {
            title: 'AI Workshop',
            description: 'Introduction to GenAI models.',
            date: new Date('2026-02-10T14:00:00Z'),
            location: 'Lecture Hall 101',
            budget: 200,
            status: 'PENDING',
            organizerId: organizer.id,
            clubId: aiSociety.id,
        },
    });

    console.log('✅ Created events');

    // 4. Create Resources
    const resources = [
        // Rooms & Halls
        {
            name: 'Main Auditorium',
            type: 'HALL',
            description: 'Large auditorium with stage, sound system, and seating for 500.',
            location: 'Block A, Ground Floor',
            capacity: 500,
            requiresApproval: true,
        },
        {
            name: 'Lecture Hall 101',
            type: 'ROOM',
            description: 'Standard lecture hall with projector and whiteboard.',
            location: 'Block B, 1st Floor',
            capacity: 120,
            requiresApproval: true,
        },
        {
            name: 'Lecture Hall 102',
            type: 'ROOM',
            description: 'Lecture hall with video conferencing setup.',
            location: 'Block B, 1st Floor',
            capacity: 100,
            requiresApproval: true,
        },
        {
            name: 'Seminar Room A',
            type: 'ROOM',
            description: 'Small seminar room for presentations and discussions.',
            location: 'Block C, 2nd Floor',
            capacity: 40,
            requiresApproval: false,
        },
        {
            name: 'Seminar Room B',
            type: 'ROOM',
            description: 'Seminar room with round table setup.',
            location: 'Block C, 2nd Floor',
            capacity: 30,
            requiresApproval: false,
        },
        {
            name: 'Conference Room 1',
            type: 'ROOM',
            description: 'Executive conference room with video calling.',
            location: 'Admin Block, 3rd Floor',
            capacity: 20,
            requiresApproval: true,
        },
        // Labs
        {
            name: 'Computer Lab 1',
            type: 'LAB',
            description: '60 workstations with high-speed internet.',
            location: 'Block D, Ground Floor',
            capacity: 60,
            requiresApproval: true,
        },
        {
            name: 'Computer Lab 2',
            type: 'LAB',
            description: '40 workstations with GPU-enabled machines.',
            location: 'Block D, 1st Floor',
            capacity: 40,
            requiresApproval: true,
        },
        {
            name: 'Electronics Lab',
            type: 'LAB',
            description: 'Equipped with oscilloscopes, function generators, and soldering stations.',
            location: 'Block E, Ground Floor',
            capacity: 30,
            requiresApproval: true,
        },
        {
            name: 'Robotics Lab',
            type: 'LAB',
            description: 'Specialized lab for robotics projects with 3D printers.',
            location: 'Block E, 1st Floor',
            capacity: 25,
            requiresApproval: true,
        },
        // Equipment
        {
            name: 'Projector - HD (Unit 1)',
            type: 'EQUIPMENT',
            description: 'Portable HD projector with HDMI support.',
            location: 'Equipment Room, Block A',
            capacity: null,
            requiresApproval: false,
        },
        {
            name: 'Projector - HD (Unit 2)',
            type: 'EQUIPMENT',
            description: 'Portable HD projector with HDMI support.',
            location: 'Equipment Room, Block A',
            capacity: null,
            requiresApproval: false,
        },
        {
            name: 'Sound System - Portable',
            type: 'EQUIPMENT',
            description: '2 speakers + amplifier + 2 wireless mics.',
            location: 'Equipment Room, Block A',
            capacity: null,
            requiresApproval: true,
        },
        {
            name: 'DSLR Camera Kit',
            type: 'EQUIPMENT',
            description: 'Canon EOS with multiple lenses and tripod.',
            location: 'Media Room, Block A',
            capacity: null,
            requiresApproval: true,
        },
        {
            name: 'Video Camera',
            type: 'EQUIPMENT',
            description: 'Professional video camera with stabilizer.',
            location: 'Media Room, Block A',
            capacity: null,
            requiresApproval: true,
        },
        {
            name: 'Whiteboard - Portable',
            type: 'EQUIPMENT',
            description: '4x3 ft portable whiteboard on wheels.',
            location: 'Equipment Room, Block B',
            capacity: null,
            requiresApproval: false,
        },
        // Vehicles
        {
            name: 'Campus Bus (50-seater)',
            type: 'VEHICLE',
            description: 'Large bus for field trips and events.',
            location: 'Transport Office',
            capacity: 50,
            requiresApproval: true,
        },
        {
            name: 'Mini Bus (20-seater)',
            type: 'VEHICLE',
            description: 'Mini bus for small group transport.',
            location: 'Transport Office',
            capacity: 20,
            requiresApproval: true,
        },
    ];

    // Delete existing resources and recreate (for dev seeding)
    await prisma.resourceBooking.deleteMany({});
    await prisma.resource.deleteMany({});

    const createdResources = [];
    for (const resource of resources) {
        const created = await prisma.resource.create({
            data: resource,
        });
        createdResources.push(created);
    }

    // Get organizer user for bookings
    const bookingOrganizer = await prisma.user.findFirst({
        where: { role: 'ORGANIZER' },
    });

    if (bookingOrganizer && createdResources.length > 0) {
        // Create sample bookings for today and tomorrow
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sampleBookings = [
            {
                resourceId: createdResources[0].id, // Main Auditorium
                userId: bookingOrganizer.id,
                title: 'Annual Tech Symposium',
                purpose: 'Annual technology symposium with guest speakers',
                startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
                endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM
                status: 'APPROVED',
            },
            {
                resourceId: createdResources[0].id, // Main Auditorium
                userId: bookingOrganizer.id,
                title: 'Cultural Night Rehearsal',
                purpose: 'Practice session for cultural night',
                startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM
                endTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5 PM
                status: 'APPROVED',
            },
            {
                resourceId: createdResources[1].id, // Lecture Hall A
                userId: bookingOrganizer.id,
                title: 'AI Workshop',
                purpose: 'Machine learning hands-on workshop',
                startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
                endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1 PM
                status: 'APPROVED',
            },
            {
                resourceId: createdResources[5].id, // Computer Lab 1
                userId: bookingOrganizer.id,
                title: 'Hackathon Day 1',
                purpose: '24-hour coding competition',
                startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8 AM
                endTime: new Date(today.getTime() + 20 * 60 * 60 * 1000), // 8 PM
                status: 'APPROVED',
            },
            {
                resourceId: createdResources[2].id, // Lecture Hall B
                userId: bookingOrganizer.id,
                title: 'Guest Lecture: Startup Funding',
                purpose: 'E-Cell organized talk by VC partner',
                startTime: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000), // 11 AM
                endTime: new Date(tomorrow.getTime() + 13 * 60 * 60 * 1000), // 1 PM
                status: 'PENDING',
            },
            {
                resourceId: createdResources[0].id, // Main Auditorium
                userId: bookingOrganizer.id,
                title: 'Annual Day Event',
                purpose: 'Main annual day celebration',
                startTime: new Date(tomorrow.getTime() + 15 * 60 * 60 * 1000), // 3 PM
                endTime: new Date(tomorrow.getTime() + 20 * 60 * 60 * 1000), // 8 PM
                status: 'PENDING',
            },
        ];

        for (const booking of sampleBookings) {
            await prisma.resourceBooking.create({ data: booking });
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
