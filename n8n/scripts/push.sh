#!/bin/bash

# push.sh - Push a workflow from repo to n8n
# Usage: ./push.sh <workflow-name>

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
    echo "Usage: ./push.sh <workflow-name>"
    exit 1
fi

WORKFLOW_NAME="$1"
WORKFLOW_FILE="$WORKFLOWS_DIR/${WORKFLOW_NAME}.json"

# Check if workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo -e "${RED}Error: Workflow file not found: $WORKFLOW_FILE${NC}"
    echo ""
    echo "Available workflows:"
    ls -1 "$WORKFLOWS_DIR"/*.json 2>/dev/null | xargs -n1 basename | sed 's/\.json$//' | sed 's/^/  - /' || echo "  (none)"
    exit 1
fi

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

# Read workflow file and extract ID
WORKFLOW_ID=$(jq -r '.id' "$WORKFLOW_FILE")

if [ -z "$WORKFLOW_ID" ] || [ "$WORKFLOW_ID" == "null" ]; then
    echo -e "${RED}Error: Could not extract workflow ID from $WORKFLOW_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Pushing workflow to n8n...${NC}"
echo "  File: $WORKFLOW_FILE"
echo "  ID: $WORKFLOW_ID"

# Update the workflow
RESPONSE=$(curl -s -X PUT \
    "${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$WORKFLOW_FILE")

# Check if the API call was successful
if echo "$RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message')
    echo -e "${RED}Error from n8n API: $ERROR_MSG${NC}"
    exit 1
fi

echo -e "${GREEN}Workflow updated successfully!${NC}"

# Activate the workflow
echo -e "${YELLOW}Activating workflow...${NC}"

ACTIVATE_RESPONSE=$(curl -s -X POST \
    "${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}/activate" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json")

# Check activation response
if echo "$ACTIVATE_RESPONSE" | jq -e '.active' > /dev/null 2>&1; then
    IS_ACTIVE=$(echo "$ACTIVATE_RESPONSE" | jq -r '.active')
    if [ "$IS_ACTIVE" == "true" ]; then
        echo -e "${GREEN}Workflow activated successfully!${NC}"
    else
        echo -e "${YELLOW}Warning: Workflow may not be active${NC}"
    fi
else
    echo -e "${YELLOW}Warning: Could not verify activation status${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"
echo "  Name: $(jq -r '.name' "$WORKFLOW_FILE")"
echo "  ID: $WORKFLOW_ID"
echo "  URL: ${N8N_HOST}/workflow/${WORKFLOW_ID}"
