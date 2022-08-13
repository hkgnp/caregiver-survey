const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash("sha256");
  const hash = sha256.update(password).digest("base64");
  return hash;
};

router.get("/", async (req, res) => {
  res.render("login");
});

router.post("/", async (req, res) => {
  const user = await req.mongoClient
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

module.exports = router;
