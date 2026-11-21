import io, os, sys
W = sys.argv[1]
R = {
 'site/app.js': [
  ("(storeFilter === 'gelada' ? s.coldNow", "(storeFilter === 'disponivel' ? s.coldNow"),
  ("'Tem gelada hoje' : 'Sem gelada hoje'", "'Disponível hoje' : 'Em falta hoje'"),
 ],
 'site/map.js': [
  ('Com gelada hoje</span>', 'Disponível hoje</span>'),
  ('Sem gelada hoje</span>', 'Em falta hoje</span>'),
  ("'Tem retornável gelada hoje' : 'Sem gelada hoje'", "'Retornável disponível hoje' : 'Retornável em falta hoje'"),
  ('estado de gelada do dia', 'estoque de retornável do dia'),
 ],
 'site/chat.js': [
  ("'Retornável gelada perto de mim'", "'Lojas perto de mim'"),
  ("A gelada fica no seu saldo. retornavel.app/l", "A garrafa cheia fica no seu saldo. retornavel.app/l"),
  ("Lojas com gelada: retornavel.app/l", "Lojas: retornavel.app/l"),
  ("como saldo e pega a gelada quando quiser.", "como saldo e retira a próxima quando quiser."),
  ("ask(['Retornável gelada perto de mim', 'Usar meu saldo', 'Menu'])", "ask(['Lojas perto de mim', 'Usar meu saldo', 'Menu'])"),
  ("onde tem retornável gelada agora.", "quais lojas têm retornável hoje."),
  ("lojas com gelada perto de você:", "lojas com retornável perto de você:"),
  ("'A loja estava sem gelada'", "'A loja estava sem retornável'"),
  ("includes('sem gelada')", "includes('sem retornavel')"),
  ("A próxima com gelada é o Prezunic", "A próxima com retornável é o Prezunic"),
 ],
 'blender/sheets.html': [
  ('<strong>Retornável gelada</strong>', '<strong>Retornável disponível</strong>'),
  ('<span class="sr">Tem gelada</span>', '<span class="sr">Retornável disponível</span>'),
 ],
}
for f, pairs in R.items():
    p = os.path.join(W, f)
    s = io.open(p, encoding='utf-8').read()
    for a, b in pairs:
        if a not in s:
            print('NAO ACHEI', f, a[:50]); continue
        s = s.replace(a, b)
    io.open(p, 'w', encoding='utf-8').write(s)
print('ok')
