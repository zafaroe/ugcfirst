#!/bin/bash

# backup-all.sh - Backup all workflows from n8n to repo
# Usage: ./backup-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
N8N_DIR="$(dirname "$SCRIPT_DIR")"
WORKFLOWS_DIR="$N8N_DIR/workflows"
ENV_FILE="$N8N_DIR/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  n8n Workflow Backup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Fetching workflows from n8n...${NC}"
echo "Host: $N8N_HOST"
echo ""

# Get all workflows
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

# Get workflow count
WORKFLOW_COUNT=$(echo "$WORKFLOWS_RESPONSE" | jq '.data | length')

if [ "$WORKFLOW_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No workflows found in n8n${NC}"
    exit 0
fi

echo -e "${GREEN}Found $WORKFLOW_COUNT workflow(s)${NC}"
echo ""

# Track statistics
BACKED_UP=0
FAILED=0

# Iterate through each workflow
echo "$WORKFLOWS_RESPONSE" | jq -c '.data[]' | while read -r workflow; do
    WORKFLOW_ID=$(echo "$workflow" | jq -r '.id')
    WORKFLOW_NAME=$(echo "$workflow" | jq -r '.name')

    # Sanitize workflow name for filename (replace spaces with dashes, remove special chars)
    SAFE_NAME=$(echo "$WORKFLOW_NAME" | tr ' ' '-' | tr -cd '[:alnum:]-_')

    echo -e "${YELLOW}Backing up: $WORKFLOW_NAME${NC}"

    # Fetch full workflow details
    WORKFLOW_RESPONSE=$(curl -s -X GET \
        "${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}" \
        -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
        -H "Content-Type: application/json")

    # Check if the API call was successful
    if echo "$WORKFLOW_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
        ERROR_MSG=$(echo "$WORKFLOW_RESPONSE" | jq -r '.message')
        echo -e "  ${RED}Failed: $ERROR_MSG${NC}"
        continue
    fi

    # Save to file
    OUTPUT_FILE="$WORKFLOWS_DIR/${SAFE_NAME}.json"
    echo "$WORKFLOW_RESPONSE" | jq '.' > "$OUTPUT_FILE"

    NODE_COUNT=$(echo "$WORKFLOW_RESPONSE" | jq '.nodes | length')
    IS_ACTIVE=$(echo "$WORKFLOW_RESPONSE" | jq -r '.active')

    echo -e "  ${GREEN}Saved: ${SAFE_NAME}.json${NC} (${NODE_COUNT} nodes, active: ${IS_ACTIVE})"
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Backup complete!${NC}"
echo ""
echo "Workflows saved to: $WORKFLOWS_DIR"
echo ""
echo "Files:"
ls -1 "$WORKFLOWS_DIR"/*.json 2>/dev/null | xargs -n1 basename | sed 's/^/  - /' || echo "  (none)"
