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

const parsePage = async (notion, page) => {

  // console.log(Object.keys(page))
  console.log("Page: ", page.child_page.title)

  let blocks = await fetchBlocks(notion, page.id);

  let blocksLength = blocks.results.length

  let blocksBody = blocks.results
    .map((block, index) => {
      // look up next block type (i.e. as a pointer for <ul></ul>)
      let nextType = index < (blocksLength - 1) ?
        blocks.results[index + 1].type :
        false
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

  // Collect block styling / text decoration attributes
  annotations && annotations
    .forEach(anno => {
      Object.keys(anno).forEach(function (key) {
        if (anno[key] === false || anno[key] === "default") {
          delete anno[key];
        }
      });
    })

  return {
    block_type: block.type || "[ERROR]",
    text: isValid ? block[block.type].text.map(entry => entry.plain_text) : "[ERROR]",
    parsedText: isValid ? block[block.type].text.map(entry => parseText(entry)).flat() : "[ERROR]",
    annotations: annotations || false,
    children: block.has_children ? block.children : false,
    next_block_type: nextType || false,
    // raw_content: block[block.type] || "[ERROR]",
    // rest: block
  }
}

// keep in sync with custom CSS classes

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
  red: "red"
};

const parseText = function (block) {

  // console.log(block);

  if (!block) {
    return null;
  }

  const hasAttributes = block.annotations.color !== "default" || Object.values(block.annotations).some(val => val === true)
  const isShortcode = block.annotations.code && block.text.content.match(/^\[/) ? true : false
  const isLinked = block.href ? true : false
  const innerText = isLinked ?
    `<a href='${block.text.link.url}' target='_blank' rel='noopener noreferrer'>${block.text.content}</a>` :
    block.text.content

  // console.log(hasAttributes, block.text.content, block.annotations.color)

  if (isShortcode) {
    return parseShortcode(block.text.content)
  }

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

const parseShortcode = (block) => {
  // const shortcodeType = block.match(/\[(.*)\s'(.*)\s?'\]/) // 2 params
  const shortcodeType = block.match(/\[(.*?)\s'(.*?)'\s?'?(.*?)?'?\]/) // 2 params + optional 3rd i.e. for figcaption
  // console.log(shortcodeType) // [full string, shortcode, payload, (figcaption)]
  switch (shortcodeType[1]) {
    case "blockquote":
      return `<blockquote>${shortcodeType[2]}</blockquote>`;
    case "img":
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

module.exports = {
  fetchBlocks,
  parsePage
}
