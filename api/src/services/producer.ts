export const publishAnnouncement = async (msg: string) => {
    console.log("[Mock Publish] Announcement:", msg);
};

export const publishEvent = async (event: any) => {
    console.log("[Mock Publish] Event:", event.title);
};
