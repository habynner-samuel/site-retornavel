import io, os, sys
W = sys.argv[1]
p = os.path.join(W, 'site/styles.css')
s = io.open(p, encoding='utf-8').read()
new = io.open(os.path.join(W, 'blender/new.css'), encoding='utf-8').read()
# remove o chat antigo inteiro (substituído pelo novo)
a = s.index('/* Chat */'); b = s.index('/* ----------- Responsivo ----------- */')
s = s[:a] + new + '\n' + s[b:]
# ajustes no responsivo para o chat flutuante e o iPhone
s = s.replace('@media (max-width: 560px) {\n  body { font-size: 16px; }',
 '@media (max-width: 560px) {\n  .sheet--chat { padding: 0; }\n  .sheet__panel.chat { width: 100%; height: 100%; border-radius: 0; }\n  .chat-launch span { display: none; }\n  .chat-launch { padding: 16px; right: 16px; bottom: 16px; }\n  .iphone { width: min(290px, 86%); }\n  body { font-size: 16px; }', 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('ok', len(s))
