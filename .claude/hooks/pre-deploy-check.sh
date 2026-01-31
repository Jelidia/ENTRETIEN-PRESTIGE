#!/bin/bash
# Pre-deployment checks - lightweight version

# This hook is disabled to avoid running expensive checks on every mention of "deploy"
# Run manual checks before deploying:
#   npm run build
#   npm run lint
#   npm test

# Silent exit - no output, no blocking
exit 0
