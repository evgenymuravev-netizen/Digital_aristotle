#!/usr/bin/env bash
#
# install.sh — Install the Digital Aristotle agent into a target repo.
#
# Usage:
#   bash install.sh --target <path> [--domain <name>] [--artifact-types <list>]
#                   [--user <name>] [--role-model <name>] [--skills lenny|none]
#                   [--force]
#
# Example:
#   bash install.sh --target ~/data-analysis \
#                   --domain "Data Analysis" \
#                   --artifact-types "notebooks, analysis reports, data memos" \
#                   --user "Evgeny" \
#                   --role-model "TBD" \
#                   --skills none
#
# If flags are omitted, the script will prompt interactively.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/template"

# --- Defaults ---
TARGET=""
DOMAIN=""
ARTIFACT_TYPES=""
USER_NAME=""
ROLE_MODEL_NAME="TBD"
ROLE_MODEL_FILE=""
ROLE_MODEL_CONSENT="Not yet configured"
SKILLS_LIBRARY="none"
SKILLS_LIBRARY_STATUS="Not installed"
FORCE=0
DATE="$(date -u +%Y-%m-%d)"

# --- Parse flags ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)          TARGET="$2"; shift 2 ;;
    --domain)          DOMAIN="$2"; shift 2 ;;
    --artifact-types)  ARTIFACT_TYPES="$2"; shift 2 ;;
    --user)            USER_NAME="$2"; shift 2 ;;
    --role-model)      ROLE_MODEL_NAME="$2"; shift 2 ;;
    --skills)          SKILLS_LIBRARY="$2"; shift 2 ;;
    --force)           FORCE=1; shift ;;
    -h|--help)
      grep -E '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown flag: $1" >&2
      echo "Run with --help for usage." >&2
      exit 2
      ;;
  esac
done

# --- Prompt for missing required values ---
if [[ -z "$TARGET" ]]; then
  read -r -p "Target repo path (absolute): " TARGET
fi
if [[ -z "$DOMAIN" ]]; then
  read -r -p "Domain (e.g. 'PM Writing', 'Data Analysis'): " DOMAIN
fi
if [[ -z "$ARTIFACT_TYPES" ]]; then
  read -r -p "Artifact types (comma-separated, e.g. 'articles, drafts, frameworks'): " ARTIFACT_TYPES
fi
if [[ -z "$USER_NAME" ]]; then
  read -r -p "User name: " USER_NAME
fi

# --- Validate target ---
if [[ ! -d "$TARGET" ]]; then
  echo "Error: target '$TARGET' is not a directory." >&2
  exit 1
fi
TARGET="$(cd -- "$TARGET" && pwd)"  # resolve to absolute path

# --- Check for existing install ---
if [[ -f "$TARGET/CLAUDE.md" ]] && [[ $FORCE -eq 0 ]]; then
  echo "Warning: $TARGET/CLAUDE.md already exists." >&2
  read -r -p "Overwrite? (y/N) " reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    echo "Aborted. Use --force to skip this check." >&2
    exit 1
  fi
fi

# --- Resolve role model file name ---
if [[ -n "$ROLE_MODEL_NAME" ]] && [[ "$ROLE_MODEL_NAME" != "TBD" ]]; then
  # lowercase, spaces→dashes
  ROLE_MODEL_FILE="$(echo "$ROLE_MODEL_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-').md"
fi

# --- Skills library status ---
case "$SKILLS_LIBRARY" in
  lenny)
    SKILLS_LIBRARY_STATUS="Lenny PM skills (RefoundAI/lenny-skills) — will be installed"
    ;;
  none|"")
    SKILLS_LIBRARY_STATUS="No skills library installed. Weakness Engine will use interception prompts only."
    ;;
  *)
    SKILLS_LIBRARY_STATUS="Custom: $SKILLS_LIBRARY"
    ;;
esac

# --- Summary before install ---
echo ""
echo "========================================"
echo "Digital Aristotle — Install Summary"
echo "========================================"
echo "  Target:          $TARGET"
echo "  Domain:          $DOMAIN"
echo "  Artifact types:  $ARTIFACT_TYPES"
echo "  User:            $USER_NAME"
echo "  Role model:      $ROLE_MODEL_NAME"
echo "  Skills library:  $SKILLS_LIBRARY"
echo "  Date:            $DATE"
echo "========================================"
echo ""

if [[ $FORCE -eq 0 ]]; then
  read -r -p "Proceed with install? (Y/n) " reply
  if [[ "$reply" =~ ^[Nn]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# --- Copy template ---
echo ""
echo "→ Copying template into $TARGET ..."
# -a preserves structure but does not clobber existing unrelated files
cp -a "$TEMPLATE_DIR/." "$TARGET/"

# --- Substitute variables ---
# Use a python3 fallback if sed is unavailable, but sed works on linux/mac with empty -i arg.
echo "→ Substituting variables ..."

substitute_file() {
  local f="$1"
  # macOS sed requires empty string after -i; GNU sed does not. Try GNU first.
  if sed --version >/dev/null 2>&1; then
    # GNU sed
    sed -i \
      -e "s|{{DOMAIN}}|${DOMAIN//|/\\|}|g" \
      -e "s|{{ARTIFACT_TYPES}}|${ARTIFACT_TYPES//|/\\|}|g" \
      -e "s|{{USER}}|${USER_NAME//|/\\|}|g" \
      -e "s|{{DATE}}|${DATE}|g" \
      -e "s|{{ROLE_MODEL_NAME}}|${ROLE_MODEL_NAME//|/\\|}|g" \
      -e "s|{{ROLE_MODEL_FILE}}|${ROLE_MODEL_FILE//|/\\|}|g" \
      -e "s|{{ROLE_MODEL_CONSENT}}|${ROLE_MODEL_CONSENT//|/\\|}|g" \
      -e "s|{{SKILLS_LIBRARY_STATUS}}|${SKILLS_LIBRARY_STATUS//|/\\|}|g" \
      "$f"
  else
    # BSD/macOS sed
    sed -i '' \
      -e "s|{{DOMAIN}}|${DOMAIN//|/\\|}|g" \
      -e "s|{{ARTIFACT_TYPES}}|${ARTIFACT_TYPES//|/\\|}|g" \
      -e "s|{{USER}}|${USER_NAME//|/\\|}|g" \
      -e "s|{{DATE}}|${DATE}|g" \
      -e "s|{{ROLE_MODEL_NAME}}|${ROLE_MODEL_NAME//|/\\|}|g" \
      -e "s|{{ROLE_MODEL_FILE}}|${ROLE_MODEL_FILE//|/\\|}|g" \
      -e "s|{{ROLE_MODEL_CONSENT}}|${ROLE_MODEL_CONSENT//|/\\|}|g" \
      -e "s|{{SKILLS_LIBRARY_STATUS}}|${SKILLS_LIBRARY_STATUS//|/\\|}|g" \
      "$f"
  fi
}

# Walk the target and substitute in every .md, .tmpl file we just copied.
while IFS= read -r -d '' f; do
  substitute_file "$f"
done < <(find "$TARGET/CLAUDE.md" "$TARGET/data" "$TARGET/logs" "$TARGET/.claude/skills" \
           -type f \( -name '*.md' -o -name '*.tmpl' \) -print0 2>/dev/null)

# --- Install Lenny skills if requested ---
if [[ "$SKILLS_LIBRARY" == "lenny" ]]; then
  echo "→ Installing Lenny PM skills via npx ..."
  if command -v npx >/dev/null 2>&1; then
    (cd "$TARGET" && npx skills add RefoundAI/lenny-skills --yes)
  else
    echo "  Warning: npx not found. Skipping Lenny install."
    echo "  Install manually later: cd $TARGET && npx skills add RefoundAI/lenny-skills --yes"
  fi
fi

# --- Next steps ---
cat <<EOF

========================================
Install complete.
========================================

Next steps:

  1. cd $TARGET

  2. Edit the templates to fit your context:
     - data/domain-profile.md      (artifact definition + Bloom cues for your domain)
     - data/user-profile.md        (your goals, strengths, weak areas)
     - data/skill-routing.md       (weakness → interception prompt mapping)

  3. Add a role model when ready:
     - Create data/role-models/<name>.md following data/role-models/README.md
     - Update data/domain-profile.md with the role model's name and file path

  4. Start a Claude Code session in the repo. The Aristotle persona loads
     automatically from CLAUDE.md.

  5. Test it:
     /mode                 — see the current feedback mode
     /assess               — run a full assessment on an artifact
     /audit                — strategic alignment check

The first Calibration Log entry will be generated the first time you
signal satisfaction with an artifact ("this is good", "ship it",
"leave it all") or dismiss a weakness-engine interception.

EOF
