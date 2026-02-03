---
description: Print the master task list.
agent: ep
---
Show the contents of the master task list:

!`node -e "console.log(require('fs').readFileSync('docs/tasks/DOCS_TASK_LIST.md','utf8'))"`
