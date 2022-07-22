require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoUrl = process.env.MONGO_URL;
const MongoUtil = require("./MongoUtil");
const ObjectID = require("mongodb").ObjectID;
const hbs = require("hbs");
const wax = require("wax-on");

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

    const screenScore =
      parseInt(qn1) + parseInt(qn2) + parseInt(qn5) + parseInt(qn10);

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
    postObj["screenScore"] = screenScore;
    postObj["surveyScore"] = surveyScore;

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

  // Dashboard page
  app.get("/dashboard", async (req, res) => {
    const results = await db.collection("results").find({}).toArray();

    res.status(200);
    res.send(results);
    //res.render("index", {
    //  results: results,
    //});
  });
})();

app.listen(process.env.PORT || 7000, () =>
  console.log("Server is running! Woohoo!")
);
