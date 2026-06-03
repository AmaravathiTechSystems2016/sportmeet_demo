--
-- PostgreSQL database dump
--

\restrict 3k89culn0Gb1tqW1IcmlElgjYjoWw8xvWurL7R0iCQc43ZedTcjM9CqPi5bEQea

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: venues_amenity; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (11, 'Shower Facilities', 'shower-facilities', '', '🚿', 'facilities', true, 11, '2025-09-06 13:51:56.157311+00', '2025-09-06 15:38:01.427986+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (6, 'Air Conditioning', 'air-conditioning', 'Climate control and air conditioning', '❄️', 'facilities', true, 6, '2025-09-06 13:51:56.124981+00', '2025-09-06 15:38:01.445249+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (7, 'Lighting', 'lighting', 'Proper lighting for evening activities', '💡', 'facilities', true, 7, '2025-09-06 13:51:56.13515+00', '2025-09-06 15:38:01.445249+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (12, 'Locker Rooms', 'locker-rooms', 'Secure storage for personal belongings', '🔒', 'facilities', true, 12, '2025-09-06 13:51:56.164561+00', '2025-09-06 15:38:01.455233+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (2, 'Changing Rooms', 'changing-rooms', 'Changing and shower facilities', '🚿', 'facilities', true, 2, '2025-09-06 13:51:56.101776+00', '2025-09-06 15:38:01.459416+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (10, 'Seating Area', 'seating-area', 'Comfortable seating for spectators', '🪑', 'facilities', true, 10, '2025-09-06 13:51:56.151139+00', '2025-09-06 15:38:01.461381+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (9, 'Water Fountains', 'water-fountains', 'Drinking water facilities', '🚰', 'facilities', true, 9, '2025-09-06 13:51:56.141957+00', '2025-09-06 15:38:01.461381+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (13, 'Storage', 'storage', 'Equipment storage space', '📦', 'facilities', true, 0, '2025-09-06 15:38:01.468886+00', '2025-09-06 15:38:01.468886+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (14, 'Sound System', 'sound-system', 'Audio system for announcements', '🔊', 'facilities', true, 0, '2025-09-06 15:38:01.473763+00', '2025-09-06 15:38:01.473763+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (15, 'Scoreboard', 'scoreboard', 'Electronic scoreboard display', '📊', 'facilities', true, 0, '2025-09-06 15:38:01.478805+00', '2025-09-06 15:38:01.478805+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (16, 'Equipment Rental', 'equipment-rental', 'Sports equipment available for rent', '🏓', 'facilities', true, 0, '2025-09-06 15:38:01.480815+00', '2025-09-06 15:38:01.480815+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (8, 'First Aid', 'first-aid', 'First aid facilities and medical support', '🏥', 'safety', true, 8, '2025-09-06 13:51:56.138334+00', '2025-09-06 15:38:01.482327+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (17, 'Security', 'security', 'Security personnel and surveillance', '🛡️', 'safety', true, 0, '2025-09-06 15:38:01.48635+00', '2025-09-06 15:38:01.48635+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (18, 'Emergency Exits', 'emergency-exits', 'Clear emergency exit routes', '🚪', 'safety', true, 0, '2025-09-06 15:38:01.489033+00', '2025-09-06 15:38:01.489033+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (19, 'Fire Safety', 'fire-safety', 'Fire extinguishers and safety equipment', '🔥', 'safety', true, 0, '2025-09-06 15:38:01.495557+00', '2025-09-06 15:38:01.495557+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (20, 'CCTV', 'cctv', 'Closed-circuit television monitoring', '📹', 'safety', true, 0, '2025-09-06 15:38:01.495557+00', '2025-09-06 15:38:01.495557+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (1, 'Parking', 'parking', 'Vehicle parking facilities', '🅿️', 'parking', true, 1, '2025-09-06 13:51:56.091919+00', '2025-09-06 15:38:01.501481+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (21, 'Bike Racks', 'bike-racks', 'Bicycle parking and storage', '🚲', 'parking', true, 0, '2025-09-06 15:38:01.503461+00', '2025-09-06 15:38:01.503461+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (22, 'Public Transport Access', 'public-transport-access', 'Easy access to public transport', '🚌', 'parking', true, 0, '2025-09-06 15:38:01.50479+00', '2025-09-06 15:38:01.50479+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (23, 'Valet Parking', 'valet-parking', 'Valet parking service', '🔑', 'parking', true, 0, '2025-09-06 15:38:01.510532+00', '2025-09-06 15:38:01.510532+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (3, 'Cafeteria', 'cafeteria', 'Food and beverage service', '🍽️', 'food', true, 3, '2025-09-06 13:51:56.105049+00', '2025-09-06 15:38:01.510532+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (24, 'Vending Machines', 'vending-machines', 'Snacks and drinks vending', '🥤', 'food', true, 0, '2025-09-06 15:38:01.510532+00', '2025-09-06 15:38:01.510532+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (25, 'Bar', 'bar', 'Alcoholic beverages service', '🍺', 'food', true, 0, '2025-09-06 15:38:01.518238+00', '2025-09-06 15:38:01.518238+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (26, 'Catering', 'catering', 'Catering services available', '🍕', 'food', true, 0, '2025-09-06 15:38:01.519926+00', '2025-09-06 15:38:01.519926+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (5, 'WiFi', 'wifi', 'Free wireless internet access', '📶', 'technology', true, 5, '2025-09-06 13:51:56.121543+00', '2025-09-06 15:38:01.522531+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (27, 'Charging Stations', 'charging-stations', 'Device charging facilities', '🔌', 'technology', true, 0, '2025-09-06 15:38:01.526287+00', '2025-09-06 15:38:01.526287+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (28, 'Live Streaming', 'live-streaming', 'Live streaming capabilities', '📺', 'technology', true, 0, '2025-09-06 15:38:01.53126+00', '2025-09-06 15:38:01.53126+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (29, 'Digital Scoreboard', 'digital-scoreboard', 'Digital scoreboard and displays', '📱', 'technology', true, 0, '2025-09-06 15:38:01.534211+00', '2025-09-06 15:38:01.534211+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (30, 'Wheelchair Access', 'wheelchair-access', 'Wheelchair accessible facilities', '♿', 'accessibility', true, 0, '2025-09-06 15:38:01.535565+00', '2025-09-06 15:38:01.535565+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (31, 'Elevator', 'elevator', 'Elevator access to all floors', '🛗', 'accessibility', true, 0, '2025-09-06 15:38:01.535565+00', '2025-09-06 15:38:01.535565+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (32, 'Accessible Parking', 'accessible-parking', 'Accessible parking spaces', '🅿️', 'accessibility', true, 0, '2025-09-06 15:38:01.544069+00', '2025-09-06 15:38:01.544069+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (33, 'Accessible Restrooms', 'accessible-restrooms', 'Accessible restroom facilities', '🚻', 'accessibility', true, 0, '2025-09-06 15:38:01.546606+00', '2025-09-06 15:38:01.546606+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (34, 'Reception', 'reception', 'Reception and information desk', '🏢', 'general', true, 0, '2025-09-06 15:38:01.553385+00', '2025-09-06 15:38:01.553385+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (35, 'Lost & Found', 'lost-found', 'Lost and found service', '🔍', 'general', true, 0, '2025-09-06 15:38:01.556407+00', '2025-09-06 15:38:01.556407+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (36, 'ATM', 'atm', 'ATM machine on premises', '💰', 'general', true, 0, '2025-09-06 15:38:01.562512+00', '2025-09-06 15:38:01.562512+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (37, 'Gift Shop', 'gift-shop', 'Sports merchandise and gifts', '🛍️', 'general', true, 0, '2025-09-06 15:38:01.565521+00', '2025-09-06 15:38:01.565521+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (38, 'Tournament Organization', 'tournament-organization', 'Tournament and event organization', '🏆', 'general', true, 0, '2025-09-06 15:38:01.565521+00', '2025-09-06 15:38:01.565521+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (39, 'Coaching Services', 'coaching-services', 'Professional coaching available', '👨‍🏫', 'general', true, 0, '2025-09-06 15:38:01.576411+00', '2025-09-06 15:38:01.576411+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (40, 'Membership Services', 'membership-services', 'Membership and loyalty programs', '💳', 'general', true, 0, '2025-09-06 15:38:01.581356+00', '2025-09-06 15:38:01.581356+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (43, 'Showers', 'showers', '', '', 'general', true, 0, '2025-09-08 10:05:40.602092+00', '2025-09-08 10:05:40.602092+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (44, 'Cafe', 'cafe', '', '', 'general', true, 0, '2025-09-08 10:05:40.631427+00', '2025-09-08 10:05:40.631427+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (45, 'Water fountain', 'water-fountain', '', '', 'general', true, 0, '2025-09-08 10:05:40.634478+00', '2025-09-08 10:05:40.634478+00');
INSERT INTO public.venues_amenity (id, name, slug, description, icon, category, is_active, sort_order, created_at, updated_at) VALUES (41, 'Change rooms', 'change-rooms', '', '', 'general', true, 0, '2025-09-08 10:00:55.764069+00', '2025-09-08 10:00:55.764069+00');


--
-- Data for Name: venues_sport; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (8, 'Gym', 'gym', 'Gymnasium', '💪', '', '#84CC16', true, 8, NULL, NULL, NULL, NULL, '2025-09-06 13:50:06.70712+00', '2025-09-06 13:50:06.70712+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (1, 'Football', 'football', 'Association football/soccer', '⚽', '', '#10B981', true, 1, 90.00, 120.00, 45.00, 90.00, '2025-09-06 13:50:06.661985+00', '2025-09-06 15:30:40.465682+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (2, 'Basketball', 'basketball', 'Basketball court', '🏀', '', '#F59E0B', true, 2, 28.00, 28.00, 15.00, 15.00, '2025-09-06 13:50:06.673771+00', '2025-09-06 15:30:40.483959+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (3, 'Tennis', 'tennis', 'Tennis court', '🎾', '', '#3B82F6', true, 3, 23.77, 23.77, 8.23, 10.97, '2025-09-06 13:50:06.678926+00', '2025-09-06 15:30:40.488002+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (4, 'Cricket', 'cricket', 'Cricket ground', '🏏', '', '#8B5CF6', true, 4, 137.00, 150.00, 137.00, 150.00, '2025-09-06 13:50:06.682968+00', '2025-09-06 15:30:40.497434+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (5, 'Badminton', 'badminton', 'Badminton court', '🏸', '', '#EF4444', true, 5, 13.40, 13.40, 6.10, 6.10, '2025-09-06 13:50:06.692658+00', '2025-09-06 15:30:40.501398+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (6, 'Volleyball', 'volleyball', 'Volleyball court', '🏐', '', '#06B6D4', true, 6, 18.00, 18.00, 9.00, 9.00, '2025-09-06 13:50:06.697431+00', '2025-09-06 15:30:40.505337+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (7, 'Swimming', 'swimming', 'Swimming pool', '🏊', '', '#0EA5E9', true, 7, 25.00, 50.00, 12.50, 25.00, '2025-09-06 13:50:06.700983+00', '2025-09-06 15:30:40.529387+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (15, 'Table Tennis', 'table-tennis', 'Table tennis/ping pong', '🏓', '', '#EF4444', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:31:22.305822+00', '2025-09-06 15:31:32.061892+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (35, 'Hockey', 'hockey', 'Field hockey', '🏑', '', '#8B5CF6', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.904609+00', '2025-09-06 15:32:11.904609+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (36, 'Rugby', 'rugby', 'Rugby union', '🏉', '', '#F59E0B', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.916316+00', '2025-09-06 15:32:11.916316+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (37, 'Golf', 'golf', 'Golf course', '⛳', '', '#10B981', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.920828+00', '2025-09-06 15:32:11.920828+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (38, 'Cycling', 'cycling', 'Cycling and bike riding', '🚴', '', '#06B6D4', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.928004+00', '2025-09-06 15:32:11.928004+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (39, 'Running', 'running', 'Running and jogging', '🏃', '', '#F97316', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.934189+00', '2025-09-06 15:32:11.934189+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (40, 'Boxing', 'boxing', 'Boxing training', '🥊', '', '#DC2626', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.937207+00', '2025-09-06 15:32:11.937207+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (41, 'Martial Arts', 'martial-arts', 'Karate, Taekwondo, etc.', '🥋', '', '#7C3AED', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.940477+00', '2025-09-06 15:32:11.940477+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (42, 'Gymnastics', 'gymnastics', 'Gymnastics and acrobatics', '🤸', '', '#EC4899', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.948148+00', '2025-09-06 15:32:11.948148+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (43, 'Weightlifting', 'weightlifting', 'Weight training and lifting', '🏋️', '', '#6B7280', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.95293+00', '2025-09-06 15:32:11.95293+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (44, 'Archery', 'archery', 'Archery and bow shooting', '🏹', '', '#059669', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.955169+00', '2025-09-06 15:32:11.955169+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (45, 'Skiing', 'skiing', 'Skiing and snow sports', '🎿', '', '#0EA5E9', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.960918+00', '2025-09-06 15:32:11.960918+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (46, 'Surfing', 'surfing', 'Surfing and water sports', '🏄', '', '#0891B2', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.965697+00', '2025-09-06 15:32:11.965697+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (47, 'Sailing', 'sailing', 'Sailing and boating', '⛵', '', '#0D9488', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.969248+00', '2025-09-06 15:32:11.969248+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (48, 'Rock Climbing', 'rock-climbing', 'Rock climbing and bouldering', '🧗', '', '#B45309', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.970835+00', '2025-09-06 15:32:11.970835+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (49, 'Yoga', 'yoga', 'Yoga and meditation', '🧘', '', '#7C2D12', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.977422+00', '2025-09-06 15:32:11.977422+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (50, 'Pilates', 'pilates', 'Pilates and core training', '🤸‍♀️', '', '#BE185D', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.981658+00', '2025-09-06 15:32:11.981658+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (51, 'Dance', 'dance', 'Dance classes and training', '💃', '', '#A855F7', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.984753+00', '2025-09-06 15:32:11.984753+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (52, 'Squash', 'squash', 'Squash court', '🏸', '', '#F59E0B', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.987123+00', '2025-09-06 15:32:11.987123+00');
INSERT INTO public.venues_sport (id, name, slug, description, icon, image, color, is_active, sort_order, min_court_length, max_court_length, min_court_width, max_court_width, created_at, updated_at) VALUES (53, 'Netball', 'netball', 'Netball - popular in Australia', '🏀', '', '#EC4899', true, 0, NULL, NULL, NULL, NULL, '2025-09-06 15:32:11.989134+00', '2025-09-06 15:32:11.989134+00');


--
-- Data for Name: venues_courttype; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (1, 'Grass Field', '', 105.00, 68.00, 'Grass', false, true, 0, '2025-09-06 13:51:55.965124+00', '2025-09-06 13:51:55.965124+00', 1);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (2, 'Artificial Turf', '', 105.00, 68.00, 'Artificial Turf', false, true, 0, '2025-09-06 13:51:55.975136+00', '2025-09-06 13:51:55.975136+00', 1);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (3, 'Indoor Court', '', 40.00, 20.00, 'Hard Court', true, true, 0, '2025-09-06 13:51:55.98398+00', '2025-09-06 13:51:55.98398+00', 1);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (4, 'Indoor Court', '', 28.00, 15.00, 'Hard Court', true, true, 0, '2025-09-06 13:51:55.990014+00', '2025-09-06 13:51:55.990014+00', 2);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (5, 'Outdoor Court', '', 28.00, 15.00, 'Concrete', false, true, 0, '2025-09-06 13:51:56.000477+00', '2025-09-06 13:51:56.000477+00', 2);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (6, 'Hard Court', '', 23.77, 10.97, 'Hard Court', false, true, 0, '2025-09-06 13:51:56.006648+00', '2025-09-06 13:51:56.006648+00', 3);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (7, 'Clay Court', '', 23.77, 10.97, 'Clay', false, true, 0, '2025-09-06 13:51:56.017453+00', '2025-09-06 13:51:56.017453+00', 3);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (8, 'Indoor Court', '', 23.77, 10.97, 'Hard Court', true, true, 0, '2025-09-06 13:51:56.021961+00', '2025-09-06 13:51:56.021961+00', 3);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (9, 'Indoor Court', '', 13.40, 6.10, 'Wood', true, true, 0, '2025-09-06 13:51:56.033946+00', '2025-09-06 13:51:56.033946+00', 5);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (10, 'Indoor Court', '', 18.00, 9.00, 'Wood', true, true, 0, '2025-09-06 13:51:56.040432+00', '2025-09-06 13:51:56.040432+00', 6);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (11, 'Beach Court', '', 18.00, 9.00, 'Sand', false, true, 0, '2025-09-06 13:51:56.051186+00', '2025-09-06 13:51:56.051186+00', 6);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (12, '25m Pool', '', 25.00, 12.50, 'Water', true, true, 0, '2025-09-06 13:51:56.057074+00', '2025-09-06 13:51:56.057074+00', 7);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (13, '50m Pool', '', 50.00, 25.00, 'Water', true, true, 0, '2025-09-06 13:51:56.069198+00', '2025-09-06 13:51:56.069198+00', 7);
INSERT INTO public.venues_courttype (id, name, description, length, width, surface_type, is_indoor, is_active, sort_order, created_at, updated_at, sport_id) VALUES (14, 'Outdoor Pool', '', 25.00, 12.50, 'Water', false, true, 0, '2025-09-06 13:51:56.075075+00', '2025-09-06 13:51:56.075075+00', 7);


--
-- Name: venues_amenity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.venues_amenity_id_seq', 48, true);


--
-- Name: venues_courttype_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.venues_courttype_id_seq', 14, true);


--
-- Name: venues_sport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.venues_sport_id_seq', 57, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 3k89culn0Gb1tqW1IcmlElgjYjoWw8xvWurL7R0iCQc43ZedTcjM9CqPi5bEQea

