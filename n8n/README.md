# n8n Workflow Management

This folder contains version-controlled n8n workflows and scripts for managing them.

## Purpose

- **Version Control**: Track workflow changes in git
- **Backup**: Maintain copies of all workflows
- **Deployment**: Push workflow updates from repo to n8n
- **Collaboration**: Share workflows across team members

## Setup

### 1. Install Dependencies

The scripts require `jq` for JSON processing:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (via Chocolatey)
choco install jq
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit with your values
nano .env
```

### 3. Get Your n8n API Key

1. Open your n8n instance
2. Go to **Settings** (gear icon)
3. Navigate to **API**
4. Click **Create API Key**
5. Copy the key and add it to your `.env` file

### 4. Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

## Usage

### Pull a Workflow

Download a workflow from n8n and save it to the repo:

```bash
cd n8n/scripts
./pull.sh video-generation
```

This will save the workflow to `workflows/video-generation.json`

### Push a Workflow

Upload a workflow from the repo to n8n:

```bash
cd n8n/scripts
./push.sh video-generation
```

This will update the workflow in n8n and activate it.

### Backup All Workflows

Download all workflows from n8n:

```bash
cd n8n/scripts
./backup-all.sh
```

This will save all workflows to the `workflows/` folder.

## Folder Structure

```
n8n/
├── workflows/          # Workflow JSON files
│   └── *.json
├── scripts/
│   ├── pull.sh         # Pull workflow from n8n
│   ├── push.sh         # Push workflow to n8n
│   └── backup-all.sh   # Backup all workflows
├── docs/               # Workflow documentation
├── .env                # Your credentials (git-ignored)
├── .env.example        # Template for .env
└── README.md           # This file
```

## Workflow Naming Conventions

- Use **lowercase** with **dashes** for names
- Be descriptive but concise
- Examples:
  - `video-generation`
  - `user-onboarding`
  - `daily-backup`
  - `webhook-handler`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `N8N_HOST` | Your n8n instance URL | `https://n8n.example.com` |
| `N8N_API_KEY` | API key from n8n settings | `n8n_api_xxx...` |

## Best Practices

1. **Always pull before editing** - Get the latest version before making changes
2. **Commit after pulling** - Track changes in git history
3. **Test in n8n first** - Make sure workflows work before pushing
4. **Document complex workflows** - Add notes in the `docs/` folder
5. **Use descriptive commit messages** - Explain what changed in the workflow

## Troubleshooting

### "Workflow not found"

- Check the exact workflow name in n8n
- Names are case-sensitive
- Run `backup-all.sh` to see all available workflows

### "jq: command not found"

Install jq using the instructions in the Setup section.

### "API Error: Unauthorized"

- Check that your API key is correct
- Ensure the API key has the necessary permissions
- Verify the `N8N_HOST` URL is correct (no trailing slash)

### "Connection refused"

- Verify your n8n instance is running
- Check if you need VPN to access it
- Ensure the URL is correct (http vs https)
