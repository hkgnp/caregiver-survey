const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  req.session.user = null;
  req.flash("success_messages", "You have been successfully logged out");
  res.redirect("/");
});

module.exports = router;
