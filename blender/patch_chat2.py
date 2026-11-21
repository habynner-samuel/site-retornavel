import io, os, sys
p = os.path.join(sys.argv[1], 'site/chat.js')
s = io.open(p, encoding='utf-8').read()
R = [
 ("$('#chat-kw').addEventListener('click', e => { if (e.target.tagName === 'BUTTON') send(e.target.textContent); });",
  "$('#chat-kw').addEventListener('click', e => { const b = e.target.closest('button'); if (b) send(b.dataset.kw || b.textContent); });"),
 ("C = fresh(origem); $msgs.textContent = '';", "C = fresh(origem); $msgs.textContent = ''; lastWho = null;"),
 ("C = saved; C.replies = C.replies || []; $msgs.textContent = '';", "C = saved; C.replies = C.replies || []; $msgs.textContent = ''; lastWho = null;"),
 ("queue = []; C = fresh('site'); $msgs.textContent = '';", "queue = []; C = fresh('site'); $msgs.textContent = ''; lastWho = null;"),
]
for a, b in R:
    if a not in s: print('NAO ACHEI', a[:60]); continue
    s = s.replace(a, b)
io.open(p, 'w', encoding='utf-8').write(s)
print('ok')
