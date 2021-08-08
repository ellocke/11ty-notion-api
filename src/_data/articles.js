require("dotenv").config();
const {
  Cache,
  AssetCache
} = require("@11ty/eleventy-cache-assets");
const fs = require('fs');

const {
  Client,
  LogLevel
} = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  // logLevel: LogLevel.DEBUG,
});

const result = (async () => {
  const pageId = process.env.MAIN_PAGE;

  const response = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 50,
  });

  // console.log("main pages: ", response.results);

  let blocks_parsed = await Promise.all(response.results
    .map(async (page) =>
      parsePage(page))
  )

  // console.dir(blocks_parsed)
  // writeJSON(blocks_parsed)

  return blocks_parsed
})();

const parsePage = async (page) => {


  console.log("single page: ", page.child_page.title)

  let blocks = await notion.blocks.children.list({
    block_id: page.id,
    page_size: 50,
  }).then(response => response)

  // console.log("blocks: ")
  // console.dir(blocks.results)

  let blocksBody = blocks.results.map(block => parseBlock(block))

  // console.log(blocksBody)

  return {
    title: page.child_page.title,
    subtitle: "tbd",
    hero: "tbd",
    heroAltDescription: "tbd",
    authors: ["tbd"],
    date: "tbd",
    body: blocksBody.filter(block => block.text !== "error"),
    // raw_page: page
  }
};

const parseBlock = (block) => {
  if (block.object !== "block") {
    return {
      type: "error"
    }
  }

  Object.keys(block).forEach(function (key) {
    if (block[key] === false) {
      delete block[key];
    }
  });

  const isValid = block[block.type].text && block[block.type].text.length

  const annotations = isValid && block[block.type].text
    .map(entry => Object.assign({}, entry.annotations)) || false

  annotations && annotations
    .forEach(anno => {
      Object.keys(anno).forEach(function (key) {
        if (anno[key] === false || anno[key] === "default") {
          delete anno[key];
        }
      });
    })

  // console.log(block)

  return {
    block_type: block.type || "error",
    text: isValid ? block[block.type].text.map(entry => entry.plain_text) : "error",
    annotations: annotations || false,
    children: block.has_children ? block.children : false,
    raw_content: block[block.type] || "error",
    // rest: block
  }
}


// const writeJSON = (json) => {

//   if (!fs.existsSync("json")) {
//     fs.mkdirSync("json");
//   }

//   const data = JSON.stringify(json, null, 2);
//   fs.writeFile('json/articles.json', data, (err) => {
//     if (err) {
//       throw err;
//     }
//     console.log("JSON data is saved.");
//   });
// }


module.exports = async function () {

  let asset = new AssetCache("notion_posts");

  if (asset.isCacheValid("1h")) {
    // return cached data.
    return asset.getCachedValue(); // a promise
  }

  result.then(resolved => asset.save(resolved, "json"))

  return result
};
