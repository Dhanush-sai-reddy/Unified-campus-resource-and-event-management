// Simplified producer service (Brokers removed)

export const publishAnnouncement = async (msg: string) => {
    // Simulation
    console.log("[Mock Publish] Announcement:", msg);
};

export const publishEvent = async (event: any) => {
    // Simulation
    console.log("[Mock Publish] Event:", event.title);
};
