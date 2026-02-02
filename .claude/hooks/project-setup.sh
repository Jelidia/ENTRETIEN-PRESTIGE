#!/bin/bash
# Project setup hook - silent mode

# Create necessary directories quietly
mkdir -p .claude/tmp 2>/dev/null || true
mkdir -p .claude/context 2>/dev/null || true
mkdir -p .claude/sessions 2>/dev/null || true

exit 0
