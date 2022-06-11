/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const axios = require('axios');
const google = require('googleapis');

router.use("/", function(req, res, next) // user check
{
  if (!("username" in req.session))
  {
    res.sendStatus(401);
    return;
  }

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    connection.query("SELECT * FROM users WHERE username = ?", [req.session.username], function(error, rows, fields)
    {
      connection.release();

      if (error)
      {
        res.sendStatus(500);
        console.log(error);
        return;
      }

      if (!rows.length)
      {
        delete req.session.username;
        res.sendStatus(401);
        return;
      }

      next();
    });
  });
});

router.get("/check", function(req, res, next)
{
  res.sendStatus(200);
});

router.post("/logout", function(req, res, next)
{
  delete req.session.username; // logout
  res.sendStatus(200);
});

router.get("/user", function(req, res, next)
{
  var field = "username, email, first_name, last_name, phone, location, image";

  // check if field exists and make sure its valid (protect against injection)
  if ("field" in req.query && (req.query.field == "email" || req.query.field == "first_name" || req.query.field == "last_name" || req.query.field == "phone" || req.query.field == "location" || req.query.field == "image"))
    field = req.query.field;

  req.pool.getConnection(async function (error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    // have to call even for non-admin routes to allow nesting
    connection.query("SELECT * FROM admins WHERE username = ?", [req.session.username], function(error, rows, fields)
    {
      if (error)
      {
        connection.release();
        res.sendStatus(500);
        console.log(error);
        return;
      }

      var username = req.session.username;

      if ("username" in req.query && req.query.username != req.session.username)
      {
        if (!rows.length)
        {
          connection.release();
          res.sendStatus(401);
          return;
        }

        username = req.query.username;
      }

      connection.query(`SELECT ${field} FROM users WHERE username = ?`, username, function (error, rows, fields)
      {
        connection.release();

        if (error)
        {
          res.sendStatus(500);
          console.log(error);
          return;
        }

        if (!rows.length)
        {
          res.status(400).send("Invalid username");
          return;
        }

        // unlike /users/events, where events need to be distinguished by key, field specific requests can be returned by themselves
        if ("field" in req.query && (req.query.field == "email" || req.query.field == "first_name" || req.query.field == "last_name" || req.query.field == "phone" || req.query.field == "location"))
          res.send(rows[0][req.query.field]);
        else
          res.send(rows[0]);
      });
    });
  });
});

router.put("/modify", function(req, res, next)
{
  if (!("email" in req.body && "first_name" in req.body && "last_name" in req.body && "location" in req.body & "phone" in req.body))
  {
    res.status(400).send("Missing email, first_name, last_name, location or phone");
    return;
  }

  req.pool.getConnection(function (error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    connection.query("SELECT * FROM admins WHERE username = ?", [req.session.username], function(error, rows, fields)
    {
      if (error)
      {
        connection.release();
        res.sendStatus(500);
        console.log(error);
        return;
      }

      var username = req.session.username;

      if ("username" in req.query && req.query.username != req.session.username)
      {
        if (!rows.length)
        {
          connection.release();
          res.sendStatus(401);
          return;
        }

        username = req.query.username;
      }

      connection.query("UPDATE users SET email = ?, first_name = ?, last_name = ?, location = ?, phone = ? WHERE username = ?", [req.body.email, req.body.first_name, req.body.last_name, req.body.location, req.body.phone, username], function (error, rows, fields)
      {
        connection.release();

        if (error)
        {
          res.sendStatus(500);
          console.log(error);
          return;
        }

        res.sendStatus(200);
      });
    });
  });
});

router.delete("/delete", function(req, res, next)
{
  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    connection.query("SELECT * FROM admins WHERE username = ?", [req.session.username], function(error, rows, fields)
    {
      if (error)
      {
        connection.release();
        res.sendStatus(500);
        console.log(error);
        return;
      }

      var username = req.session.username;

      if ("username" in req.query && req.query.username != req.session.username)
      {
        if (!rows.length)
        {
          connection.release();
          res.sendStatus(401);
          return;
        }

        username = req.query.username;
      }

      connection.query("DELETE FROM users WHERE username = ?", [username], function(error, rows, fields)
      {
        connection.release();

        if (error)
        {
          res.sendStatus(500);
          console.log(error);
          return;
        }

        res.sendStatus(200);
      });
    });
  });
});

router.post("/create-event", function(req, res, next)
{
  if (!("event_name" in req.body && "event_description" in req.body && "event_location" in req.body && "times" in req.body))
  {
    res.status(400).send("Missing event_name, event_description, event_location, or times");
    return;
  }

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    var event_id = Math.floor(Math.random() * Date.now() / 1024);

    connection.query("INSERT INTO events (event_id, event_name, event_description, event_location, event_host) VALUES (?, ?, ?, ?, ?)", [event_id, req.body.event_name, req.body.event_description, req.body.event_location, req.session.username], function(error, rows, fields)
    {
      if (error)
      {
        connection.release();

        if (error.code == "ER_DUP_ENTRY")
        {
          res.sendStatus(403);
          return;
        }

        res.sendStatus(500);
        console.log(error);
        return;
      }

      var times = [];

      for (let i = 0; i < req.body.times.length; i += 2)
        times.push([req.body.times[i].replace('T', ' '), req.body.times[i + 1].replace('T', ' '), event_id]);

      connection.query("INSERT INTO times (time_start, time_end, event_id) VALUES ?", [times], function(error, rows, fields)
      {
        connection.release();

        if (error)
        {
          res.sendStatus(500);
          console.log(error);
          return;
        }

        res.send({"event_id": event_id});
      });
    });
  });
});

router.get("/availability", function(req, res, next)
{
  if (!("event_id" in req.query))
  {
    res.status(400).send("Missing event_id");
    return;
  }

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    connection.query("SELECT time_id, available FROM availabilities INNER JOIN (SELECT time_id AS event_time_id FROM times WHERE event_id = ?) AS event_times ON availabilities.time_id = event_time_id WHERE username = ?", [req.query.event_id, req.session.username], function(error, rows, fields)
    {
      connection.release();

      if (error)
      {
        res.sendStatus(500);
        console.log(error);
        return;
      }

      res.json(rows);
    });
  });
});

router.post("/specify-availability", function(req, res, next)
{
  if (!("availabilities" in req.body && req.body.availabilities.length && "time_id" in req.body.availabilities[0] && "available" in req.body.availabilities[0]))
  {
    res.status(400).send("Missing or malformed availabilities");
    return;
  }

  var times = []; // for later
  var availabilities = [];

  for (let availability of req.body.availabilities)
  {
    times.push(availability.time_id);
    availabilities.push([availability.time_id, req.session.username, availability.available]);
  }

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    // ideally performs both specify (insert) and modify (update)
    connection.query("INSERT INTO availabilities (time_id, username, available) VALUES ? ON DUPLICATE KEY UPDATE time_id = VALUES(time_id), username = VALUES(username), available = VALUES(available)", [availabilities], function(error, rows, fields)
    {
      if (error)
      {
        if (error.code == "ER_NO_REFERENCED_ROW_2")
          res.status(400).send("Invalid time_id");
        else
        {
          res.sendStatus(500);
          console.log(error);
        }

        return;
      }

      // update count
      connection.query("UPDATE times SET time_count = (SELECT COUNT(*) FROM availabilities WHERE availabilities.time_id = times.time_id AND available = 1) WHERE time_id IN (?)", [times], function(error, rows, fields)
      {
        connection.release();

        if (error)
        {
          res.sendStatus(500);
          console.log(error);
          return;
        }

        res.sendStatus(200);
      });
    });
  });
});

router.get("/events", function(req, res, next)
{
  var field = "*";

  // check if field exists and make sure its valid (protect against injection)
  if ("field" in req.query && (req.query.field == "event_name" || req.query.field == "event_description" || req.query.field == "event_location" || req.query.field == "event_start" || req.query.field == "event_end" || req.query.field == "event_host" || req.query.field == "confirmed"))
    field = "events.event_id, " + req.query.field;

  var limit = 16; // default limit

  if ("limit" in req.query && req.query.limit > 0)
    limit = req.query.limit;

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    connection.query(`SELECT ${field} FROM events INNER JOIN
      (SELECT DISTINCT event_id, (COUNT(*) = COUNT(available)) AS confirmed FROM times INNER JOIN
        (SELECT time_id, available FROM availabilities WHERE username = ?)
      AS availabilities ON times.time_id = availabilities.time_id GROUP BY event_id)
    AS times ON events.event_id = times.event_id LIMIT ?`, [req.session.username, limit], function(error, rows, fields)
    {
      connection.release();

      if (error)
      {
        res.sendStatus(500);
        console.log(error);
        return;
      }

      res.send(rows);
    });
  });
});

router.get("/hosted-events", function(req, res, next)
{
  var field = "*";

  if ("field" in req.query && (req.query.field == "event_name" || req.query.field == "event_description" || req.query.field == "event_location" || req.query.field == "event_start" || req.query.field == "event_end" || req.query.field == "confirmed"))
    field = "events.event_id, " + req.query.field;

  var limit = 16;

  if ("limit" in req.query && req.query.limit > 0)
    limit = req.query.limit;

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    connection.query(`SELECT ${field} FROM events WHERE event_host = ? LIMIT ?`, [req.session.username, limit], function(error, rows, fields)
    {
      connection.release();

      if (error)
      {
        res.sendStatus(500);
        console.log(error);
        return;
      }

      res.send(rows);
    });
  });
});

router.get("/calendar-availability", function(req, res, next)
{
  if (!("event_id" in req.query))
  {
    res.status(400).send("Missing event_id");
    return;
  }

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    // need to convert from sql format to format we need in html
    connection.query("SELECT time_id, DATE_FORMAT(time_start, '%Y-%m-%dT%H:%i'), DATE_FORMAT(time_start, '%Y-%m-%dT%H:%i'), time_count FROM times WHERE event_id = ?", [req.query.event_id], function(error, rows, fields)
    {
      connection.release();

      if (error)
      {
        res.sendStatus(500);
        console.log(error);
        return;
      }

      if (!rows.length)
      {
        res.status(400).send("Invalid event_id");
        return;
      }

      let availabilities = [];
      let promises = [];

      for (let row in rows)
      {
        // see https://developers.google.com/calendar/api/v3/reference/freebusy/query

        promises.push(
          axios.post("https://www.googleapis.com/calendar/v3/freeBusy",
          {
            "timeMin": row.time_start,
            "timeMax": row.time_end,
            "items": [{"id": "primary"}]
          })
          .then(function(response)
          {
            if (response.statusCode == 200) // returns true if no busy periods
              availabilities.push({"time_id": row.time_id, "available": !(JSON.parse(response).calendars/*[key?]*/.busy.length)});
          })
          .catch(function(error)
          {
            console.log(error);
          })
        );
      }

      Promise.all(promises).then(() => res.json({"availabilities": availabilities}));
    });
  });
});

router.post("/add-calendar-event", function(req, res, next)
{
  if (!("event_id" in req.query))
  {
    res.status(400).send("Missing event_id");
    return;
  }

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    connection.query("SELECT * FROM events WHERE event_id = ?", [req.query.event_id], function(error, rows, fields)
    {
      connection.release();

      if (error)
      {
        res.sendStatus(500);
        console.log(error);
        return;
      }

      if (!rows.length)
      {
        res.status(400).send("Invalid event_id");
        return;
      }

      // see https://developers.google.com/calendar/api/guides/create-events

      const calendar = new google.calendar({version: 'v3', auth: "token"});

      calendar.events.insert(
      {
        auth: "token",
        calendarId: "primary",
        resource:
        {
          'summary': rows[0].event_name,
          'location': rows[0].event_location,
          'description': rows[0].event_description,
          'start': {'dateTime': rows[0].event_start},
          'end': {'dateTime': rows[0].event_end}
        },
      },
      function(error, event)
      {
        if (error)
        {
          res.sendStatus(500);
          console.log(error);
          return;
        }

        res.sendStatus(200);
      });
    });
  });
});

module.exports = router;