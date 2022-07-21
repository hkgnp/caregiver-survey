require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoUrl = process.env.MONGO_URL;
const MongoUtil = require("./MongoUtil");
const hbs = require("hbs");
const wax = require("wax-on");

app.use(express.json());
app.use(cors());

app.use(express.static("public"));
app.set("view engine", "hbs");
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

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
    console.log(req.body);
    //const { qn12 } = req.body;
    //const results = await db.collection("results").insertOne({
    //  qn12: qn12,
    //});
    res.status(200);
    //console.log(results);
    res.redirect("/");
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
