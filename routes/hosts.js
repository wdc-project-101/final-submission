/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const google = require('googleapis');

router.use("/", function(req, res, next) // host (or admin) check
{
    let event_id = null;

    if ("event_id" in req.query)
        event_id = req.query.event_id;
    else if ("event_id" in req.body)
        event_id = req.body.event_id;

    if (event_id === null)
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

        connection.query("SELECT * FROM events WHERE event_id = ? AND event_host = ?", [event_id, req.session.username], function(error, rows, fields)
        {
            if (error)
            {
                connection.release();
                res.sendStatus(500);
                console.log(error);
                return;
            }

            if (rows.length)
            {
                connection.release();
                next();
                return;
            }

            connection.query("SELECT * FROM admins WHERE username = ?", [req.session.username], function(error, rows, fields)
            {
                connection.release();

                if (error)
                {
                    res.sendStatus(500);
                    console.log(error);
                    return;
                }

                if (rows.length)
                {
                    next();
                    return;
                }

                res.sendStatus(401);
            });
        });
    });
});

router.get("/check", function(req, res, next)
{
  res.sendStatus(200);
});

router.put("/modify-event", function(req, res, next)
{
    req.pool.getConnection(function(error, connection)
    {
        if (error)
        {
            res.sendStatus(500);
            console.log(error);
            return;
        }

        if ("event_name" in req.body)
        {
            connection.query("UPDATE events SET event_name = ? WHERE event_id = ?", [req.body.event_name, req.body.event_id], function(error, rows, fields)
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
        }
        else if ("event_description" in req.body)
        {
            connection.query("UPDATE events SET event_description = ? WHERE event_id = ?", [req.body.event_description, req.body.event_id], function(error, rows, fields)
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
        }
        else if ("event_location" in req.body)
        {
            connection.query("UPDATE events SET event_location = ? WHERE event_id = ?", [req.body.event_location, req.body.event_id], function(error, rows, fields)
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
        }
        else if ("event_start" in req.body)
        {
            connection.query("UPDATE events SET event_start = ? WHERE event_id = ?", [req.body.event_start, req.body.event_id], function(error, rows, fields)
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
        }
        else if ("event_end" in req.body)
        {
            connection.query("UPDATE events SET event_end = ? WHERE event_id = ?", [req.body.event_end, req.body.event_id], function(error, rows, fields)
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
        }
    });
});

router.delete("/delete-event", function(req, res, next)
{
  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
        res.sendStatus(500);
        console.log(error);
        return;
    }

    connection.query("DELETE FROM events WHERE event_id = ?", [req.body.event_id], function(error, rows, fields)
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

router.post("/create-time", function(req, res, next)
{
    if (!("time_start" in req.body && "time_end" in req.body))
    {
        res.sendStatus(400);
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

        connection.query("INSERT INTO times (time_start, time_end, event_id) VALUES (DATE_FORMAT(?, '%Y-%m-%d %H:%i'), DATE_FORMAT(?, '%Y-%m-%d %H:%i'), ?)", [req.body.time_start, req.body.time_end, req.body.event_id], function(error, rows, fields)
        {
            if (error)
            {
                connection.release();
                res.sendStatus(500);
                console.log(error);
                return;
            }

            connection.query("SELECT LAST_INSERT_ID() AS time_id", function(error, rows, fields)
            {
                connection.release();

                if (error)
                {
                    res.sendStatus(500);
                    console.log(error);
                    return;
                }

                res.json({"time_id": rows[0].time_id});
            });
        });
    });
});

router.put("/modify-time", function(req, res, next)
{
    if (!("time_id" in req.body && "time_start" in req.body && "time_end" in req.body))
    {
        res.sendStatus(400);
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

        // reset user count since nullifying availabilities
        connection.query("UPDATE times SET time_start = DATE_FORMAT(?, '%Y-%m-%d %H:%i'), time_end = DATE_FORMAT(?, '%Y-%m-%d %H:%i'), time_count = 0 WHERE time_id = ?", [req.body.time_start, req.body.time_end, req.body.time_id], function(error, rows, fields)
        {
            if (error)
            {
                res.sendStatus(500);
                console.log(error);
                return;
            }

            // nullify availabilities (users may not be available for new time)
            connection.query("UPDATE availabilities SET available = NULL WHERE time_id = ?", [req.body.time_id], function(error, rows, fields)
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

router.post("/delete-time", function(req, res)
{
    console.log(req.body.time_id);

    if (!("time_id" in req.body))
    {
        res.sendStatus(400);
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

        connection.query("DELETE FROM times WHERE time_id = ?", [req.body.time_id], function(error, rows, fields)
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

router.get("/attendees", function(req, res, next)
{
    if (!("event_id" in req.query))
    {
        res.sendStatus(400);
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

        connection.query("SELECT username, first_name, last_name FROM users INNER JOIN (SELECT DISTINCT username event_username FROM availabilities INNER JOIN (SELECT time_id AS event_time_id FROM times WHERE event_id = ?) AS times ON availabilities.time_id = event_time_id) AS availabilities ON users.username = event_username", [req.query.event_id], function(error, rows, fields)
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

router.get("/suggested-location", function(req, res, next)
{
    if (!("event_id" in req.query))
    {
        res.sendStatus(400);
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

        connection.query("SELECT location FROM users INNER JOIN (SELECT DISTINCT username AS event_username FROM availabilities INNER JOIN (SELECT time_id AS event_time_id FROM times WHERE event_id = ?) AS times ON availabilities.time_id = event_time_id) AS availabilities ON users.username = event_username", [req.query.event_id], function(error, rows, fields)
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
                res.send({"suggested_location": null});
                return;
            }

            var avg_latitude = 0;
            var avg_longitude = 0;

            var geocoder = new google.maps.Geocoder();

            for (let row of rows) {
                geocoder.geocode( { 'address': row.location}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                    avg_latitude += results[0].geometry.location.lat();
                    avg_longitude += results[0].geometry.location.lng();
                    }
                });
            }

            avg_latitude /= rows.length;
            avg_longitude /= rows.length;
            console.log(avg_latitude, avg_longitude);

            res.send({"suggested_location": geocodeLatLng(avg_latitude, avg_longitude)});
        });
    });
});

function geocodeLatLng(avg_latitude,avg_longitude) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: {avg_latitude, avg_longitude} }).then((response) => {
        if (response.results[0]) {
            console.log(response);
        }
        return response.results[0];
      }).catch((e) => window.alert("Geocoder failed due to: " + e));
  }

module.exports = router;