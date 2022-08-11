require("dotenv").config();
const express = require("express");
const app = express();
const session = require("express-session");
const flash = require("connect-flash");
const csurf = require("csurf");
const cors = require("cors");
const mongoUrl = process.env.MONGO_URL;
const MongoUtil = require("./MongoUtil");
const ObjectID = require("mongodb").ObjectID;
const hbs = require("hbs");
const wax = require("wax-on");
const crypto = require("crypto");

const { checkIfSuperUser } = require("./middleware");

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash("sha256");
  const hash = sha256.update(password).digest("base64");
  return hash;
};

app.use(express.json());
app.use(cors());

app.use(express.static("public"));
app.use(
  "/scripts",
  express.static(__dirname + "/node_modules/bootstrap/dist/js")
);
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));

app.set("view engine", "hbs");
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// if equal function hbs helper
hbs.registerHelper("if_eq", (a, b, options) => {
  if (a === b) return options.fn(this);
  else return options.inverse(this);
});

hbs.registerHelper("eq", function () {
  const args = Array.prototype.slice.call(arguments, 0, -1);
  return args.every(function (expression) {
    return args[0] === expression;
  });
});

// enable forms
app.use(
  express.urlencoded({
    extended: false,
  })
);

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

(async () => {
  const db = await MongoUtil.connect(mongoUrl, "caregiver-survey");

  // Questionnaire page
  app.get("/", async (req, res) => {
    const questions = await db.collection("questions").find({}).toArray();

    res.status(200);
    res.render("index", {
      questions: questions,
    });
  });

  app.post("/", async (req, res) => {
    const { qn1, qn2, qn3, qn4, qn5, qn6, qn7, qn8, qn9, qn10, qn11, qn12 } =
      req.body;

    const surveyScore =
      parseInt(qn1) +
      parseInt(qn2) +
      parseInt(qn3) +
      parseInt(qn4) +
      parseInt(qn5) +
      parseInt(qn6) +
      parseInt(qn7) +
      parseInt(qn8) +
      parseInt(qn9) +
      parseInt(qn10) +
      parseInt(qn11) +
      parseInt(qn12);

    let postObj = req.body;
    postObj["surveyScore"] = surveyScore;

    let scoreDescription;
    if (surveyScore <= 10) {
      scoreDescription = "No to mild burden";
    } else if (surveyScore <= 20) {
      scoreDescription = "Mild to moderate burden";
    } else {
      scoreDescription = "Severe burden";
    }
    postObj["scoreDescription"] = scoreDescription;

    const result = await db.collection("results").insertOne(postObj);
    const id = result.insertedId;

    res.status(200);
    res.redirect(`/results/${id}`);
  });

  app.get("/results/:id", async (req, res) => {
    const result = await db
      .collection("results")
      .find({ _id: new ObjectID(req.params.id) })
      .toArray();

    res.status(200);
    res.render("profile", {
      result: result[0],
    });
  });

  // Login page
  app.get("/login", async (req, res) => {
    res.render("login");
  });

  app.post("/login", async (req, res) => {
    const user = await db
      .collection("users")
      .findOne({ email: req.body.email });

    // Handle no user
    if (!user) {
      req.flash("error_messages", "Invalid user.");
    }
    // Handle not first time login
    else if (user && req.body.password !== process.env.DEFAULT_PASSWORD) {
      if (user.password === getHashedPassword(req.body.password)) {
        req.session.user = {
          id: user["_id"],
          email: user["email"],
        };
        req.flash("success_messages", "You are logged in.");
        res.redirect("/dashboard");
      } else {
        req.flash(
          "error_messages",
          "You have entered the wrong password. Please try again."
        );
        res.redirect("/login");
      }
    }
    // Handle first time login
    else if (user && req.body.password === process.env.DEFAULT_PASSWORD) {
      req.session.user = {
        id: user["_id"],
        email: user["email"],
      };
      req.flash(
        "error_messages",
        "You are logging in for the first time. Please change your password."
      );
      res.redirect("/change-password");
    } else {
      req.flash(
        "error_messages",
        "Fatal error. Please contact the system administrator."
      );
      res.redirect("/login");
    }
  });

  app.get("/change-password", async (req, res) => {
    if (req.session && req.session.user) {
      const email = req.session.user.email;
      res.render("change-password", {
        user: email,
      });
    } else {
      req.flash(
        "error_messages",
        "The page you were trying to access is only for registered users."
      );
      res.redirect("/login");
    }
  });

  app.post("/change-password", async (req, res) => {
    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectID(req.session.user.id) },
        { $set: { password: getHashedPassword(req.body.password) } }
      );
    req.session.user = null;
    req.flash(
      "success_messages",
      "Password successfully changed. Please login again."
    );
    res.redirect("/dashboard");
  });

  app.get("/logout", (req, res) => {
    req.session.user = null;
    req.flash("success_messages", "You have been successfully logged out");
    res.redirect("/");
  });

  // Dashboard page
  app.get("/dashboard", checkIfSuperUser, async (req, res) => {
    const results = await db.collection("results").find({}).toArray();
    res.status(200);
    res.render("dashboard", {
      results: results,
    });
  });

  app.get("/details/:id", async (req, res) => {
    const result = await db
      .collection("results")
      .find({ _id: new ObjectID(req.params.id) })
      .toArray();

    res.status(200);
    res.render("details", {
      result: result[0],
    });
  });
})();

app.listen(process.env.PORT || 7000, () =>
  console.log("Server is running! Woohoo!")
);
