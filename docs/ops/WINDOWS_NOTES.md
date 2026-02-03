# Windows & OneDrive notes for contributors

- Avoid storing this repo in OneDrive-synced folders; file locks and atomic operation races cause apply_patch failures.
- Recommended paths:
  - `C:\dev\entretien-prestige`
  - WSL: `/home/<user>/projects/entretien-prestige` (best)
- If you must keep it in OneDrive, create a junction:
  - Run as admin: `mklink /J C:\dev\entretien-prestige "C:\Users\<you>\OneDrive\Desktop\Entretien Prestige"`
- Use WSL for running OpenCode CLI where possible.
