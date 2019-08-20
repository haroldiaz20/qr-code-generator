// log error handler
function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

// client error handler
function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(err.status || 500).json({
      error: {
        statusCode: err.status || 500,
        message: err.message
      }
    });
  } else {
    next(err);
  }
}

// custom error handler
function errorHandler(err, req, res, next) {
  res.status(err.status || 500).json(err.data);
}

// import modules
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const favicon = require("serve-favicon");
const compression = require("compression");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const winston = require("./lib/logger");

// load env vars
const node_env = process.env.NODE_ENV || "development";
console.log(node_env);
const customEnvFilePath = path.resolve(__dirname, "env", `.env.${node_env}`);
// require dotenv configuration
require("dotenv").config({ path: customEnvFilePath });


// Routes
const indexRouter = require("./routes/index");
const documentsRouter = require("./routes/documents");

var app = express();
// send favicon response
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
// use compression
app.use(compression());

// use logger on each request
app.use(logger("combined", { stream: winston.stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// routes to be used in this app
app.use("/", indexRouter);
// main route
app.use("/qr/documents", documentsRouter);

// body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
// error handler
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

// don't send information about the sever on response
app.disable("x-powered-by");
module.exports = app;
