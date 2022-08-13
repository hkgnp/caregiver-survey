const express = require("express");
const router = express.Router();
const ObjectID = require("mongodb").ObjectId;

router.get("/:id", async (req, res) => {
  const result = await req.mongoClient
    .collection("results")
    .find({ _id: new ObjectID(req.params.id) })
    .toArray();

  res.status(200);
  res.render("details", {
    result: result[0],
  });
});

module.exports = router;
