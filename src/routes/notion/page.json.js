import { Client } from "@notionhq/client"

const notion = new Client({
  auth: import.meta.env.VITE_NOTION_API_KEY,
})

export async function get() {
    const response = await notion.pages.retrieve({ page_id: pageId });
  return response;
}