require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const hbs = require("hbs");
const wax = require("wax-on");

const hbsUtil = require("./utilities/HbsHelpers");

const mongoUrl = process.env.MONGO_URL;
const MongoUtil = require("./utilities/MongoUtil");

const { useSessions } = require("./middleware");

app.use(express.json());
app.use(cors());

// set public folders
app.use(express.static("public"));
app.use(
  "/scripts",
  express.static(__dirname + "/node_modules/bootstrap/dist/js")
);
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));

// set view engine
app.set("view engine", "hbs");
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// enable hbs helpers
hbsUtil.use();

// enable forms
app.use(
  express.urlencoded({
    extended: false,
  })
);

// enable sessions
app.use(useSessions());

// Import routes
const indexRoute = require("./routes/index");
const resultsRoute = require("./routes/results");
const loginRoute = require("./routes/login");
const changePasswordRoute = require("./routes/changePassword");
const logoutRoute = require("./routes/logout");
const dashboardRoute = require("./routes/dashboard");
const detailsRoute = require("./routes/details");

// start main function
(async () => {
  const db = await MongoUtil.connect(mongoUrl, "caregiver-survey");

  // add mongodb to middleware
  app.use((req, res, next) => {
    req.mongoClient = db;
    next();
  });

  // questionnaire page
  app.use("/", indexRoute);
  // results page
  app.use("/results", resultsRoute);
  // Login page
  app.use("/login", loginRoute);
  // Change password
  app.use("/change-password", changePasswordRoute);
  // Logout
  app.use("/logout", logoutRoute);
  // Dashboard page
  app.use("/dashboard", dashboardRoute);
  // Profile details (from dashboard)
  app.use("/details/", detailsRoute);
})();

app.listen(process.env.PORT || 7000, () =>
  console.log("Server is running! Woohoo!")
);
