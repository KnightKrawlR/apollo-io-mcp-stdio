#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Apollo.io API configuration
const APOLLO_API_BASE = 'https://api.apollo.io/v1';
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

if (!APOLLO_API_KEY) {
  console.error('Error: APOLLO_API_KEY environment variable is required');
  process.exit(1);
}

// Apollo API client
const apolloClient = axios.create({
  baseURL: APOLLO_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': APOLLO_API_KEY,
  },
});

// Create MCP server
const server = new Server(
  {
    name: 'apollo-lead-gen',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'organization_search',
        description: 'Search for companies/organizations in Apollo.io database. Use keywords like "hvac", "heating", "cooling" to find HVAC businesses. Filter by location, employee count, and revenue.',
        inputSchema: {
          type: 'object',
          properties: {
            q_organization_keyword_tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords to search for (e.g., ["hvac", "heating", "cooling"])',
            },
            organization_locations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Locations to filter by (e.g., ["North Carolina", "Atlanta, GA"])',
            },
            organization_num_employees_ranges: {
              type: 'array',
              items: { type: 'string' },
              description: 'Employee count ranges (e.g., ["10,50", "50,100"])',
            },
            revenue_range: {
              type: 'object',
              properties: {
                min: { type: 'number', description: 'Minimum revenue' },
                max: { type: 'number', description: 'Maximum revenue' },
              },
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
            },
            per_page: {
              type: 'number',
              description: 'Results per page (default: 25, max: 100)',
            },
          },
        },
      },
      {
        name: 'people_search',
        description: 'Search for people/contacts in Apollo.io database. Find decision makers by job title, seniority level, and company criteria.',
        inputSchema: {
          type: 'object',
          properties: {
            q_keywords: {
              type: 'string',
              description: 'Keywords to search in person profiles',
            },
            person_titles: {
              type: 'array',
              items: { type: 'string' },
              description: 'Job titles to search for (e.g., ["owner", "ceo", "president"])',
            },
            person_seniorities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Seniority levels (e.g., ["owner", "founder", "c_suite", "vp"])',
            },
            q_organization_keyword_tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Company keywords (e.g., ["hvac", "heating"])',
            },
            organization_locations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Company locations',
            },
            contact_email_status: {
              type: 'array',
              items: { type: 'string' },
              description: 'Email status filter (e.g., ["verified", "likely_to_engage"])',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
            },
            per_page: {
              type: 'number',
              description: 'Results per page (default: 25, max: 100)',
            },
          },
        },
      },
      {
        name: 'people_enrichment',
        description: 'Get detailed information about a specific person using their email or Apollo.io ID.',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Email address of the person',
            },
            id: {
              type: 'string',
              description: 'Apollo.io person ID',
            },
          },
        },
      },
      {
        name: 'organization_enrichment',
        description: 'Get detailed information about a specific organization using their domain or Apollo.io ID.',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'Company domain (e.g., "acmehvac.com")',
            },
            id: {
              type: 'string',
              description: 'Apollo.io organization ID',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'organization_search': {
        const response = await apolloClient.post('/mixed_companies/search', args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'people_search': {
        const response = await apolloClient.post('/mixed_people/search', args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'people_enrichment': {
        const response = await apolloClient.post('/people/match', args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'organization_enrichment': {
        const response = await apolloClient.post('/organizations/enrich', args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Apollo.io MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
