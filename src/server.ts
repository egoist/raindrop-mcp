import Polka from "polka"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { RestServerTransport } from "@chatmcp/sdk/server/rest.js"
import { version } from "../package.json"
import {
  CreateBookmarksSchema,
  Raindrop,
  SearchBookmarksSchema,
} from "./raindrop"
import { dump } from "js-yaml"
import { errorToToolResult } from "./utils"

const server = new McpServer(
  {
    name: "raindrop-mcp",
    version,
  },
  {
    capabilities: {
      logging: {},
      tools: {},
    },
  }
)

if (!process.env.RAINDROP_ACCESS_TOKEN) {
  throw new Error(`RAINDROP_ACCESS_TOKEN is not set`)
}

const raindrop = new Raindrop(process.env.RAINDROP_ACCESS_TOKEN)

server.tool(
  "search_bookmarks",
  "Search bookmarks from Raindrop.io",
  SearchBookmarksSchema,
  async (args) => {
    try {
      const res = await raindrop.searchBookmarks(args)
      return {
        content: [
          {
            type: "text",
            text: dump(res),
          },
        ],
      }
    } catch (error) {
      return errorToToolResult(error)
    }
  }
)

server.tool(
  "create_bookmarks",
  "Create bookmarks on Raindrop.io",
  CreateBookmarksSchema,
  async (args) => {
    try {
      const res = await raindrop.createBookmarks(args)
      return {
        content: [
          {
            type: "text",
            text: dump(res),
          },
        ],
      }
    } catch (error) {
      return errorToToolResult(error)
    }
  }
)

server.tool(
  "get_collections",
  "Get collections from Raindrop.io",
  {},
  async () => {
    try {
      const res = await raindrop.getCollections()
      return {
        content: [
          {
            type: "text",
            text: dump(res),
          },
        ],
      }
    } catch (error) {
      return errorToToolResult(error)
    }
  }
)
const port = Number(process.env.PORT || "3000")

export async function startServer(
  options:
    | { type: "http"; endpoint: string }
    | { type: "sse" }
    | { type: "stdio" }
) {
  if (options.type === "http") {
    const transport = new RestServerTransport({
      port,
      endpoint: options.endpoint,
    })
    await server.connect(transport)

    await transport.startServer()
  } else if (options.type === "sse") {
    const transports = new Map<string, SSEServerTransport>()

    const app = Polka()

    app.get("/sse", async (req, res) => {
      console.log(req)
      const transport = new SSEServerTransport("/messages", res)
      transports.set(transport.sessionId, transport)
      res.on("close", () => {
        transports.delete(transport.sessionId)
      })
      await server.connect(transport)
    })

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string
      const transport = transports.get(sessionId)
      if (transport) {
        await transport.handlePostMessage(req, res)
      } else {
        res.status(400).send("No transport found for sessionId")
      }
    })

    app.listen(port)
    console.log(`sse server: http://localhost:${port}/sse`)
  } else {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  }
}
