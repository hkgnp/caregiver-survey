const express = require("express");
const app = express();
const session = require("express-session");
const flash = require("connect-flash");
const csurf = require("csurf");

function use() {
  // setup sessions
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
    })
  );

  // Set up flash
  app.use(flash());

  // Set up csurf
  const csurfInstance = csurf();
  app.use((req, res, next) => {
    csurfInstance(req, res, next);
  });

  app.use((err, req, res, next) => {
    if (err && err.code == "EBADCSRFTOKEN") {
      console.log(err);
      req.flash(
        "error_messages",
        "The form has expired. Please reload your page."
      );
      res.redirect("back");
    } else {
      next();
    }
  });

  // Flash messages middleware
  app.use((req, res, next) => {
    res.locals.success_messages = req.flash("success_messages");
    res.locals.error_messages = req.flash("error_messages");
    next();
  });

  // User session middleware
  app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
  });

  // req.csrfToken
  app.use((req, res, next) => {
    if (req.csrfToken) {
      res.locals.csrfToken = req.csrfToken();
    }
    next();
  });

  console.log("testing one ");

  return app;
}

module.exports = { use };
