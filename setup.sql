DROP DATABASE IF EXISTS project; -- resets database
CREATE DATABASE project;
USE project;

CREATE TABLE users
(
    username VARCHAR(63),
    password VARCHAR(127),
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone CHAR(10),
    location VARCHAR(255),
    image VARCHAR(255),
    event_id INT,
    PRIMARY KEY (username)
);

CREATE TABLE events
(
    event_id INT,
    event_name VARCHAR(127),
    event_description VARCHAR(511),
    event_location VARCHAR(255),
    event_start DATETIME,
    event_end DATETIME,
    event_host VARCHAR(63) NOT NULL,
    PRIMARY KEY (event_id),
    FOREIGN KEY (event_host) REFERENCES users(username) ON DELETE CASCADE -- delete event when host is deleted
);

-- moved from declaration since events is declared after
ALTER TABLE users ADD FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE; -- delete guests when event is deleted

CREATE TABLE times
(
    time_id INT AUTO_INCREMENT,
    time_start DATETIME,
    time_end DATETIME,
    time_count INT DEFAULT 0,
    event_id INT NOT NULL,
    PRIMARY KEY (time_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

CREATE TABLE availabilities
(
    time_id INT NOT NULL,
    username VARCHAR(63) NOT NULL,
    available BOOLEAN,
    FOREIGN KEY (time_id) REFERENCES times(time_id) ON DELETE CASCADE,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE KEY (time_id, username)
);

CREATE TABLE admins
(
    username VARCHAR(63) UNIQUE NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- example values

INSERT INTO users (username, password, email, first_name, last_name, phone, location) -- password is hashed version of "admin"
    VALUES ("admin", "$argon2i$v=19$m=4096,t=3,p=1$ZvdOezz/qmiOGkk0KSveLA$mukFeBNLtUp470yGEi7njCYvzTZgzNN1AjyeiAmGfP0", "admin@when2chill.com", "Addison", "Minh", "0123456789", "Adelaide");

INSERT INTO admins VALUES ("admin");

INSERT INTO events (event_id, event_name, event_description, event_location, event_host)
    VALUES (0, "When2Chill Launch Party", "Lorem Ipsum", "Adelaide", "admin");

INSERT INTO times (time_start, time_end, event_id) VALUES ("2022-06-10 18:00:00", "2022-06-10 20:00:00", 0), ("2022-06-10 20:00:00", "2022-06-10 22:00:00", 0), ("2022-06-10 22:00:00", "2022-06-11 00:00:00", 0);