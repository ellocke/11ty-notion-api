
module.exports = function (config) {

  return {
    htmlTemplateEngine: "njk",
    // dataTemplateEngine: ["js", "json"],
    dir: {
      input: "src",
      output: "_site",
      data: "_data",
      includes: "_includes",
      layouts: "_layouts",
    },
  };
};
