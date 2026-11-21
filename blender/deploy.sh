#!/usr/bin/env bash
# Publica o site em https://retornavel.site.
# O projeto site-retornavel da Vercel publica sozinho o que chega ao main do GitHub,
# então publicar = montar o index.html, conferir que está tudo commitado e enviar o main.
set -e
W="$(cd "$(dirname "$0")/.." && pwd)"
cd "$W"

python blender/build.py blender site

if [ -n "$(git status --porcelain -- site blender)" ]; then
  echo "Há mudanças sem commit em site/ ou blender/. Faça o commit e rode de novo:"
  git status --short -- site blender
  exit 1
fi

if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
  echo "Publique a partir do main (branch atual: $(git rev-parse --abbrev-ref HEAD))."
  exit 1
fi

git push origin main
echo "Enviado. A Vercel publica em https://retornavel.site em cerca de 10 segundos."
