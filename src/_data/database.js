async function fetcher(url, method = "GET") {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`
    }
  });
}

async function getBlogs() {
  const res = await fetcher(
    `https://api.notion.com/v1/databases/${process.env.MAIN_PAGE}/query`,
    "POST"
  );
  const database = await res.json();
  return database.results;
}

async function getPage(blogId) {
  const res = await fetcher(`https://api.notion.com/v1/pages/${blogId}`);
  const blog = await res.json();
  return blog;
}

async function getBlocks(blogId) {
  const res = await fetcher(
    `https://api.notion.com/v1/blocks/${blogId}/children`
  );
  const blocks = await res.json();
  return blocks.results;
}

// module.exports = getBlogs()
