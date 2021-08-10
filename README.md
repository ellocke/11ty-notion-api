# 11ty-notion-api

Proof-of-concept for fetching pages / blocks from Notion (via official [Notion API beta](https://developers.notion.com/changelog)) with the Eleventy static website builder's global data functionality.

![](https://pbs.twimg.com/media/E8dX4i5WUAcLcQL?format=png&name=4096x4096)

## Quickstart

- `npm install`
- create `.env` for `{dotenv}`
  - add `NOTION_API_KEY="your_token"`
  - add `MAIN_PAGE="id-of-root-page"` (will probably switch to root DB soon-ish)
- `npm run dev`

## TODO

- [x] figure out how to wrap the parent-less list items in `<ul></ul>`
- [x] implement shortcodes for
  - [x] `[blockquote 'payload']`
  - [x] `[img 'url' 'figcaption']`
  - [x] `[footnote 'payload']` (as `<sup></sup>`)
- [x] add formatting for Headings
- [ ] figure out how to enable CSS edge cases such as `text-decoration: underline line-through`
