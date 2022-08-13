const hbs = require("hbs");

function use() {
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
}

module.exports = { use };
