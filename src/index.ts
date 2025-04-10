import { cac } from "cac"
import { version } from "../package.json"
import { startServer } from "./server"

const cli = cac(`fetch-mcp`)

cli
  .command("[...args]", "Start server")
  .option("--sse", "Use SSE transport")
  .option("--http [endpoint]", "Use Streamable HTTP transport")
  .action(async (args, flags) => {
    await startServer(
      flags.http
        ? {
            type: "http",
            endpoint: typeof flags.http === "string" ? flags.http : "/mcp",
          }
        : flags.sse
        ? { type: "sse" }
        : { type: "stdio" }
    )
  })

cli.version(version)
cli.help()
cli.parse()
