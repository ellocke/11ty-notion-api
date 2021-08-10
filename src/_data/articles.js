require("dotenv").config();

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

// helper npm package to compose the CSS class array based on {bool: true}
const classNames = require("classnames");

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
  // writeJSON(blocks_parsed) // optional: local copy of parsed JSON

  return blocks_parsed
})(); // IIFE

const parsePage = async (page) => {

  console.log("Page: ", page.child_page.title)

  let blocks = await notion.blocks.children.list({
    block_id: page.id,
    page_size: 50, // TBC: how to set unlimited?
  })

  // console.log("blocks: ")
  // console.dir(blocks.results)
  let blocksLength = blocks.results.length
  // console.log("length: ", blocksLength)

  let blocksBody = blocks.results
    .map((block, index) => {
      // look up next block type (i.e. for a pointer for <ul>)
      let nextType = index < (blocksLength - 1) ? blocks.results[index + 1].type : false
      return parseBlock(block, nextType)
    })
    .filter(block => block.text !== "[ERROR]")

  // console.log(blocksBody)

  return {
    title: page.child_page.title,
    subtitle: "tbd",
    hero: "tbd",
    heroAltDescription: "tbd",
    authors: ["tbd"],
    date: "tbd",
    body: blocksBody,
    // raw_page: page
  }
};

const parseBlock = (block, nextType) => {

  if (block.object !== "block") {
    return {
      type: `[ERROR] - block type: ${block.object}`
    }
  }

  // drop empty object entries
  Object.keys(block).forEach(function (key) {
    if (block[key] === false) {
      delete block[key];
    }
  });

  const isValid = block[block.type].text && block[block.type].text.length

  // isValid && console.log(block.type, nextType)

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

  return {
    block_type: block.type || "[ERROR",
    text: isValid ? block[block.type].text.map(entry => entry.plain_text) : "[ERROR]",
    parsedText: isValid ? block[block.type].text.map(entry => parseText(entry)).flat() : "[ERROR]",
    annotations: annotations || false,
    children: block.has_children ? block.children : false,
    next_block_type: nextType || false
    // raw_content: block[block.type] || "[ERROR]",
    // rest: block
  }
}

const colorMapper = {
  default: false,
  yellow: "yellow",
  gray: "gray",
  brown: "brown",
  orange: "orange",
  green: "green",
  blue: "blue",
  purple: "purple",
  red: "red"
};

const parseText = function (block) {

  // console.log(block);

  if (!block) {
    return null;
  }

  const hasAttributes = Object.values(block.annotations).some(val => val === true)
  const isShortcode = block.annotations.code
  const isLinked = block.href ? true : false
  const innerText = isLinked ?
    `<a href='${block.text.link.url}' target='_blank' rel='noopener noreferrer'>${block.text.content}</a>` :
    block.text.content

  // console.log(isShortcode)

  if (hasAttributes) {
    const {
      bold,
      code,
      color,
      italic,
      strikethrough,
      underline
    } = block.annotations;

    return `<span class='${classNames(colorMapper[color], {
          'font-bold': bold,
          italic: italic,
          'line-through': strikethrough,
          underline: underline,
          'code': code})}'>${innerText}</span>`;
  } else {
    return innerText
  }

}

/** optional local JSON file output  */
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
    return asset.getCachedValue();
  }

  result.then(resolved => asset.save(resolved, "json"))

  return result
};
