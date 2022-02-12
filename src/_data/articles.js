require("dotenv").config();
// import * from './parsePage.js'; // doesn't work natively yet in eleventy 1.0.0
parsePageUtils = require("./parsePage.js");
/** Eleventy's asset caching
 * will check if cached assets (the payload from Notion)
 * is older than [1 hour] and either return the locally cached json file or
 * re-fetch
 */

const {
  Cache,
  AssetCache
} = require("@11ty/eleventy-cache-assets");
const fs = require('fs');

const {
  Client,
  LogLevel // optional local debugger
} = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  // logLevel: LogLevel.DEBUG,
});

const result = (async () => {
  const pageId = process.env.MAIN_PAGE;
  const response = await parsePageUtils.fetchBlocks(notion, pageId);
  // console.log("main pages: ", response.results);
  let pages_parsed = await Promise.all(response.results
    // check if entry is a child page and skip empty blocks etc.
    .filter(page => page.type === "child_page")
    .map(async (page) => parsePageUtils.parsePage(notion, page))
  )
  // console.dir(pages_parsed)
  writeJSON(pages_parsed) // optional: local copy of parsed JSON
  return pages_parsed
})(); // IIFE

/** optional local JSON file output  */
const writeJSON = (json) => {
  // create json folder if it doesn't exist
  if (!fs.existsSync("json")) {
    fs.mkdirSync("json");
  }
  const data = JSON.stringify(json, null, 2);
  fs.writeFile('json/articles.json', data, (err) => {
    if (err) {
      throw err;
    }
    console.log("JSON data is saved.");
  });
}

module.exports = async function () {

  let asset = new AssetCache("notion_posts");

  if (asset.isCacheValid("1h")) {
    return asset.getCachedValue(); // returns a Promise
  }

  result.then(resolved => asset.save(resolved, "json"))

  return result
};
