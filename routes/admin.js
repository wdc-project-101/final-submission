/* eslint-disable no-console */
const express = require("express");
const router = express.Router();

router.use("/", function(req, res, next) // admin check
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
      connection.release();
      res.sendStatus(500);
      console.log(error);
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

      if (!rows.length)
        res.sendStatus(401);
      else
        next();
    });
  });
});

router.get("/check", function(req, res, next)
{
  res.sendStatus(200);
});

router.post("/add", function(req, res, next)
{
  if (!("username" in req.body))
  {
    res.status(400).send("Missing username");
    return;
  }

  req.pool.getConnection(function(error, connection)
  {
    if (error)
    {
      connection.release();
      res.sendStatus(500);
      console.log(error);
      return;
    }

    connection.query("INSERT INTO admins VALUES ?", [req.body.username], function(error, rows, fields)
    {
      connection.release();

      if (error)
      {
        if (error.code == "ER_DUP_ENTRY")
          res.sendStatus(403);
        else if (error.code == "ER_NO_REFERENCED_ROW_2")
          res.status(400).send("Invalid username");
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

module.exports = router;