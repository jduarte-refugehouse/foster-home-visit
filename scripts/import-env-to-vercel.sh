#!/bin/bash

# =============================================
# Import Environment Variables to Vercel
# =============================================
# This script reads a .env file and imports all variables to Vercel
#
# Usage:
#   1. Copy .env.example to .env and fill in your values
#   2. Run: ./scripts/import-env-to-vercel.sh [project-name] [environment]
#
# Examples:
#   ./scripts/import-env-to-vercel.sh my-project production
#   ./scripts/import-env-to-vercel.sh my-project preview
#   ./scripts/import-env-to-vercel.sh my-project development
#
# Environment options: production, preview, development, or all
# =============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed.${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

# Check if .env file exists
ENV_FILE="${1:-.env}"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    echo "Create it by copying .env.example to .env and filling in your values"
    exit 1
fi

# Get project name and environment from arguments
PROJECT_NAME="${2:-}"
ENVIRONMENT="${3:-all}"

if [ -z "$PROJECT_NAME" ]; then
    echo -e "${YELLOW}⚠️  No project name provided.${NC}"
    echo "Usage: $0 [env-file] [project-name] [environment]"
    echo ""
    echo "Available projects:"
    vercel projects ls 2>/dev/null | tail -n +2 | awk '{print "  - " $1}'
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|preview|development|all)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Must be one of: production, preview, development, or all"
    exit 1
fi

echo -e "${BLUE}📦 Importing environment variables to Vercel...${NC}"
echo "Project: $PROJECT_NAME"
echo "Environment: $ENVIRONMENT"
echo "Source file: $ENV_FILE"
echo ""

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    local env=$3
    
    # Skip comments and empty lines
    if [[ "$key" =~ ^#.*$ ]] || [ -z "$key" ]; then
        return
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    echo -e "${YELLOW}Setting $key for $env...${NC}"
    
    if vercel env add "$key" "$env" "$PROJECT_NAME" <<< "$value" 2>/dev/null; then
        echo -e "${GREEN}✅ Set $key for $env${NC}"
    else
        # Try to update if add fails (variable might already exist)
        echo -e "${YELLOW}⚠️  Variable $key might already exist, attempting update...${NC}"
        vercel env rm "$key" "$env" "$PROJECT_NAME" --yes 2>/dev/null || true
        vercel env add "$key" "$env" "$PROJECT_NAME" <<< "$value" 2>/dev/null && \
            echo -e "${GREEN}✅ Updated $key for $env${NC}" || \
            echo -e "${RED}❌ Failed to set $key for $env${NC}"
    fi
}

# Read .env file and import variables
IMPORTED=0
SKIPPED=0

while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Skip Vercel auto-set variables
    if [[ "$key" =~ ^VERCEL_ ]]; then
        echo -e "${YELLOW}⏭️  Skipping $key (auto-set by Vercel)${NC}"
        ((SKIPPED++))
        continue
    fi
    
    # Set for specified environment(s)
    if [ "$ENVIRONMENT" = "all" ]; then
        set_env_var "$key" "$value" "production"
        set_env_var "$key" "$value" "preview"
        set_env_var "$key" "$value" "development"
        ((IMPORTED+=3))
    else
        set_env_var "$key" "$value" "$ENVIRONMENT"
        ((IMPORTED++))
    fi
    
    echo ""
done < "$ENV_FILE"

echo -e "${GREEN}✅ Import complete!${NC}"
echo "Imported: $IMPORTED variables"
echo "Skipped: $SKIPPED variables (Vercel auto-set)"
echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo "1. Verify variables in Vercel Dashboard → Settings → Environment Variables"
echo "2. Redeploy your project to apply changes"
echo "3. Test your deployment"

