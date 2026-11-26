# NOX

Rastreador pessoal de sono, progresso e conquistas. Os dados ficam só no aparelho (IndexedDB).

## Colocar no celular (Android)
O app precisa estar em um endereço `https://` para poder ser instalado. Abrir o `index.html` direto do arquivo não instala.

1. Publique o conteúdo desta pasta em uma hospedagem de arquivos estáticos (por exemplo GitHub Pages ou Netlify).
   - GitHub Pages: crie um repositório, envie todos os arquivos (mantendo as pastas), abra Settings > Pages, escolha o branch `main` e a pasta `/ (root)`.
2. Abra o endereço no Chrome do celular.
3. Menu (três pontos) > "Instalar app" ou "Adicionar à tela inicial".
4. Depois do primeiro carregamento, funciona sem internet.

A hospedagem só entrega os arquivos do app. Seus registros não são enviados para ela.

## Modo Vou dormir
Toque em "Vou dormir" na tela inicial. A notificação traz os botões de acordar e pausar e volta se for dispensada enquanto o cronômetro estiver ligado. Ao encerrar, o NOX mostra o resultado para conferir antes de salvar. Os segundos do cronômetro aparecem só dentro do app.

## Regras e extras
- No máximo 14 horas por dia; só dá para registrar a noite no próprio dia.
- O cronômetro desliga sozinho em 10 horas (aplicado quando o app ou a notificação são usados).
- Bolha de Sonhos: convites por link, sem servidor. Só noites do modo Vou dormir.
- Lembrete diário e backup automático dependem do que o Android e o Chrome permitem.

## XP e correções
- Prêmios ganhos hoje são desfeitos se a correção ou exclusão de um registro os invalidar.
- Sonecas são somadas ao registro do dia.

## Atualizar
Ao mudar qualquer arquivo, aumente o número da versão do cache em `sw.js` e publique de novo.

## Estrutura
- `js/logic.js`: regras (XP, níveis, missões, medalhas, estatísticas, backup)
- `js/db.js`: armazenamento local
- `js/app.js`: telas e interações
- `js/share.js`: imagem de conquista
- `css/styles.css`: visual
