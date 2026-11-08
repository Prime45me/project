/*
# ChurchConnect - Demo Data

Seeds the database with realistic demo data for a Ghanaian church.

## Data Created
1. **Grace Community Church** - Demo church organization
2. **Three branches** - Accra Central, Kumasi, and Tamale
3. **50+ members** spread across branches with varied statuses
4. **Families** - Several household groupings
5. **Admin user profile** - Pre-linked to the demo admin auth user

## Notes
- The admin auth user is created via Supabase Auth (email: admin@churchconnect.demo / password: admin12345)
- After the auth user is created, their profile is updated to super_admin role
- Member codes are auto-generated in format CC-XXXX
- All demo data is clearly identifiable as sample data
*/

-- Insert demo church
INSERT INTO churches (id, name, slug, description, address, phone, email, website, primary_color, founded_date, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Grace Community Church',
  'grace-community-church',
  'A vibrant Christ-centered church serving communities across Ghana with the love of Jesus.',
  'No. 45 Independence Avenue, Accra, Ghana',
  '+233 30 123 4567',
  'info@gracecommunity.org.gh',
  'https://gracecommunity.org.gh',
  '174 55% 41%',
  '2005-09-15',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Insert branches
INSERT INTO branches (id, church_id, name, slug, address, phone, email, is_active)
VALUES
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Accra Central', 'accra-central', 'No. 45 Independence Avenue, Accra', '+233 30 123 4567', 'accra@gracecommunity.org.gh', true),
  ('b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kumasi Branch', 'kumasi-branch', 'Adum High Street, Kumasi', '+233 32 234 5678', 'kumasi@gracecommunity.org.gh', true),
  ('b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tamale Branch', 'tamale-branch', 'Education Ridge, Tamale', '+233 37 345 6789', 'tamale@gracecommunity.org.gh', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert demo members (50+ across branches)
-- Accra Central members
INSERT INTO members (church_id, branch_id, member_code, first_name, middle_name, last_name, gender, date_of_birth, phone, email, address, occupation, marital_status, date_joined, membership_status, baptism_status, baptism_date, salvation_date, hall_zone, is_archived)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0001', 'Kwabena', 'Owusu', 'Mensah', 'male', '1985-03-15', '+233 24 111 2222', 'kwabena.mensah@email.com', 'East Legon, Accra', 'Software Engineer', 'married', '2010-01-10', 'active', 'baptized', '2008-05-20', '2007-08-15', 'Zone A', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0002', 'Abena', 'Adwoa', 'Asante', 'female', '1990-07-22', '+233 24 222 3333', 'abena.asante@email.com', 'East Legon, Accra', 'Teacher', 'married', '2011-03-05', 'active', 'baptized', '2009-12-15', '2009-06-01', 'Zone A', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0003', 'Kofi', 'Yaw', 'Boateng', 'male', '1978-11-30', '+233 24 333 4444', 'kofi.boateng@email.com', 'Madina, Accra', 'Accountant', 'married', '2008-09-12', 'active', 'baptized', '2007-03-10', '2006-11-20', 'Zone B', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0004', 'Ama', 'Serwaa', 'Owusu', 'female', '1992-02-14', '+233 24 444 5555', 'ama.owusu@email.com', 'Madina, Accra', 'Nurse', 'single', '2015-06-20', 'active', 'baptized', '2014-08-25', '2013-12-10', 'Zone B', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0005', 'Yaw', 'Kwame', 'Asare', 'male', '1983-09-05', '+233 24 555 6666', 'yaw.asare@email.com', 'Tesano, Accra', 'Architect', 'married', '2012-01-15', 'active', 'baptized', '2011-04-20', '2010-09-15', 'Zone C', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0006', 'Akosua', 'Mensima', 'Frimpong', 'female', '1995-12-08', '+233 24 666 7777', 'akosua.frimpong@email.com', 'Tesano, Accra', 'Student', 'single', '2020-02-02', 'active', 'baptized', '2019-06-30', '2018-11-25', 'Zone C', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0007', 'Daniel', 'Kofi', 'Agyemang', 'male', '1988-04-18', '+233 24 777 8888', 'daniel.agyemang@email.com', 'Spintex, Accra', 'Pharmacist', 'married', '2013-08-10', 'active', 'baptized', '2012-11-05', '2012-03-20', 'Zone D', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0008', 'Grace', 'Adwoa', 'Annan', 'female', '1993-06-25', '+233 24 888 9999', 'grace.annan@email.com', 'Spintex, Accra', 'Marketing Manager', 'single', '2016-04-12', 'active', 'baptized', '2015-09-15', '2015-01-10', 'Zone D', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0009', 'Samuel', 'Osei', 'Darko', 'male', '1980-10-12', '+233 24 999 0000', 'samuel.darko@email.com', 'Dansoman, Accra', 'Civil Engineer', 'married', '2009-05-18', 'active', 'baptized', '2008-07-22', '2007-12-15', 'Zone E', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0010', 'Rose', 'Mensima', 'Agyei', 'female', '1987-08-03', '+233 20 111 2222', 'rose.agyei@email.com', 'Dansoman, Accra', 'Banker', 'married', '2011-11-22', 'active', 'baptized', '2010-10-05', '2010-04-12', 'Zone E', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0011', 'Emmanuel', 'Kwesi', 'Appiah', 'male', '1991-01-20', '+233 20 222 3333', 'emmanuel.appiah@email.com', 'Kasoa, Accra', 'Graphic Designer', 'single', '2018-07-08', 'active', 'baptized', '2017-12-20', '2017-06-15', 'Zone F', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0012', 'Joyce', 'Ama', 'Boateng', 'female', '1989-05-17', '+233 20 333 4444', 'joyce.boateng@email.com', 'Kasoa, Accra', 'Entrepreneur', 'married', '2014-02-14', 'active', 'baptized', '2013-08-10', '2013-01-20', 'Zone F', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0013', 'Michael', 'Asante', 'Owusu', 'male', '1996-03-28', '+233 20 444 5555', 'michael.owusu@email.com', 'Adenta, Accra', 'Student', 'single', '2022-09-01', 'new_member', 'scheduled', NULL, '2022-08-15', 'Zone A', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0014', 'Beatrice', 'Serwaa', 'Mensah', 'female', '1998-11-11', '+233 20 555 6666', 'beatrice.mensah@email.com', 'Adenta, Accra', 'Nursing Student', 'single', '2023-01-15', 'new_member', 'not_baptized', NULL, '2022-12-20', 'Zone A', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0015', 'Joshua', 'Kwabena', 'Adjei', 'male', '1975-07-07', '+233 20 666 7777', 'joshua.adjei@email.com', 'Nungua, Accra', 'Business Owner', 'married', '2006-03-10', 'active', 'baptized', '2005-08-15', '2004-12-01', 'Zone B', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0016', 'Patricia', 'Akosua', 'Sarpong', 'female', '1982-09-19', '+233 20 777 8888', 'patricia.sarpong@email.com', 'Nungua, Accra', 'Teacher', 'married', '2009-08-22', 'active', 'baptized', '2008-11-30', '2008-05-15', 'Zone B', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0017', 'Isaac', 'Yaw', 'Acheampong', 'male', '1994-02-28', '+233 20 888 9999', 'isaac.acheampong@email.com', 'Tema, Accra', 'IT Technician', 'single', '2019-05-05', 'active', 'baptized', '2018-10-20', '2018-03-10', 'Zone C', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0018', 'Diana', 'Abena', 'Karikari', 'female', '1997-04-14', '+233 20 999 0000', 'diana.karikari@email.com', 'Tema, Accra', 'Sales Representative', 'single', '2021-10-10', 'active', 'baptized', '2021-03-15', '2020-09-01', 'Zone C', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0019', 'Andrews', 'Osei', 'Fosu', 'male', '1986-12-01', '+233 27 111 2222', 'andrews.fosu@email.com', 'Achimota, Accra', 'Electrician', 'married', '2012-06-18', 'active', 'baptized', '2011-09-25', '2011-02-14', 'Zone D', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0020', 'Felicia', 'Adwoa', 'Mensah', 'female', '1990-08-22', '+233 27 222 3333', 'felicia.mensah@email.com', 'Achimota, Accra', 'Tailor', 'married', '2013-10-30', 'active', 'baptized', '2013-03-12', '2012-08-20', 'Zone D', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0021', 'Philip', 'Kwame', 'Nimako', 'male', '1999-05-30', '+233 27 333 4444', 'philip.nimako@email.com', 'Osu, Accra', 'University Student', 'single', '2023-08-01', 'visitor', 'not_baptized', NULL, NULL, 'Zone E', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0022', 'Linda', 'Ama', 'Boadu', 'female', '2001-01-08', '+233 27 444 5555', 'linda.boadu@email.com', 'Osu, Accra', 'Student', 'single', '2023-09-03', 'visitor', 'not_baptized', NULL, NULL, 'Zone E', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0023', 'Robert', 'Kofi', 'Asante', 'male', '1972-06-15', '+233 27 555 6666', 'robert.asante@email.com', 'Dansoman, Accra', 'Retired Civil Servant', 'married', '2005-01-20', 'inactive', 'baptized', '2004-05-10', '2003-11-15', 'Zone E', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'CC-0024', 'Esther', 'Serwaa', 'Boateng', 'female', '1970-03-22', '+233 27 666 7777', 'esther.boateng@email.com', 'Dansoman, Accra', 'Retired Teacher', 'married', '2005-01-20', 'inactive', 'baptized', '2004-05-10', '2003-11-15', 'Zone E', false)
ON CONFLICT (member_code) DO NOTHING;

-- Kumasi members
INSERT INTO members (church_id, branch_id, member_code, first_name, middle_name, last_name, gender, date_of_birth, phone, email, address, occupation, marital_status, date_joined, membership_status, baptism_status, baptism_date, salvation_date, hall_zone, is_archived)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0025', 'Francis', 'Owusu', 'Agyeman', 'male', '1984-04-10', '+233 24 111 3333', 'francis.agyeman@email.com', 'Bantama, Kumasi', 'Doctor', 'married', '2011-02-15', 'active', 'baptized', '2010-06-20', '2009-12-10', 'Zone 1', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0026', 'Mary', 'Akosua', 'Konadu', 'female', '1989-08-25', '+233 24 222 4444', 'mary.konadu@email.com', 'Bantama, Kumasi', 'Midwife', 'married', '2012-07-08', 'active', 'baptized', '2011-10-15', '2011-04-01', 'Zone 1', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0027', 'Peter', 'Kwabena', 'Amoako', 'male', '1993-11-12', '+233 24 333 5555', 'peter.amoako@email.com', 'Asokwa, Kumasi', 'Mechanical Engineer', 'single', '2016-09-20', 'active', 'baptized', '2016-02-14', '2015-08-10', 'Zone 2', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0028', 'Ruth', 'Adwoa', 'Prempeh', 'female', '1995-02-18', '+233 24 444 6666', 'ruth.prempeh@email.com', 'Asokwa, Kumasi', 'Banker', 'single', '2018-03-12', 'active', 'baptized', '2017-08-20', '2017-01-15', 'Zone 2', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0029', 'Thomas', 'Yaw', 'Bempah', 'male', '1987-07-30', '+233 24 555 7777', 'thomas.bempah@email.com', 'Manhyia, Kumasi', 'Taxi Driver', 'married', '2010-11-05', 'active', 'baptized', '2010-03-22', '2009-09-10', 'Zone 3', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0030', 'Hannah', 'Mensima', 'Agyei', 'female', '1991-10-05', '+233 24 666 8888', 'hannah.agyei@email.com', 'Manhyia, Kumasi', 'Trader', 'married', '2013-04-18', 'active', 'baptized', '2012-09-30', '2012-03-15', 'Zone 3', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0031', 'George', 'Kofi', 'Frimpong', 'male', '1998-06-20', '+233 24 777 9999', 'george.frimpong@email.com', 'KNUST Campus, Kumasi', 'University Student', 'single', '2021-10-15', 'new_member', 'baptized', '2021-04-10', '2020-11-20', 'Zone 4', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0032', 'Comfort', 'Ama', 'Boateng', 'female', '2000-12-03', '+233 24 888 0000', 'comfort.boateng@email.com', 'KNUST Campus, Kumasi', 'University Student', 'single', '2022-09-10', 'new_member', 'not_baptized', NULL, '2022-08-01', 'Zone 4', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0033', 'William', 'Osei', 'Sarfo', 'male', '1979-01-15', '+233 24 999 1111', 'william.sarfo@email.com', 'Suame, Kumasi', 'Carpenter', 'married', '2008-05-20', 'active', 'baptized', '2007-10-15', '2007-04-10', 'Zone 5', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0034', 'Victoria', 'Serwaa', 'Asante', 'female', '1985-09-08', '+233 20 111 4444', 'victoria.asante@email.com', 'Suame, Kumasi', 'Seamstress', 'married', '2010-08-12', 'active', 'baptized', '2009-12-20', '2009-06-10', 'Zone 5', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0035', 'Eric', 'Kwame', 'Antwi', 'male', '1992-03-17', '+233 20 222 5555', 'eric.antwi@email.com', 'Santasi, Kumasi', 'Pharmacist', 'single', '2017-01-22', 'active', 'baptized', '2016-06-15', '2015-12-01', 'Zone 1', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0036', 'Gloria', 'Abena', 'Mensah', 'female', '1994-08-14', '+233 20 333 6666', 'gloria.mensah@email.com', 'Santasi, Kumasi', 'Teacher', 'single', '2019-05-18', 'active', 'baptized', '2018-11-10', '2018-05-05', 'Zone 1', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0037', 'Joseph', 'Yaw', 'Adjei', 'male', '2002-04-22', '+233 20 444 7777', 'joseph.adjei@email.com', 'Asokwa, Kumasi', 'SHS Student', 'single', '2023-09-02', 'visitor', 'not_baptized', NULL, NULL, 'Zone 2', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0038', 'Priscilla', 'Akosua', 'Owusu', 'female', '2003-07-19', '+233 20 555 8888', 'priscilla.owusu@email.com', 'Asokwa, Kumasi', 'SHS Student', 'single', '2023-09-09', 'visitor', 'not_baptized', NULL, NULL, 'Zone 2', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0039', 'Stephen', 'Kofi', 'Mensah', 'male', '1981-05-12', '+233 20 666 9999', 'stephen.mensah@email.com', 'Barekese, Kumasi', 'Farmer', 'married', '2007-03-25', 'active', 'baptized', '2006-08-20', '2006-02-10', 'Zone 3', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'CC-0040', 'Rebecca', 'Adwoa', 'Agyeman', 'female', '1983-12-28', '+233 20 777 0000', 'rebecca.agyeman@email.com', 'Barekese, Kumasi', 'Farmer', 'married', '2007-03-25', 'active', 'baptized', '2006-08-20', '2006-02-10', 'Zone 3', false)
ON CONFLICT (member_code) DO NOTHING;

-- Tamale members
INSERT INTO members (church_id, branch_id, member_code, first_name, middle_name, last_name, gender, date_of_birth, phone, email, address, occupation, marital_status, date_joined, membership_status, baptism_status, baptism_date, salvation_date, hall_zone, is_archived)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0041', 'Abdul', 'Kwame', 'Salifu', 'male', '1986-02-10', '+233 24 111 5555', 'abdul.salifu@email.com', 'Education Ridge, Tamale', 'Teacher', 'married', '2012-04-15', 'active', 'baptized', '2011-09-20', '2011-03-10', 'Zone North', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0042', 'Fatima', 'Ama', 'Iddrisu', 'female', '1990-06-18', '+233 24 222 6666', 'fatima.iddrisu@email.com', 'Education Ridge, Tamale', 'Nurse', 'married', '2013-08-22', 'active', 'baptized', '2013-01-15', '2012-07-10', 'Zone North', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0043', 'Moses', 'Osei', 'Dagomba', 'male', '1995-10-25', '+233 24 333 7777', 'moses.dagomba@email.com', 'Lamashegu, Tamale', 'University Student', 'single', '2019-11-05', 'active', 'baptized', '2019-05-20', '2018-12-15', 'Zone South', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0044', 'Sarah', 'Serwaa', 'Mahama', 'female', '1997-03-30', '+233 24 444 8888', 'sarah.mahama@email.com', 'Lamashegu, Tamale', 'Trader', 'single', '2020-07-10', 'active', 'baptized', '2020-01-25', '2019-08-10', 'Zone South', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0045', 'David', 'Kwabena', 'Alhassan', 'male', '1988-08-12', '+233 24 555 9999', 'david.alhassan@email.com', 'Aboabo, Tamale', 'Taxi Driver', 'married', '2011-05-18', 'active', 'baptized', '2010-10-22', '2010-04-15', 'Zone East', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0046', 'Elizabeth', 'Akosua', 'Yakubu', 'female', '1993-01-22', '+233 24 666 0000', 'elizabeth.yakubu@email.com', 'Aboabo, Tamale', 'Seamstress', 'married', '2014-09-08', 'active', 'baptized', '2014-03-15', '2013-10-01', 'Zone East', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0047', 'Solomon', 'Yaw', 'Saaka', 'male', '1999-04-05', '+233 24 777 1111', 'solomon.saaka@email.com', 'Kalpohin, Tamale', 'University Student', 'single', '2022-10-15', 'new_member', 'scheduled', NULL, '2022-09-20', 'Zone North', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0048', 'Naomi', 'Adwoa', 'Seidu', 'female', '2001-09-14', '+233 24 888 2222', 'naomi.seidu@email.com', 'Kalpohin, Tamale', 'Nursing Student', 'single', '2023-02-05', 'new_member', 'not_baptized', NULL, '2023-01-15', 'Zone North', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0049', 'Benjamin', 'Kofi', 'Mohammed', 'male', '1978-12-20', '+233 24 999 3333', 'benjamin.mohammed@email.com', 'Vittin, Tamale', 'Ghana Education Service', 'married', '2006-06-10', 'active', 'baptized', '2005-11-15', '2005-05-20', 'Zone South', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0050', 'Hagar', 'Mensima', 'Abdulai', 'female', '1980-05-08', '+233 20 111 7777', 'hagar.abdulai@email.com', 'Vittin, Tamale', 'Trader', 'married', '2006-06-10', 'active', 'baptized', '2005-11-15', '2005-05-20', 'Zone South', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0051', 'Nathaniel', 'Osei', 'Baako', 'male', '2004-02-14', '+233 20 222 8888', 'nathaniel.baako@email.com', 'Boggu, Tamale', 'SHS Student', 'single', '2023-09-10', 'visitor', 'not_baptized', NULL, NULL, 'Zone East', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'CC-0052', 'Deborah', 'Ama', 'Fatawu', 'female', '2005-06-22', '+233 20 333 9999', 'deborah.fatawu@email.com', 'Boggu, Tamale', 'SHS Student', 'single', '2023-09-17', 'visitor', 'not_baptized', NULL, NULL, 'Zone East', false)
ON CONFLICT (member_code) DO NOTHING;

-- Insert demo families
INSERT INTO families (church_id, branch_id, family_name, head_member_id, address, phone)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Mensah Family', m1.id, 'East Legon, Accra', '+233 24 111 2222'
FROM members m1 WHERE m1.member_code = 'CC-0001'
ON CONFLICT DO NOTHING;

INSERT INTO families (church_id, branch_id, family_name, head_member_id, address, phone)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Boateng Family', m1.id, 'Madina, Accra', '+233 24 333 4444'
FROM members m1 WHERE m1.member_code = 'CC-0003'
ON CONFLICT DO NOTHING;

INSERT INTO families (church_id, branch_id, family_name, head_member_id, address, phone)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2b2c3d4-e5f6-7890-abcd-ef1234567892', 'Agyeman Family', m1.id, 'Bantama, Kumasi', '+233 24 111 3333'
FROM members m1 WHERE m1.member_code = 'CC-0025'
ON CONFLICT DO NOTHING;

INSERT INTO families (church_id, branch_id, family_name, head_member_id, address, phone)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b3b2c3d4-e5f6-7890-abcd-ef1234567893', 'Salifu Family', m1.id, 'Education Ridge, Tamale', '+233 24 111 5555'
FROM members m1 WHERE m1.member_code = 'CC-0041'
ON CONFLICT DO NOTHING;

-- Link family members (Mensah family: Kwabena + Abena)
INSERT INTO family_members (family_id, member_id, relationship, is_head)
SELECT f.id, m.id, 'Head', true FROM families f, members m
WHERE f.family_name = 'Mensah Family' AND m.member_code = 'CC-0001'
ON CONFLICT DO NOTHING;

INSERT INTO family_members (family_id, member_id, relationship, is_head)
SELECT f.id, m.id, 'Wife', false FROM families f, members m
WHERE f.family_name = 'Mensah Family' AND m.member_code = 'CC-0002'
ON CONFLICT DO NOTHING;

-- Boateng family: Kofi + Rose
INSERT INTO family_members (family_id, member_id, relationship, is_head)
SELECT f.id, m.id, 'Head', true FROM families f, members m
WHERE f.family_name = 'Boateng Family' AND m.member_code = 'CC-0003'
ON CONFLICT DO NOTHING;

INSERT INTO family_members (family_id, member_id, relationship, is_head)
SELECT f.id, m.id, 'Wife', false FROM families f, members m
WHERE f.family_name = 'Boateng Family' AND m.member_code = 'CC-0010'
ON CONFLICT DO NOTHING;

-- Agyeman family: Francis + Mary
INSERT INTO family_members (family_id, member_id, relationship, is_head)
SELECT f.id, m.id, 'Head', true FROM families f, members m
WHERE f.family_name = 'Agyeman Family' AND m.member_code = 'CC-0025'
ON CONFLICT DO NOTHING;

INSERT INTO family_members (family_id, member_id, relationship, is_head)
SELECT f.id, m.id, 'Wife', false FROM families f, members m
WHERE f.family_name = 'Agyeman Family' AND m.member_code = 'CC-0026'
ON CONFLICT DO NOTHING;

-- Salifu family: Abdul + Fatima
INSERT INTO family_members (family_id, member_id, relationship, is_head)
SELECT f.id, m.id, 'Head', true FROM families f, members m
WHERE f.family_name = 'Salifu Family' AND m.member_code = 'CC-0041'
ON CONFLICT DO NOTHING;

INSERT INTO family_members (family_id, member_id, relationship, is_head)
SELECT f.id, m.id, 'Wife', false FROM families f, members m
WHERE f.family_name = 'Salifu Family' AND m.member_code = 'CC-0042'
ON CONFLICT DO NOTHING;