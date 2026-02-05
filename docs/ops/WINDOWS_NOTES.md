# Windows & OneDrive notes for contributors

- Avoid storing this repo in OneDrive-synced folders; file locks and atomic operation races cause apply_patch failures.
- Recommended paths:
  - `C:\dev\field-service-platform`
  - WSL: `/home/<user>/projects/field-service-platform` (best)
- If you must keep it in OneDrive, create a junction:
  - Run as admin: `mklink /J C:\dev\field-service-platform "C:\Users\<you>\OneDrive\Desktop\FieldServicePlatform"`
- Use WSL for running OpenCode CLI where possible.
