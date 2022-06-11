const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const logger = require("morgan");
const session = require("express-session"); // sessions
const mysql = require("mysql");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const hostsRouter = require("./routes/hosts");
const adminRouter = require("./routes/admin");

// create pool
var dbConnectionPool = mysql.createPool(
{
  host: "localhost",
  database: "project"
});

const app = express();
app.use(bodyParser.json());

app.use(function(req, res, next)
{
  req.pool = dbConnectionPool;
  next();
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// create session
app.use(session(
{
  secret: "encryption key",
  resave: false,
  saveUninitialized: true,
  cookie: {secure: false}
}));

app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/users/hosts", hostsRouter);
app.use("/users/admin", adminRouter);

module.exports = app;