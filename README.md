# Apollo.io MCP Server (stdio)

A Model Context Protocol (MCP) server for Apollo.io lead generation that works with `manus-mcp-cli`.

## Installation

```bash
git clone https://github.com/KnightKrawlR/apollo-io-mcp-stdio.git
cd apollo-mcp-stdio
npm install
```

## Configuration

Add this to your Manus MCP configuration:

```json
{
  "mcpServers": {
    "apollo-lead-gen-local": {
      "command": "node",
      "args": ["/path/to/apollo-mcp-stdio/index.js"],
      "env": {
        "APOLLO_API_KEY": "YOUR_APOLLO_IO_API_KEY_HERE"
      }
    }
  }
}
```

Replace:
- `/path/to/apollo-mcp-stdio` with the actual path where you cloned this repo
- `YOUR_APOLLO_IO_API_KEY_HERE` with your Apollo.io API key from https://app.apollo.io/settings/api

## Available Tools

1. **organization_search** - Find companies by keywords, location, size, revenue
2. **people_search** - Find decision makers by title, seniority, company
3. **people_enrichment** - Get detailed contact information for a person
4. **organization_enrichment** - Get detailed company information

## Usage Examples

### Find HVAC Companies
```bash
manus-mcp-cli tool call organization_search --server apollo-lead-gen-local --input '{
  "q_organization_keyword_tags": ["hvac", "heating", "cooling"],
  "organization_locations": ["North Carolina"],
  "organization_num_employees_ranges": ["10,50"],
  "per_page": 25
}'
```

### Find Decision Makers
```bash
manus-mcp-cli tool call people_search --server apollo-lead-gen-local --input '{
  "person_titles": ["owner", "ceo", "president"],
  "q_organization_keyword_tags": ["hvac"],
  "organization_locations": ["Texas"],
  "per_page": 25
}'
```

## License

ISC
