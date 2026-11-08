/*
# ChurchConnect - Phase 2 Demo Data

Seeds ministries, ministry_members, events, attendance sessions, visitors, and follow-ups.
*/

-- Insert ministries for Accra Central branch
INSERT INTO ministries (church_id, branch_id, name, description, leader_id, assistant_leader_id, meeting_day, meeting_time, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Youth Ministry', 'A vibrant ministry for young people aged 18-35', m1.id, m2.id, 'Saturday', '4:00 PM', true
FROM members m1, members m2 WHERE m1.member_code = 'CC-0013' AND m2.member_code = 'CC-0014'
ON CONFLICT DO NOTHING;

INSERT INTO ministries (church_id, branch_id, name, description, leader_id, meeting_day, meeting_time, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Mens Ministry', 'Equipping men to be godly leaders in their homes and communities', m1.id, 'Tuesday', '7:00 PM', true
FROM members m1 WHERE m1.member_code = 'CC-0015'
ON CONFLICT DO NOTHING;

INSERT INTO ministries (church_id, branch_id, name, description, leader_id, meeting_day, meeting_time, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Womens Ministry', 'Empowering women to grow in faith and serve their generation', m1.id, 'Wednesday', '5:00 PM', true
FROM members m1 WHERE m1.member_code = 'CC-0010'
ON CONFLICT DO NOTHING;

INSERT INTO ministries (church_id, branch_id, name, description, leader_id, meeting_day, meeting_time, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Choir & Praise Team', 'Leading the congregation in worship through music', m1.id, 'Friday', '6:00 PM', true
FROM members m1 WHERE m1.member_code = 'CC-0008'
ON CONFLICT DO NOTHING;

INSERT INTO ministries (church_id, branch_id, name, description, leader_id, meeting_day, meeting_time, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Media Team', 'Managing audio, visual, and streaming for all services', m1.id, 'Sunday', '7:30 AM', true
FROM members m1 WHERE m1.member_code = 'CC-0011'
ON CONFLICT DO NOTHING;

INSERT INTO ministries (church_id, branch_id, name, description, leader_id, meeting_day, meeting_time, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Ushering & Protocol', 'Welcoming members and visitors, maintaining order during services', m1.id, 'Sunday', '7:30 AM', true
FROM members m1 WHERE m1.member_code = 'CC-0019'
ON CONFLICT DO NOTHING;

-- Insert events
INSERT INTO events (church_id, branch_id, title, description, event_date, start_time, end_time, venue, speaker, organizer, registration_required, registration_limit, registration_fee, status)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Easter Convention 2026', 'Three-day Easter convention with guest speakers, worship, and prayer.', '2026-09-20', '6:00 PM', '9:00 PM', 'Main Auditorium, Accra Central', 'Rev. Dr. Kwame Asante', 'Church Administration', true, 500, 0, 'upcoming'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Youth Conference: Arise 2026', 'Annual youth conference with workshops, worship, and fellowship.', '2026-09-28', '9:00 AM', '4:00 PM', 'Youth Hall, Accra Central', 'Min. Samuel Boateng', 'Youth Ministry', true, 200, 20.00, 'upcoming'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Marriage Seminar', 'A one-day seminar for married and engaged couples.', '2026-09-14', '10:00 AM', '2:00 PM', 'Fellowship Hall', 'Pastor & Mrs. Osei', 'Mens & Womens Ministries', true, 100, 50.00, 'upcoming'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Community Outreach', 'Evangelism and community service in the Madina area.', '2026-08-30', '8:00 AM', '12:00 PM', 'Madina Community', 'Evangelism Team', 'Evangelism Ministry', false, NULL, 0, 'completed'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Baptism Service', 'Water baptism for new believers who have completed baptism class.', '2026-09-07', '9:00 AM', '11:00 AM', 'Main Auditorium', 'Rev. Kwesi Asante', 'Church Administration', false, NULL, 0, 'upcoming')
ON CONFLICT DO NOTHING;

-- Insert attendance sessions
INSERT INTO attendance_sessions (church_id, branch_id, session_type, title, session_date, total_attendance)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'sunday_service', 'Sunday Service - 1st September', '2026-09-06', 167),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'sunday_service', 'Sunday Service - 25th August', '2026-08-30', 175),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'sunday_service', 'Sunday Service - 18th August', '2026-08-23', 160),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'midweek_service', 'Midweek Service - 28th August', '2026-08-28', 89),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'bible_study', 'Bible Study - 27th August', '2026-08-27', 72),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'youth_service', 'Youth Service - 31st August', '2026-08-31', 45)
ON CONFLICT DO NOTHING;

-- Insert visitors
INSERT INTO visitors (church_id, branch_id, first_name, last_name, phone, email, date_of_visit, service_attended, how_heard, invited_by, notes, journey_status)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Nathaniel', 'Owusu', '+233 20 111 2222', 'nathaniel@email.com', '2026-09-06', 'Sunday Service', 'Friend', 'Kwabena Mensah', 'Very interested in the youth ministry', 'first_visit'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Deborah', 'Asante', '+233 20 222 3333', 'deborah@email.com', '2026-09-06', 'Sunday Service', 'Social Media', NULL, 'Saw our Facebook post about the service', 'first_visit'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Caleb', 'Boateng', '+233 20 333 4444', NULL, '2026-08-30', 'Sunday Service', 'Flyer', 'Rose Agyei', 'Second visit, very engaged', 'second_visit'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Priscilla', 'Mensah', '+233 20 444 5555', 'priscilla@email.com', '2026-08-23', 'Sunday Service', 'Friend', 'Abena Asante', 'Has completed new members class', 'new_member'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Joshua', 'Frimpong', '+233 20 555 6666', NULL, '2026-08-16', 'Sunday Service', 'Walk-in', NULL, 'Follow-up call made, interested in joining', 'follow_up'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Esther', 'Darko', '+233 20 666 7777', 'esther@email.com', '2026-08-09', 'Sunday Service', 'Family', 'Samuel Darko', 'Now an active member', 'active_member'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Isaac', 'Agyemang', '+233 20 777 8888', NULL, '2026-09-02', 'Midweek Service', 'Friend', 'Daniel Agyemang', 'Came for the first time to midweek', 'first_visit'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Sarah', 'Owusu', '+233 20 888 9999', 'sarah@email.com', '2026-08-30', 'Sunday Service', 'Social Media', NULL, 'No phone answer yet, needs follow-up', 'follow_up')
ON CONFLICT DO NOTHING;

-- Insert follow-ups
INSERT INTO followups (church_id, branch_id, person_type, person_name, assigned_to_name, reason, due_date, status, contact_method, notes)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'visitor', 'Nathaniel Owusu', 'Rev. Kwesi Asante', 'First-time visitor follow-up', '2026-09-09', 'pending', 'phone', 'Visitor attended Sunday service, interested in youth ministry'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'visitor', 'Deborah Asante', 'Grace Owusu', 'First-time visitor follow-up', '2026-09-09', 'pending', 'phone', 'Came through social media, needs welcome call'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'visitor', 'Caleb Boateng', 'Rev. Kwesi Asante', 'Second visit follow-up', '2026-09-08', 'in_progress', 'visit', 'Second visit, planning a home visit to discuss membership'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'visitor', 'Joshua Frimpong', 'Grace Owusu', 'Follow-up after initial contact', '2026-09-05', 'completed', 'phone', 'Called and spoke with him. He is interested in joining the new members class.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'visitor', 'Isaac Agyemang', 'Daniel Agyemang', 'First-time midweek visitor', '2026-09-10', 'pending', 'whatsapp', 'Came to midweek service for the first time'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'visitor', 'Sarah Owusu', 'Grace Owusu', 'No response from initial follow-up', '2026-09-07', 'unable_to_contact', 'phone', 'Phone not answered after 3 attempts, will try again next week')
ON CONFLICT DO NOTHING;

-- Link members to ministries
INSERT INTO ministry_members (ministry_id, member_id, role, joined_date)
SELECT mi.id, m.id, 'leader', '2024-01-15'
FROM ministries mi, members m WHERE mi.name = 'Youth Ministry' AND m.member_code = 'CC-0013'
ON CONFLICT DO NOTHING;

INSERT INTO ministry_members (ministry_id, member_id, role, joined_date)
SELECT mi.id, m.id, 'assistant_leader', '2024-03-01'
FROM ministries mi, members m WHERE mi.name = 'Youth Ministry' AND m.member_code = 'CC-0014'
ON CONFLICT DO NOTHING;

INSERT INTO ministry_members (ministry_id, member_id, role, joined_date)
SELECT mi.id, m.id, 'leader', '2023-06-10'
FROM ministries mi, members m WHERE mi.name = 'Mens Ministry' AND m.member_code = 'CC-0015'
ON CONFLICT DO NOTHING;

INSERT INTO ministry_members (ministry_id, member_id, role, joined_date)
SELECT mi.id, m.id, 'leader', '2023-08-20'
FROM ministries mi, members m WHERE mi.name = 'Womens Ministry' AND m.member_code = 'CC-0010'
ON CONFLICT DO NOTHING;

INSERT INTO ministry_members (ministry_id, member_id, role, joined_date)
SELECT mi.id, m.id, 'leader', '2024-01-01'
FROM ministries mi, members m WHERE mi.name = 'Choir & Praise Team' AND m.member_code = 'CC-0008'
ON CONFLICT DO NOTHING;

INSERT INTO ministry_members (ministry_id, member_id, role, joined_date)
SELECT mi.id, m.id, 'member', '2025-02-14'
FROM ministries mi, members m WHERE mi.name = 'Choir & Praise Team' AND m.member_code = 'CC-0004'
ON CONFLICT DO NOTHING;

INSERT INTO ministry_members (ministry_id, member_id, role, joined_date)
SELECT mi.id, m.id, 'leader', '2024-05-01'
FROM ministries mi, members m WHERE mi.name = 'Media Team' AND m.member_code = 'CC-0011'
ON CONFLICT DO NOTHING;

INSERT INTO ministry_members (ministry_id, member_id, role, joined_date)
SELECT mi.id, m.id, 'leader', '2024-03-15'
FROM ministries mi, members m WHERE mi.name = 'Ushering & Protocol' AND m.member_code = 'CC-0019'
ON CONFLICT DO NOTHING;

INSERT INTO ministry_members (ministry_id, member_id, role, joined_date)
SELECT mi.id, m.id, 'member', '2025-01-10'
FROM ministries mi, members m WHERE mi.name = 'Ushering & Protocol' AND m.member_code = 'CC-0020'
ON CONFLICT DO NOTHING;
