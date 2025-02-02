#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Ollama API endpoint
const OLLAMA_API_ENDPOINT = "http://localhost:11434/v1/chat/completions";

class OllamaManager {
  async getReasonerResponse(context: string) {
    const response = await fetch(OLLAMA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-r1:14b",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that helps with planning tasks."
          },
          {
            role: "user",
            content: `Can you assist in planning with this task?\n\n${context}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  }
}

const ollamaManager = new OllamaManager();

// The server instance
const server = new Server({
  name: "ollama-reasoner-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {
      reasoner: {
        description: "Get planning assistance for a given task or context using Ollama",
        inputSchema: {
          type: "object",
          properties: {
            context: { 
              type: "string", 
              description: "The task or context to get planning assistance for"
            }
          },
          required: ["context"],
        },
      }
    },
  },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "reasoner",
        description: "Get planning assistance for a given task or context using Ollama",
        inputSchema: {
          type: "object",
          properties: {
            context: { 
              type: "string", 
              description: "The task or context to get planning assistance for"
            }
          },
          required: ["context"],
        },
      },
    ],
  };
});

interface ToolArguments {
  [key: string]: any;
  context?: string;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const toolArgs = (args || {}) as ToolArguments;

  switch (name) {
    case "reasoner":
      if (!toolArgs.context) throw new Error("Missing context argument");
      const response = await ollamaManager.getReasonerResponse(toolArgs.context);
      return { content: [{ type: "text", text: response }] };
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  // Test Ollama connection on startup
  try {
    await fetch("http://localhost:11434/api/version");
    console.error("Connected to Ollama successfully.");
  } catch (error) {
    console.error('Failed to connect to Ollama:', error);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ollama Reasoner MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});