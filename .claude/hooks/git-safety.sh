#!/bin/bash
set -e

COMMAND=$(jq -r '.tool_input.command // empty' <<< "$(cat)")

# Hard block: never stage or commit a real .env file. .env.example is the
# only dotenv variant safe to commit (it holds placeholders, no live
# secrets). This is a hard "deny", not "ask" — there is no legitimate case
# for Claude to stage .env.local (Supabase/Finnhub credentials), so it
# shouldn't need a confirmation prompt to avoid it.
if echo "$COMMAND" | grep -qE '(^|[;&|]|\s)git\s+(add|commit)\b'; then
  if echo "$COMMAND" | grep -oE '\.env(\.[A-Za-z0-9_-]+)?' | grep -qv '^\.env\.example$'; then
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked: this command references a real .env file. Only .env.example may be committed — .env.local holds live Supabase/Finnhub secrets and must never enter git history."
  }
}
EOF
    exit 0
  fi

  if echo "$COMMAND" | grep -qE '(^|\s)(-f|--force)(\s|=|$)'; then
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked: -f/--force on git add/commit bypasses .gitignore, which is what keeps .env.local out of git history in the first place."
  }
}
EOF
    exit 0
  fi
fi

if echo "$COMMAND" | grep -qE '(^|[;&|]|\s)git\s+(commit|push)(\s|$)'; then
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "git commit/push requires explicit confirmation this turn (Sarmaya project rule: no auto commit/push)."
  }
}
EOF
  exit 0
fi

echo '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}'
exit 0
