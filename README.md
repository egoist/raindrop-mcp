# raindrop-mcp

An MCP server for [Raindrop.io](https://raindrop.io).

## Usage

Create an access token on [Raindrop.io](https://app.raindrop.io/settings/integrations):

1. create an application
2. create a test token
3. copy the test token

JSON config for `raindrop-mcp` as `stdio` server:

```json
{
  "mcpServers": {
    "raindrop": {
      "command": "npx",
      "args": ["-y", "raindrop-mcp"],
      "env": {
        "RAINDROP_ACCESS_TOKEN": "<your-token>"
      }
    }
  }
}
```

Alternatively you can run it as:

- sse server: `npx -y raindrop-mcp --sse`
- streamable http server: `npx -y raindrop-mcp --http`

## Capabilities

- Search bookmarks
- Create bookmarks

## License

MIT.
