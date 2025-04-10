import { got, type Got } from "got"
import { z } from "zod"

export const SearchBookmarksSchema = {
  search: z.string().describe("The search query"),
  page: z.number().default(0).describe("The page number"),
  perpage: z.number().default(50).describe("The number of bookmarks per page"),
  sort: z.enum(["-created", "created"]).optional().describe(`Sort bookmarks`),
}

type SearchBookmarksOptions = z.infer<z.ZodObject<typeof SearchBookmarksSchema>>

export const CreateBookmarksSchema = {
  items: z.array(
    z.object({
      link: z.string().describe("The URL of this bookmark"),
      title: z.string().optional().describe("The bookmark title"),
      excerpt: z.string().optional().describe("The excerpt"),
    })
  ),
}

type CreateBookmarksOptions = z.infer<z.ZodObject<typeof CreateBookmarksSchema>>

export class Raindrop {
  got: Got

  constructor(apiKey: string) {
    this.got = got.extend({
      prefixUrl: "https://api.raindrop.io/rest/v1",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  }

  async searchBookmarks(options: SearchBookmarksOptions) {
    const request = this.got.get(`raindrops/0`, {
      searchParams: options,
    })
    const [res, json] = await Promise.all([request, request.json()])

    if (!res.ok) {
      throw new Error(
        `Failed to search bookmarks: ${res.statusCode}\n${res.body}`
      )
    }

    return json
  }

  async createBookmarks(options: CreateBookmarksOptions) {
    const request = this.got.post(`raindrops`, {
      json: {
        items: options.items.map((item) => {
          return {
            ...item,
            // let raindrop parse the title, description, and excerpt etc in the background
            pleaseParse: {},
          }
        }),
      },
    })

    const [res, json] = await Promise.all([request, request.json()])

    if (!res.ok) {
      throw new Error(
        `Failed to create bookmarks: ${res.statusCode}\n${res.body}`
      )
    }

    return json
  }

  async getCollections() {
    const request = this.got.get("collections")

    const [res, json] = await Promise.all([request, request.json()])

    if (!res.ok) {
      throw new Error(
        `Failed to get collections: ${res.statusCode}\n${res.body}`
      )
    }

    return json
  }
}
