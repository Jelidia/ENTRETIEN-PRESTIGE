---
description: Rewrite a raw request into an AI-optimized prompt for this repo. Usage: /improve <request>
agent: ep
---

Rewrite the user request below into an **AI-optimized prompt** for this repository.

User request:
"""
$ARGUMENTS
"""

Output ONLY the optimized prompt, following:
- Goal
- Context (repo constraints)
- Plan (files + steps)
- Validation (exact commands)
- Definition of done
