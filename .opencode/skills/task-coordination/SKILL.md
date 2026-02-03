---
name: task-coordination
description: Maintain the master task list and enforce WIP rules using docs/tasks/DOCS_TASK_LIST.md.
---

Steps:
1) Read `docs/tasks/DOCS_TASK_LIST.md`.
2) To claim a task, append ` [WIP: <owner> <YYYY-MM-DD>]` to that line.
3) If any WIP tag exists on a task line, do not work that task.
4) When finished, delete the entire completed task line.
5) If stopping without finishing, remove your WIP tag.
6) Do not create task lists anywhere else.
