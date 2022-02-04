import { Client } from "@notionhq/client"

const notion = new Client({
  auth: import.meta.env.VITE_NOTION_API_KEY,
})

export async function get(){
    const blocks = [];
  let cursor;
  while (true) {
    const { results, next_cursor } = await notion.blocks.children.list({
      start_cursor: cursor,
      block_id: blockId,
    });
    blocks.push(...results);
    if (!next_cursor) {
      break;
    }
    cursor = next_cursor;
  }
  return blocks;
}