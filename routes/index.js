/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const argon2 = require("argon2"); // hashing
const url = require('url');
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const axios = require('axios');
const google = require('googleapis');

const validate = require("validate.js");

router.post('/auth/google', function(req, res, next) // keep separate since google does signup + log in
{
  const decodedBody = jwt.decode(req.body.credential, {complete: true}).payload;

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    connection.query("INSERT INTO users (username, email, first_name, last_name, image) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username), email = VALUES(email), first_name = VALUES(first_name), last_name = VALUES(last_name)", [decodedBody.email, decodedBody.email, decodedBody.given_name, decodedBody.family_name, decodedBody.picture], function(error, rows, fields)
    {
      connection.release();

      if (error)
      {
        res.sendStatus(500);
        console.log(error);
        return;
      }

      req.session.username = decodedBody.email;

      res.redirect("/home.html"); // since this is a traditional request (not ajax), redirect server-side
    });
  });
});

router.post("/signup", function(req, res, next)
{
  if (!("username" in req.body && "password" in req.body && "email" in req.body && "first_name" in req.body && "last_name" in req.body && "location" in req.body && "phone" in req.body))
  {
    res.status(400).send("Missing username, password, email, first_name, last_name, loation or phone");
    return;
  }

  if (signUpValidator(req) != "")
  {
    res.status(400).send(signUpValidator(req));
    return;
  }

  req.pool.getConnection(async function(error, connection) // async function for argon2
  {
    if (error)
    {
      res.sendStatus(500);
      console.log(error);
      return;
    }

    const password = await argon2.hash(req.body.password);

    connection.query("INSERT INTO users (username, password, email, first_name, last_name, location, phone) VALUES (?, ?, ?, ?, ?, ?, ?)", [req.body.username, password, req.body.email, req.body.first_name, req.body.last_name, req.body.location, req.body.phone], function(error, rows, fields)
    {
      connection.release();

      if (error)
      {
        if (error.code == "ER_DUP_ENTRY")
          res.sendStatus(403);
        else
        {
          res.sendStatus(500);
          console.log(error);
        }

        return;
      }

      res.sendStatus(200);
    });
  });
});

router.post("/login", function(req, res, next)
{
  if (!("identifier" in req.body && "password" in req.body))
  {
    res.status(400).send("Missing identifier or password");
    return;
  }

  if (logInValidator(req) != "")
  {
    res.status(400).send(logInValidator(req));
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

    // async function for argon2
    connection.query("SELECT * FROM users WHERE (username = ? OR email = ?) AND event_id IS NULL", [req.body.identifier, req.body.identifier], async function(error, rows, fields)
    {
      if (error)
      {
        connection.release();
        res.sendStatus(500);
        console.log(error);
        return;
      }

      if (!(rows.length && await argon2.verify(rows[0].password, req.body.password))) // incorrect username or password
      {
        connection.release();
        res.sendStatus(401);
        return;
      }

      req.session.username = rows[0].username;
      res.sendStatus(200);
    });
  });
});

router.get("/event", function(req, res, next)
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

      res.json(rows[0]);
    });
  });
});

router.get("/times", function(req, res, next)
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
    connection.query("SELECT time_id, DATE_FORMAT(time_start, '%Y-%m-%dT%H:%i') AS time_start, DATE_FORMAT(time_end, '%Y-%m-%dT%H:%i') AS time_end, time_count FROM times WHERE event_id = ?", [req.query.event_id], function(error, rows, fields)
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

      res.json(rows);
    });
  });
});

router.post("/create-guest", function(req, res, next)
{
  if (!("first_name" in req.body && "last_name" in req.body && "location" in req.body && "event_id" in req.body))
  {
    res.status(400).send("Missing first_name, last_name, location or event_id");
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

    var username = Math.floor(Math.random() * Date.now() / 1024).toString(); // randomly generate guest username

    connection.query("INSERT INTO users (username, first_name, last_name, location, event_id) VALUES (?, ?, ?, ?, ?)", [username, req.body.first_name, req.body.last_name, req.body.location, req.body.event_id], function(error, rows, fields)
    {
      if (error)
      {
        connection.release();

        if (error.code == "ER_DUP_ENTRY") // duplicates are statistically impossible
          res.sendStatus(403);
        else
        {
          res.sendStatus(500);
          console.log(error);
        }

        req.session.username = username;
        res.json({"username": username});
      }
    });
  });
});

router.post("/login-guest", function(req, res, next)
{
  if (!("username" in req.body && "event_id" in req.body))
  {
    res.status(400).send("Missing username or event_id");
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

    connection.query("SELECT * FROM users WHERE username = ? AND event_id = ?", [req.body.username, req.body.event_id], function(error, rows, fields)
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
        res.sendStatus(401);
        return;
      }

      req.session.username = req.body.username;
      res.sendStatus(200);
    });
  });
});

module.exports = router;

// validation

var signUpConstraints = {
    username: {
        presence: {allowEmpty: false},
        email: false,
        length: {
            minimum : 3,
            maximum: 63
        }
    },
    password: {
        presence: {allowEmpty: false},
        length: {
            minimum : 3,
            maximum: 127
        }
    },
    email:{
        presence: {allowEmpty: false},
        length: {
            maximum: 255
        }
    },
    first_name: {
        presence: {allowEmpty: false},
        length: {
            maximum: 255
        }
    },
    last_name: {
        presence: {allowEmpty: false},
        length: {
            maximum: 255
        }
    },
    phone: {
        presence: {allowEmpty: false},
        length: {
            is: 10
        }
    }
};

var logInConstraints = {
    identifier: {
        presence: {allowEmpty: false},
        length: {
            minimum : 3,
            maximum: 127
        }
    },
    password: {
        presence: {allowEmpty: false},
        length: {
            minimum : 3,
            maximum: 127
        }
    }
};

function genericValidator(inputObj,validatorType) {
  let response = validate(inputObj,validatorType);

  console.log(response);

  if (response == undefined){
      return "";
  }
  let message = "";
  for (const e in response.elements){
      message += `${e.name}: ${e.value}\n`;
  }
  return message;
}

function signUpValidator(inputObj){
    return genericValidator (inputObj,signUpConstraints);
}

function logInValidator(inputObj){
    return genericValidator(inputObj,logInConstraints);
}

function createEventValidator(inputObj){
    return genericValidator(inputObj,createEventConstraints);
}