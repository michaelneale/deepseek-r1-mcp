#!/bin/bash

# Test message for list_tools
echo '{"jsonrpc":"2.0","id":1,"method":"mcp.list_tools","params":{}}' | node dist/index.js

# Test message for reasoner tool
echo '{"jsonrpc":"2.0","id":2,"method":"mcp.call_tool","params":{"name":"reasoner","arguments":{"context":"How should I plan a small birthday party?"}}}' | node dist/index.js