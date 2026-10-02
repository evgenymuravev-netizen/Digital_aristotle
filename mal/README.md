# mal — clickable prototype (unofficial concept)

An independent, exportable HTML prototype branded for **mal.ai** — functionally identical to the Noor-branded build
on branch `claude/busy-franklin-nzj9eu`: 175 deep-linked scenarios (onboarding, Lean-style open-finance
linking, all-banks money view, agentic AI, the full Zakat engine, debt intelligence, Arabic/RTL,
agents + approvals feed).

**Not affiliated with or endorsed by mal.ai.** Visual tokens are placeholders pending official
brand guidelines — swap them in one place: `css/app.css` and `css/shell.css` `:root` blocks
(`--lime` = accent — historic token name, now holds the gold; `--g0…--g3` = background ramp, `--ink` = text-on-accent).

## Run / export
No build step. Open `index.html` directly (works from `file://`), serve statically
(`python3 -m http.server`), or use `app.html` for the chrome-less standalone/iPhone mode.
