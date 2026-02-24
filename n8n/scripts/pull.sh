#!/bin/bash

# pull.sh - Pull a workflow from n8n and save to repo
# Usage: ./pull.sh <workflow-name>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
N8N_DIR="$(dirname "$SCRIPT_DIR")"
WORKFLOWS_DIR="$N8N_DIR/workflows"
ENV_FILE="$N8N_DIR/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if workflow name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Workflow name is required${NC}"
    echo "Usage: ./pull.sh <workflow-name>"
    exit 1
fi

WORKFLOW_NAME="$1"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: .env file not found at $ENV_FILE${NC}"
    echo "Please create .env file with N8N_HOST and N8N_API_KEY"
    echo "See .env.example for reference"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Validate required env vars
if [ -z "$N8N_HOST" ]; then
    echo -e "${RED}Error: N8N_HOST not set in .env${NC}"
    exit 1
fi

if [ -z "$N8N_API_KEY" ]; then
    echo -e "${RED}Error: N8N_API_KEY not set in .env${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

echo -e "${YELLOW}Fetching workflows from n8n...${NC}"

# Get all workflows to find the one we want
WORKFLOWS_RESPONSE=$(curl -s -X GET \
    "${N8N_HOST}/api/v1/workflows" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json")

# Check if the API call was successful
if echo "$WORKFLOWS_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$WORKFLOWS_RESPONSE" | jq -r '.message')
    echo -e "${RED}Error from n8n API: $ERROR_MSG${NC}"
    exit 1
fi

# Find workflow by name
WORKFLOW_ID=$(echo "$WORKFLOWS_RESPONSE" | jq -r ".data[] | select(.name == \"$WORKFLOW_NAME\") | .id")

if [ -z "$WORKFLOW_ID" ] || [ "$WORKFLOW_ID" == "null" ]; then
    echo -e "${RED}Error: Workflow '$WORKFLOW_NAME' not found${NC}"
    echo ""
    echo "Available workflows:"
    echo "$WORKFLOWS_RESPONSE" | jq -r '.data[].name' | sed 's/^/  - /'
    exit 1
fi

echo -e "${GREEN}Found workflow: $WORKFLOW_NAME (ID: $WORKFLOW_ID)${NC}"

# Fetch the full workflow
echo -e "${YELLOW}Downloading workflow...${NC}"

WORKFLOW_RESPONSE=$(curl -s -X GET \
    "${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json")

# Check if the API call was successful
if echo "$WORKFLOW_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$WORKFLOW_RESPONSE" | jq -r '.message')
    echo -e "${RED}Error from n8n API: $ERROR_MSG${NC}"
    exit 1
fi

# Save to file with pretty print
OUTPUT_FILE="$WORKFLOWS_DIR/${WORKFLOW_NAME}.json"
echo "$WORKFLOW_RESPONSE" | jq '.' > "$OUTPUT_FILE"

echo -e "${GREEN}Success! Workflow saved to:${NC}"
echo "  $OUTPUT_FILE"
echo ""
echo -e "${YELLOW}Workflow details:${NC}"
echo "  Name: $(echo "$WORKFLOW_RESPONSE" | jq -r '.name')"
echo "  ID: $(echo "$WORKFLOW_RESPONSE" | jq -r '.id')"
echo "  Active: $(echo "$WORKFLOW_RESPONSE" | jq -r '.active')"
echo "  Nodes: $(echo "$WORKFLOW_RESPONSE" | jq '.nodes | length')"
