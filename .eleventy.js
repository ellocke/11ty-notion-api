module.exports = function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy("./src/css/*.*");
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");

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
