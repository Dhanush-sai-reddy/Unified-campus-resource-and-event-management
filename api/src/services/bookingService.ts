import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function hasConflict(resourceId: string, startTime: Date, endTime: Date, excludeBookingId?: string): Promise<boolean> {
    console.log(`[CONFLICT CHECK] Resource=${resourceId}, Request=[${startTime.toISOString()} - ${endTime.toISOString()}]`);

    const conflicting = await prisma.resourceBooking.findFirst({
        where: {
            resourceId,
            status: { in: ['APPROVED', 'PENDING'] },
            id: excludeBookingId ? { not: excludeBookingId } : undefined,
            OR: [
                { startTime: { lt: endTime }, endTime: { gt: startTime } },
            ],
        },
    });

    if (conflicting) {
        console.log(`[CONFLICT FOUND] BookingID=${conflicting.id}, Time=[${conflicting.startTime.toISOString()} - ${conflicting.endTime.toISOString()}]`);
    } else {
        console.log(`[CONFLICT CHECK] No conflict found.`);
    }

    return conflicting !== null;
}
