const checkIfSuperUser = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash(
      "error_messages",
      "The page you were trying to access is only for registered users."
    );
    res.redirect("/login");
  }
};

module.exports = {
  checkIfSuperUser,
};
