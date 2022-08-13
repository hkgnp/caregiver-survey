const express = require("express");
const router = express.Router();

const { checkIfSuperUser } = require("../middleware");

router.get("/", checkIfSuperUser, async (req, res) => {
  const results = await req.mongoClient
    .collection("results")
    .find({})
    .toArray();
  res.status(200);
  res.render("dashboard", {
    results: results,
  });
});

module.exports = router;
