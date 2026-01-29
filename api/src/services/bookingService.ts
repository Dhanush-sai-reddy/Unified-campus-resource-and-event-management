import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checks if a resource has a booking conflict for the given time range.
 * @param resourceId ID of the resource to check
 * @param startTime Start time of the proposed booking
 * @param endTime End time of the proposed booking
 * @param excludeBookingId Optional booking ID to exclude (for updates)
 * @returns boolean True if a conflict exists
 */
export async function hasConflict(resourceId: string, startTime: Date, endTime: Date, excludeBookingId?: string): Promise<boolean> {
    console.log(`[CONFLICT CHECK] Resource=${resourceId}, Request=[${startTime.toISOString()} - ${endTime.toISOString()}]`);

    const conflicting = await prisma.resourceBooking.findFirst({
        where: {
            resourceId,
            status: { in: ['PENDING', 'APPROVED'] },
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
