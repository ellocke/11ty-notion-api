# 11ty-notion-api

> Last Update: 2022-02-16  
> switched to database approach instead of parent root page

[![Netlify Status](https://api.netlify.com/api/v1/badges/743e0288-f4c6-4ba0-9537-e74b2134cf95/deploy-status)](https://app.netlify.com/sites/11ty-notion-cms/deploys)

**Current state**: [https://11ty-notion-cms.netlify.app/](https://11ty-notion-cms.netlify.app/)

Proof-of-concept for fetching pages / blocks from Notion (via official [Notion API beta](https://developers.notion.com/changelog)) with the Eleventy static website builder's global data functionality.

![](https://pbs.twimg.com/media/E8dX4i5WUAcLcQL?format=png&name=4096x4096)

> ~~See the [Notion Source Documents](https://fubits.notion.site/fubits/Notion-CMS-Test-dbfab7a2a2bf476d96fb50222ff0c481)~~

## Quickstart

- `npm install`
- create `.env` for `{dotenv}`
  - add `NOTION_API_KEY="your_token"`
  - add `MAIN_PAGE="id-of-root-page"` (will probably switch to root DB soon-ish)
- `npm run dev`

## Approach

1. `src/_data/database.js`: Fetch ~~pages~~ database entries (~pages) from Notion

   - `.cache/**`: cache locally
   - `json/articles.json`: store / track locally (optional)

2. `utils/parsePage.js`: Process the blocks (of `type: supported` or with custom `[shortcodes]`)]) with JS
3. `src/index.njk`: Render / parse the blocks with Eleventy

## TODO

- [x] implement page retrieval
- [ ] abandon `{{- elem | safe -}}`
- [ ] implement [database](https://developers.notion.com/reference/database) retrieval
  - [ ] implement page / db entry metadata (front matter)
- Eleventy: use a blog template / logic
- [x] figure out how to wrap the parent-less list items in `<ul></ul>`
- [x] implement shortcodes for
  - [x] `[blockquote 'payload']`
  - [x] `[img 'url' 'figcaption']`
  - [x] `[footnote 'payload']` (as `<sup></sup>`)
- [x] add formatting for Headings
- [ ] figure out how to enable CSS edge cases such as `text-decoration: underline line-through`
- [ ] implement more block types
  - [x] implement `[code]`
  - [x] implement `[todo]`
  - [x] implement `[callout]`
  - [x] implement `[quote]`
  - [x] implement `[image]`
    - [ ] add local caching / download
  - [ ] implement `[video]`
  - [ ] implement `[embed]`
  - [ ] implement `[file]`
  - [ ] implement hyperlinks
