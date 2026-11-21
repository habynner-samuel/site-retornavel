# Do WhatsApp para um site: como adaptar o Canal do Retornável

Base: documento "Canal WhatsApp do Retornável", versão 2 (22/10/2026). Este texto mostra o que muda quando o canal sai do WhatsApp e vira um site, mantendo a regra de "rápido, sem burocracia, mas seguro".

## A decisão principal

O site vira um **web app instalável (PWA)**. A pessoa abre pelo QR, usa na hora pelo navegador e, se quiser lembretes, adiciona à tela inicial. Não tem loja de aplicativos nem senha.

| No WhatsApp | No site |
|---|---|
| Número do WhatsApp identifica a pessoa | Celular + código de 6 dígitos por SMS no primeiro acesso. Depois, passkey (digital ou rosto do próprio celular) |
| Lista de até 10 opções e 3 botões de 20 caracteres | Telas livres, mas o menu continua com as mesmas 7 opções para não perder a simplicidade |
| Lembrete = mensagem de modelo (marketing, R$ 0,35 a 0,38 cada) | Notificação web push, sem custo por envio. SMS só como plano B |
| Janela de 24 horas | Não existe. A pessoa abre quando quiser |
| Código do Troca Fácil lido no chat | QR + código curto na tela, válido por 2 horas, lido pela câmera do lojista no site |
| Localização enviada no chat | Botão "Usar minha localização" do navegador. Não fica salva |
| PARAR / Apagar meus dados por texto | Botões fixos em Meus lembretes e em Privacidade |
| Flows para o lojista | Área do lojista no mesmo site, com login do CNPJ/celular da loja |

## Entrada sem burocracia

- **QR leva direto para a ação.** Cada QR (rótulo, gôndola, caixa, coletor, máquina) abre o site já na tela certa, com um parâmetro de origem (`?o=rotulo`, `?o=coletor-123`). Mesma ideia do código escondido na mensagem do WhatsApp.
- **Vale primeiro, cadastro depois.** No coletor e na máquina, o vale aparece antes de qualquer pergunta, como o documento já pedia. O cadastro só é exigido para guardar o saldo.
- **Login:** celular + código por SMS no primeiro acesso, depois oferecer passkey. Fontes do setor indicam login com passkey até 3,9 vezes mais rápido que SMS e resistente a phishing, mas o SMS continua necessário para quem troca de aparelho ou não tem passkey ([FIDO Alliance](https://fidoalliance.org/white-paper-displace-password-otp-authentication-with-passkeys/), [Corbado](https://www.corbado.com/blog/passkeys-vs-sms-otp)). Os números são de fornecedores e servem de referência, não de prova.
- **As 4 perguntas do cadastro continuam iguais** (frequência, dia, momento do lembrete, consentimento) e cabem numa tela só.

## Lembretes: o ponto que mais muda

- **Web push** funciona em Android direto do navegador. No iPhone só funciona depois que a pessoa adiciona o site à tela inicial (iOS 16.4 ou mais novo) e autoriza com um toque dentro do app ([MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [Pushpad](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications)).
- Por isso o site precisa de um **passo guiado "Adicionar à tela inicial"** só para quem usa iPhone e quer lembrete.
- **Plano B por SMS** para quem não instala: mesmo limite de um lembrete por ciclo. Tem custo por mensagem, a conferir com o provedor.
- As regras do documento continuam: um lembrete por ciclo, nada entre 21h e 7h, cancelar se a troca já aconteceu, pausar após dois ciclos sem resposta, ajuste do padrão só depois de três trocas e com confirmação.
- **Ganho principal:** o custo de R$ 14 mil a R$ 15 mil por mês para 10 mil pessoas (estimativa do Moises para lembretes classificados como marketing) cai para perto de zero no push. O SMS de reserva entra no orçamento só para a fatia que não instala.

## Segurança (o que precisa ficar no servidor)

O protótipo atual é só front-end com dados de exemplo. Na versão real:

1. **Código de uso assinado no servidor**, de uso único, válido por 2 horas, ligado ao telefone e invalidado assim que o lojista confirma. Nunca gerado no navegador.
2. **Troca só fecha com dupla confirmação** (lojista lê, consumidor confirma na tela), como no Troca Fácil.
3. **Teto diário no coletor** (6 garrafas por número) e limite de tentativas no login por SMS (por exemplo, 5 por hora por número e por IP).
4. **QR fixo do coletor com assinatura** para impedir QR falso colado por cima.
5. **Sessão em cookie `HttpOnly`, `Secure`, `SameSite=Lax`**, HTTPS obrigatório, cabeçalho de política de conteúdo (CSP) restrito.
6. **Área do lojista separada por perfil**, com registro de quem leu cada vale (vira a prestação de contas com o distribuidor).

## Privacidade (LGPD)

- Dados mínimos: telefone, padrão de compra declarado, origem do cadastro, data do consentimento, histórico de trocas.
- Localização usada só na busca, sem salvar.
- Consentimento separado e explícito para lembretes, com data registrada.
- Botões "Desligar lembretes" e "Apagar meus dados" sempre à vista.
- Dados da pesquisa do grupo só agregados.

A busca não trouxe orientação específica da ANPD sobre login por celular. Vale conferir antes da apresentação.

## O que o site não resolve (igual ao WhatsApp)

A ligação do vale com o estoque do lojista e com o sistema do distribuidor (SAP, troca de caixas de 12) continua dependendo da Andina e da Coca. O site só muda a porta de entrada.

## Benchmark de design (sites da Coca-Cola)

Olhando [coca-cola.com/br](https://www.coca-cola.com/br/pt) e [coca-colacompany.com](https://www.coca-colacompany.com):

- Interface em preto e branco. O vermelho entra em momentos de marca (hero, destaque), não em todo botão.
- Fonte própria TCCC Unity, títulos com espaçamento entre letras negativo (-1.5px em 38px). No Brasil o site usa Noto.
- Botões em pílula (raio total), cards com raio de 8px, fundos cinza muito claros (#F1F1F1 / #F2F2F2).
- Pouca animação: carrosséis e imagem grande, sem efeito de rolagem pesado.

O protótipo segue isso. Títulos em TCCC Unity Headline Black, destaques em TCCC Unity Text Bold e texto corrido em Inter Tight (falta o peso regular da Unity). O logotipo é montado com uma fonte de script parecida com a da marca; antes de mostrar fora do grupo, trocar pelo arquivo oficial do manual da marca.

## Decisões em aberto novas

- Quem mantém o domínio e o SMS (Coca, Andina ou o programa)?
- O site substitui o Troca Fácil no WhatsApp ou convive com ele no piloto?
- Testar no piloto quantas pessoas de iPhone realmente adicionam à tela inicial.
