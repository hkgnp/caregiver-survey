const express = require("express");
const router = express.Router();
const ObjectID = require("mongodb").ObjectId;

router.get("/:id", async function (req, res) {
  const result = await req.mongoClient
    .collection("results")
    .findOne({ _id: new ObjectID(req.params.id) });

  res.status(200);
  res.render("profile", {
    result: result,
  });
});

module.exports = router;
