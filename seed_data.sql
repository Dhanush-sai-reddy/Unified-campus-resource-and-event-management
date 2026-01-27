-- Users (Password: password123 hashed)
INSERT INTO "User" (id, email, password, name, department, role, avatar, "updatedAt") VALUES
('u1', 'admin@campus.edu', '$2a$10$w/Xj.v7rA.uQq.uQq.uQq.uQq.uQq.uQq.uQq.uQq.uQq.uQq', 'Dr. Sarah Admin', 'Administration', 'ADMIN', 'https://ui-avatars.com/api/?name=Sarah+Admin&background=6366f1&color=fff', NOW()),
('u2', 'organizer@campus.edu', '$2a$10$w/Xj.v7rA.uQq.uQq.uQq.uQq.uQq.uQq.uQq.uQq.uQq.uQq', 'John Organizer', 'Computer Science', 'ORGANIZER', 'https://ui-avatars.com/api/?name=John+Organizer&background=10b981&color=fff', NOW()),
('u3', 'student@campus.edu', '$2a$10$w/Xj.v7rA.uQq.uQq.uQq.uQq.uQq.uQq.uQq.uQq.uQq.uQq', 'Jane Student', 'Electrical Engineering', 'PARTICIPANT', 'https://ui-avatars.com/api/?name=Jane+Student&background=f59e0b&color=fff', NOW())
ON CONFLICT (email) DO NOTHING;

-- Clubs
INSERT INTO "Club" (id, name, description, category, "updatedAt") VALUES
('c1', 'Coding Club', 'A community of developers building cool things.', 'Technical', NOW()),
('c2', 'AI Society', 'Exploring the frontiers of Artificial Intelligence.', 'Technical', NOW())
ON CONFLICT (name) DO NOTHING;

-- Events
INSERT INTO "Event" (id, title, description, date, location, budget, status, "isMultiDay", "organizerId", "clubId", "updatedAt") VALUES
('e1', 'HackOverflow 2026', 'A 7-day intensive online hackathon.', '2026-01-25 09:00:00', 'Main Auditorium', 5000, 'APPROVED', true, 'u2', 'c1', NOW()),
('e2', 'AI Workshop', 'Introduction to GenAI models.', '2026-02-10 14:00:00', 'Lecture Hall 101', 200, 'PENDING', false, 'u2', 'c2', NOW()),
('e3', 'Herogasm', 'An exclusive party on wheels.', '2026-03-15 20:00:00', 'Campus Bus', 10000, 'APPROVED', false, 'u2', 'c1', NOW()),
('e4', 'Think and Purge', 'Philosophy meets debugging.', '2026-04-01 18:00:00', 'Computer Lab 1', 500, 'APPROVED', false, 'u2', 'c2', NOW()),
('e5', 'Late Night Coding', 'Caffeine and code until sunrise.', '2026-04-05 22:00:00', 'Computer Lab 1', 100, 'APPROVED', false, 'u2', 'c1', NOW()),
('e6', 'Morning Yoga', 'Stretch before you stress.', '2026-04-10 07:00:00', 'Main Auditorium', 0, 'APPROVED', false, 'u3', 'c1', NOW())
ON CONFLICT (id) DO NOTHING;

-- Resources (matching Prisma schema)
INSERT INTO "Resource" (id, name, type, description, location, capacity, "isAvailable", "requiresApproval", "updatedAt") VALUES
('r1', 'Main Auditorium', 'HALL', 'Large auditorium with stage and sound system.', 'Block A, Ground Floor', 500, true, true, NOW()),
('r2', 'Lecture Hall 101', 'ROOM', 'Standard lecture hall with projector.', 'Block B, 1st Floor', 120, true, true, NOW()),
('r3', 'Computer Lab 1', 'LAB', '60 workstations with high-speed internet.', 'Block D, Ground Floor', 60, true, true, NOW()),
('r4', 'Projector - HD', 'EQUIPMENT', 'Portable HD projector.', 'Equipment Room', NULL, true, false, NOW()),
('r5', 'Campus Bus', 'VEHICLE', '50-seater bus for events.', 'Transport Office', 50, true, true, NOW())
ON CONFLICT (id) DO NOTHING;

