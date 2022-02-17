const fs = require('fs');

// helper npm package to compose the CSS class array based on {bool: true}
const classNames = require("classnames");

// async function to fetch all blocks from a page
async function fetchBlocks(notion, pageId) {
  const response = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 50,
  });
  return response;
}

const parsePage = async (notion, page, index) => {

  const pageProps = page.properties
  console.log(pageProps) // TODO: implement page props
  // console.log(Object.keys(page))
  writeJSON(pageProps, `json/response-meta-${index}.json`)

  let blocks = await fetchBlocks(notion, page.id);
  writeJSON(blocks, `json/response-body-${index}.json`)

  let blocksLength = blocks.results.length

  let blocksBody = blocks.results
    .map((block, index) => {
      // look up next block type (i.e. as a pointer for <ul></ul>)
      let nextType = index < (blocksLength - 1) ?
        blocks.results[index + 1].type :
        false
      return parseBlock(block, nextType)
    })
    .filter(block => block.text !== "[ERROR]" || block.isMedia)

  // console.log(blocksBody)

  return {
    title: pageProps.Title.title[0].text.content || "error",
    subtitle: parseRichText(pageProps.Subtitle.rich_text) || "error",
    hero: "tbd",
    heroAltDescription: "tbd",
    authors: ["tbd"],
    date: pageProps.Date.date.start,
    head: pageProps,
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

  // console.log(block.type, isValid)
  // if (["image", "video"].includes(block.type)) {
  //   console.log(block[block.type])
  // }

  // isValid && console.log(block.type, nextType)

  const annotations = isValid && block[block.type].text
    .map(entry => Object.assign({}, entry.annotations)) || false

  // Collect block styling / text decoration attributes
  annotations && annotations
    .forEach(anno => {
      Object.keys(anno).forEach(function (key) {
        if (anno[key] === false || anno[key] === "default") {
          delete anno[key];
        }
      });
    })

  const isMedia = ["image", "video"].includes(block.type) || false
  // TODO: if image, download and store locally
  // console.log(isMedia)
  // isMedia && console.log(block.type)
  // isMedia && console.log(isMedia, block[block.type].caption.length)
  // isMedia && console.log(block[block.type].caption[0].plain_text)
  // isMedia && console.log(block[block.type].external.url)

  return {
    block_type: block.type || "[ERROR]",
    isMedia: isMedia,
    text: isValid ? block[block.type].text.map(entry => entry.plain_text) : "[ERROR]",
    parsedText: isValid ? parseRichText(block[block.type].text) : "[ERROR]",
    annotations: annotations || false,
    children: block.has_children ? block.children : false,
    next_block_type: nextType || false,
    // raw_content: block[block.type] || "[ERROR]",
    // rest: block
    url: isMedia ? block[block.type].external.url : false,
    // caption: isMedia ? block[block.type].caption.length : false,
    // caption: isMedia ? parseFragment(block[block.type].caption[0]).toUpperCase() : false,
    // caption: isMedia ? block[block.type].caption[0].text.content : false,
    // caption: isMedia ? block[block.type].caption.map(frag => parseFragment(frag)) : false
    caption: isMedia ? parseRichText(block[block.type].caption) : false

  }
}

// keep in sync with `css/notion.css`
/** for official NOTION colors, see
 *  https: //docs.super.so/notion-colors
 */

const colorMapper = {
  default: false,
  gray: "gray",
  brown: "brown",
  orange: "orange",
  yellow: "yellow",
  green: "green",
  blue: "blue",
  purple: "purple",
  pink: "pink",
  red: "red",
  defaultBackground: false,
  gray_background: "gray-bg",
  brown_background: "brown-bg",
  orange_background: "orange-bg",
  yellow_background: "yellow-bg",
  green_background: "green-bg",
  blue_background: "blue-bg",
  purple_background: "purple-bg",
  pink_background: "pink-bg",
  red_background: "red-bg"
};

// process a whole block
const parseRichText = function (block) {
  return block.map(entry => parseFragment(entry)).flat()
}

// atomic: process a single formatted block fragment
const parseFragment = function (textFragment) {

  // console.log(textFragment);

  if (!textFragment || !textFragment.text) {
    return null;
  }

  const hasAttributes = textFragment.annotations.color !== "default" || Object.values(textFragment.annotations).some(val => val === true)
  const isShortcode = (textFragment.annotations.code && textFragment.text.content.match(/^\[/)) ? true : false
  const isLinked = textFragment.href ? true : false
  const innerText = isLinked ?
    `<a href='${textFragment.text.link.url}' target='_blank' rel='noopener noreferrer'>${textFragment.text.content}</a>` :
    textFragment.text.content

  // isShortcode && console.log(isShortcode, textFragment.text.content, "|", textFragment.annotations.color)

  if (isShortcode) {
    return parseShortcode(textFragment.text.content)
  }

  if (hasAttributes) {
    const {
      bold,
      code,
      color,
      italic,
      strikethrough,
      underline
    } = textFragment.annotations;

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

// Custom parser for [shortcode 'param' ...]
const parseShortcode = (block) => {
  // const shortcodeType = block.match(/\[(.*)\s'(.*)\s?'\]/) // 2 params
  const shortcodeType = block.match(/\[(.*?)\s'(.*?)'\s?'?(.*?)?'?\]/) // 2 params + optional 3rd i.e. for figcaption
  // console.log(shortcodeType) // [full string, shortcode, payload, (figcaption)]
  switch (shortcodeType[1]) {
    case "blockquote": // TODO: deprecate
      return `<blockquote>${shortcodeType[2]}</blockquote>`;
    case "img": // TODO: deprecate
      return `<figure><img src="${shortcodeType[2]}" alt="${shortcodeType[3]}"/><figcaption>${shortcodeType[3] || ""}</figcaption></figure>`;
    case "footnote":
      return `<sup>[${shortcodeType[2]}]</sup>`;
    case "youtube":
      return `<figure class="youtube-wrapper"><iframe class="youtube" src="https://www.youtube-nocookie.com/embed/${shortcodeType[2]}" frameborder="0"></iframe>
      <figcaption>${shortcodeType[3] || ""}</figcaption></figure>`;
    default:
      return `<div class="shortcode-error">${block}</div>`;
  }
}

/** Util: write local JSON file output  */
// TODO: move into `/utils/
const writeJSON = (json, filename = "json/log.json") => {

  if (!fs.existsSync("json")) {
    fs.mkdirSync("json");
  }

  const data = JSON.stringify(json, null, 2);
  fs.writeFile(filename, data, (err) => {
    if (err) {
      throw err;
    }
    // console.log(`JSON saved: ${filename}`);
  });
}

module.exports = {
  fetchBlocks,
  parsePage,
  writeJSON
}
