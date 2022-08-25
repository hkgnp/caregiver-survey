const express = require("express");
const router = express.Router();

router.get("/", async function (req, res) {
  const questions = await req.mongoClient
    .collection("questions")
    .find({})
    .toArray();
  await new Promise((r) => setTimeout(r, 4000));
  res.render("index", {
    questions: questions,
  });
});

router.post("/", async function (req, res) {
  const { qn1, qn2, qn3, qn4, qn5, qn6, qn7, qn8, qn9, qn10, qn11, qn12 } =
    req.body;

  const numArr = [
    parseInt(qn1),
    parseInt(qn2),
    parseInt(qn3),
    parseInt(qn4),
    parseInt(qn5),
    parseInt(qn6),
    parseInt(qn7),
    parseInt(qn8),
    parseInt(qn9),
    parseInt(qn10),
    parseInt(qn11),
    parseInt(qn12),
  ];

  const surveyScore = numArr.reduce((total, num) => {
    return total + num;
  });

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

  const result = await req.mongoClient.collection("results").insertOne(postObj);
  const id = result.insertedId;

  res.status(200);
  res.redirect(`/results/${id}`);
});

module.exports = router;
