#!/usr/bin/env bash
# Sobe o ToDo App pro GitHub (joaodeiro/todo) e liga no projeto da Vercel.
#
# Rode NA TUA MÁQUINA, dentro da pasta do projeto:
#     bash subir-github.sh
# Pra ligar a Vercel junto, rode com o token:
#     VERCEL_TOKEN=vcp_xxx bash subir-github.sh
#
set -e
cd "$(dirname "$0")"

REPO="https://github.com/joaodeiro/todo.git"

echo "🧹 Resetando o git (a versão criada no sandbox fica incompleta)..."
rm -rf .git

echo "📦 Inicializando repositório limpo na branch main..."
git init -q -b main 2>/dev/null || { git init -q && git checkout -q -b main; }
git config user.name  >/dev/null 2>&1 || git config user.name  "João Deiro"
git config user.email >/dev/null 2>&1 || git config user.email "joao.deiro@taller.net.br"

git add -A
git commit -q -m "ToDo App v1 (G1-G5): Next.js App Router + Supabase + Vercel"

echo "🔗 Apontando pro GitHub: $REPO"
git remote add origin "$REPO" 2>/dev/null || git remote set-url origin "$REPO"

# Cria o repo no GitHub se você tiver o gh (GitHub CLI). Senão, crie vazio antes.
if command -v gh >/dev/null 2>&1; then
  gh repo view joaodeiro/todo >/dev/null 2>&1 || gh repo create joaodeiro/todo --private >/dev/null 2>&1 || true
else
  echo "ℹ️  Sem o gh instalado. Se o repo 'todo' ainda não existe,"
  echo "    crie ele VAZIO (sem README/licença) em https://github.com/new"
fi

echo "🚀 Enviando o código..."
git push -u origin main

# Liga o repo do GitHub ao projeto da Vercel -> push vira deploy automático.
if [ -n "$VERCEL_TOKEN" ]; then
  echo "🔌 Ligando o repo na Vercel..."
  npx --yes vercel@latest link --yes --project todo --token "$VERCEL_TOKEN" >/dev/null 2>&1 || true
  npx --yes vercel@latest git connect "$REPO" --yes --token "$VERCEL_TOKEN" \
    || echo "⚠️  Não rolou via CLI. Liga manual: Vercel -> projeto 'todo' -> Settings -> Git -> Connect."
else
  echo "⚠️  Pra ligar na Vercel automaticamente, rode de novo com:"
  echo "      VERCEL_TOKEN=vcp_xxx bash subir-github.sh"
  echo "    Ou liga manual: Vercel -> projeto 'todo' -> Settings -> Git -> Connect Git Repository -> joaodeiro/todo"
fi

echo ""
echo "✅ Pronto! Código em https://github.com/joaodeiro/todo"
echo "   Daqui pra frente: git push = deploy automático na Vercel."
