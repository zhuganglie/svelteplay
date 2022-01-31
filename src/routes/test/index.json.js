import { Client } from "@notionhq/client"
const notion = new Client({
  auth: import.meta.env.VITE_NOTION_API_KEY,
})

export async function get() {
 const databaseId = "99cd7cd203de4d0baea091778105b124"
 const response = await notion.databases.query({
    database_id: databaseId,
 })
 console.log(response.results)
    return {
        body:  response.results
    }
}