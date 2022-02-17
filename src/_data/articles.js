require("dotenv").config();
// import * from './parsePage.js'; // doesn't work natively yet in eleventy 1.0.0
parsePageUtils = require("./../../utils/parsePage.js");

/** Eleventy's asset caching
 * will check if cached assets (the processed payload from Notion)
 * are older than [1 hour] and either returns the cached json file or
 * re-fetches from API
 */

const {
  Cache,
  AssetCache
} = require("@11ty/eleventy-cache-assets");

// const fs = require('fs'); // for writeJSON

const {
  Client,
  // LogLevel // optional local debugger
} = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  // logLevel: LogLevel.DEBUG,
});

const result = (async () => {
  const databaseId = process.env.NOTION_DATABASE_ID;
  const response = await notion.databases.query({
    database_id: databaseId
  });

  console.log("main pages: ", response.results.length);

  let pages_parsed = await Promise.all(response.results
    // deprecated: check if entry is a child page and skip empty blocks etc.
    // .filter(page => page.type === "child_page")
    // .reverse() // TBC: critical since Notion used to return in reverse logical (maybe alphabetical) order
    .map(async (db_entry, index) =>
      parsePageUtils.parsePage(notion, db_entry, index))
  )
  // console.dir(pages_parsed)
  parsePageUtils.writeJSON(pages_parsed, 'json/articles.json') // optional: local copy of parsed JSON
  return pages_parsed
})(); // IIFE

module.exports = async function () {

  let asset = new AssetCache("notion_posts");

  if (asset.isCacheValid("1h")) {
    return asset.getCachedValue(); // returns a Promise
  }

  result.then(resolved => asset.save(resolved, "json"))

  return result
};
