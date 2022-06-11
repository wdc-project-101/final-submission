-- index.js

-- create account
INSERT INTO users (username, password, email, first_name, last_name, location, phone) VALUES (?, ?, ?, ?, ?, ?, ?)

-- check if user exists (password verified with argon2)
SELECT * FROM users WHERE (username = ? OR email = ?) AND event_id IS NULL

-- create / update account (google)
INSERT INTO users (username, email, first_name, last_name, image) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username), email = VALUES(email), first_name = VALUES(first_name), last_name = VALUES(last_name)

-- get events
SELECT * FROM events WHERE event_id = ?

-- get times
SELECT time_id, DATE_FORMAT(time_start, '%Y-%m-%dT%H:%i') AS time_start, DATE_FORMAT(time_end, '%Y-%m-%dT%H:%i') AS time_end, time_count FROM times WHERE event_id = ?

-- create guest
INSERT INTO users (username, first_name, last_name, location, event_id) VALUES (?, ?, ?, ?, ?)

-- check if guest exists for event (no password)
SELECT * FROM users WHERE username = ? AND event_id = ?

-- users.js

-- check if user or guest exists in database (not deleted)
SELECT * FROM users WHERE username = ?

-- get user info / details
SELECT * FROM users WHERE username = ?

-- modify user
UPDATE users SET email = ?, first_name = ?, last_name = ?, location = ?, phone = ? WHERE username = ?

-- delete user
DELETE FROM users WHERE username = ?

-- create event
INSERT INTO events (event_id, event_name, event_description, event_location, event_host) VALUES (?, ?, ?, ?, ?)

-- create times (with event)
INSERT INTO times (time_start, time_end, event_id) VALUES ?

-- get availability
SELECT time_id, available FROM availabilities INNER JOIN (SELECT time_id AS event_time_id FROM times WHERE event_id = ?) AS event_times ON availabilities.time_id = event_time_id WHERE username = ?

-- specify availability
INSERT INTO availabilities (time_id, username, available) VALUES ? ON DUPLICATE KEY UPDATE time_id = VALUES(time_id), username = VALUES(username), available = VALUES(available)

-- update time attendee count
UPDATE times SET time_count = (SELECT COUNT(*) FROM availabilities WHERE availabilities.time_id = times.time_id AND available = 1) WHERE time_id IN (?)

-- get all events user is attending
SELECT * FROM events INNER JOIN
    (SELECT DISTINCT event_id, (COUNT(*) = COUNT(available)) AS confirmed FROM times INNER JOIN
      (SELECT time_id, available FROM availabilities WHERE username = ?)
    AS availabilities ON times.time_id = availabilities.time_id GROUP BY event_id)
AS times ON events.event_id = times.event_id LIMIT ?

-- get all events user is hosting
SELECT * FROM events WHERE event_host = ? LIMIT ?

-- hosts.js

-- check if user is event's host
SELECT * FROM events WHERE event_id = ? AND event_host = ?

-- modify specific event field
UPDATE events SET ${field} = ? WHERE event_id = ?

-- delete event
DELETE FROM events WHERE event_id = ?

-- get auto incremented time_id
SELECT LAST_INSERT_ID() AS time_id

-- modify time (and reset attendee count)
UPDATE times SET time_start = DATE_FORMAT(?, '%Y-%m-%d %H:%i'), time_end = DATE_FORMAT(?, '%Y-%m-%d %H:%i'), time_count = 0 WHERE time_id = ?

-- nullify availabilities (time modified)
UPDATE availabilities SET available = NULL WHERE time_id = ?

-- delete time
DELETE FROM times WHERE time_id = ?

-- get all event attendees
SELECT username, first_name, last_name FROM users INNER JOIN (SELECT DISTINCT username event_username FROM availabilities INNER JOIN (SELECT time_id AS event_time_id FROM times WHERE event_id = ?) AS times ON availabilities.time_id = event_time_id) AS availabilities ON users.username = event_username

-- admin.js

-- check if user is an admin
SELECT * FROM admins WHERE username = ?

-- add admin
INSERT INTO admins VALUES (?)