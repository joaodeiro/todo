#!/usr/bin/env bash
# Deploy do ToDo App na Vercel.
# Rode na pasta do projeto (~/Projects/Sistemas/todo) assim:
#   VERCEL_TOKEN=seu_token_aqui bash deploy.sh
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Precisa do Node.js instalado primeiro: https://nodejs.org (baixa o LTS)"
  exit 1
fi
: "${VERCEL_TOKEN:?Defina o token. Ex: VERCEL_TOKEN=vcp_xxx bash deploy.sh}"

SB_URL="https://fdbanrsvwhaluwabtejs.supabase.co"
SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmFucnN2d2hhbHV3YWJ0ZWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTkzMTQsImV4cCI6MjA5NTYzNTMxNH0.usXHGfJ3sWuavF55echFx3XUW8VJNU6yN9mj1_8mvT4"

echo "🚀 Publicando o ToDo App na Vercel..."
npx --yes vercel@latest deploy --prod --yes \
  --token "$VERCEL_TOKEN" \
  -b NEXT_PUBLIC_SUPABASE_URL="$SB_URL" -b NEXT_PUBLIC_SUPABASE_ANON_KEY="$SB_KEY" \
  -e NEXT_PUBLIC_SUPABASE_URL="$SB_URL" -e NEXT_PUBLIC_SUPABASE_ANON_KEY="$SB_KEY"

echo ""
echo "✅ Pronto! Copie a URL https://...vercel.app que apareceu acima e me mande aqui no chat."
