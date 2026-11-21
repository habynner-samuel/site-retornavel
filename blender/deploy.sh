#!/usr/bin/env bash
# Copia só os arquivos públicos do site e publica no Vercel pessoal.
set -e
W="$(cd "$(dirname "$0")/.." && pwd)"
D="$W/retornavel-chat"
rm -rf "$D/img" "$D/seq" "$D/bottle.js"
mkdir -p "$D/img" "$D/seq" "$D/fonts"
cp "$W/site/index.html" "$W/site/styles.css" "$W/site/app.js" "$W/site/chat.js" "$W/site/seq.js" "$W/site/map.js" "$W/site/fx.js" "$W/site/manifest.webmanifest" "$W/site/robots.txt" "$W/site/favicon.svg" "$W/site/favicon-32.png" "$W/site/apple-touch-icon.png" "$W/site/icon-512.png" "$D/"
cp "$W/site/img/"[0-9][0-9]-*.jpg "$W/site/img/"[0-9][0-9]-*.webp "$W/site/img/CREDITOS.txt" "$D/img/"
cp "$W/site/img/maquina-3d.webp" "$D/img/"
cp "$W/site/maquina.glb" "$D/"
cp "$W/site/seq/"*.webp "$D/seq/"
cp "$W/site/fonts/"*.woff2 "$W/site/fonts/TCCC-UnityText-Bold.ttf" "$W/site/fonts/coca-cola-ii.ttf" "$W/site/fonts/BetterWith-Narrow.ttf" "$D/fonts/"
rm -f "$D/fonts/TCCC-UnityHeadline-Black.ttf"
du -sh "$D"
cd /c/Users/habyn
vercel deploy "$(cygpath -w "$D")" --prod --yes --global-config 'C:\Users\habyn\.vercel-pessoal' 2>&1 | grep -iE "production|https://retornavel|error" | head -5
